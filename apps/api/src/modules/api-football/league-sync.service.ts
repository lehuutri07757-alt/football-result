import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { ApiFootballService } from './api-football.service';
import { ApiLeagueInfo, LeagueSyncResult, LeagueSyncConfig } from './interfaces';
import { buildLeagueSearchKey } from '../../common/utils/search-normalize';

const CACHE_KEY_LEAGUES = 'api_football:leagues';
const CACHE_KEY_TOP_LEAGUES = 'api_football:top_leagues';
const SETTING_KEY_SYNC_CONFIG = 'league_sync_config';

const DEFAULT_CONFIG: LeagueSyncConfig = {
  cacheTtlSeconds: 3600,
  syncIntervalMinutes: 60,
  enableAutoSync: true,
  onlyCurrentSeason: true,
};

@Injectable()
export class LeagueSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LeagueSyncService.name);
  private config: LeagueSyncConfig = DEFAULT_CONFIG;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly apiFootballService: ApiFootballService,
  ) {}

  async onModuleInit() {
    await this.loadConfig();
    this.setupAutoSync();
  }

  onModuleDestroy() {
    this.clearAutoSync();
  }

  private async loadConfig(): Promise<void> {
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { key: SETTING_KEY_SYNC_CONFIG },
      });

      if (setting?.value && typeof setting.value === 'object' && !Array.isArray(setting.value)) {
        this.config = { ...DEFAULT_CONFIG, ...(setting.value as unknown as LeagueSyncConfig) };
      }

      this.logger.log(`League sync config loaded: TTL=${this.config.cacheTtlSeconds}s, Interval=${this.config.syncIntervalMinutes}min`);
    } catch (error) {
      this.logger.warn(`Failed to load sync config, using defaults: ${error}`);
    }
  }

  private setupAutoSync(): void {
    this.clearAutoSync();

    if (!this.config.enableAutoSync) {
      this.logger.log('Auto sync is disabled');
      return;
    }

    const intervalMs = this.config.syncIntervalMinutes * 60 * 1000;
    this.syncInterval = setInterval(() => {
      void this.syncLeagues();
    }, intervalMs);

    this.logger.log(`Auto sync scheduled every ${this.config.syncIntervalMinutes} minutes`);
  }

  private clearAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async getConfig(): Promise<LeagueSyncConfig> {
    return this.config;
  }

  async updateConfig(newConfig: Partial<LeagueSyncConfig>): Promise<LeagueSyncConfig> {
    this.config = { ...this.config, ...newConfig };

    await this.prisma.setting.upsert({
      where: { key: SETTING_KEY_SYNC_CONFIG },
      create: {
        key: SETTING_KEY_SYNC_CONFIG,
        value: this.config as object,
        category: 'api_football',
        description: 'League sync configuration',
        isPublic: false,
      },
      update: {
        value: this.config as object,
      },
    });

    this.setupAutoSync();
    this.logger.log(`Config updated: TTL=${this.config.cacheTtlSeconds}s, Interval=${this.config.syncIntervalMinutes}min`);

    return this.config;
  }

  async getCachedLeagues(): Promise<ApiLeagueInfo[] | null> {
    return this.redis.getJson<ApiLeagueInfo[]>(CACHE_KEY_LEAGUES);
  }

  async getLeagues(forceRefresh = false): Promise<ApiLeagueInfo[]> {
    if (!forceRefresh) {
      const cached = await this.getCachedLeagues();
      if (cached) {
        this.logger.debug('Returning cached leagues');
        return cached;
      }
    }

    const leagues = await this.fetchLeaguesFromApi();
    await this.redis.setJson(CACHE_KEY_LEAGUES, leagues, this.config.cacheTtlSeconds);

    return leagues;
  }

  async syncLeagues(): Promise<LeagueSyncResult> {
    const result: LeagueSyncResult = {
      totalFetched: 0,
      created: 0,
      updated: 0,
      errors: [],
      syncedAt: new Date().toISOString(),
    };

    try {
      this.logger.log('Starting league sync...');

      const apiLeagues = await this.fetchLeaguesFromApi();
      result.totalFetched = apiLeagues.length;

      // Deactivate leagues not in the current API result set.
      // This prevents stale/old seasons (e.g. 2016) staying active forever.
      const activeExternalIds = apiLeagues.map((l) => l.league.id.toString());
      await this.prisma.league.updateMany({
        where: {
          externalId: { not: null, notIn: activeExternalIds },
          sport: { slug: 'football' },
        },
        data: { isActive: false },
      });

      const footballSport = await this.getOrCreateFootballSport();

      for (const apiLeague of apiLeagues) {
        try {
          const existing = await this.prisma.league.findFirst({
            where: {
              externalId: apiLeague.league.id.toString(),
              sportId: footballSport.id,
            },
            select: { id: true },
          });

          const currentSeason = apiLeague.seasons.find(s => s.current);
          const leagueData = {
            name: apiLeague.league.name,
            slug: this.generateSlug(apiLeague.league.name, apiLeague.country.name),
            country: apiLeague.country.name,
            countryCode: apiLeague.country.code,
            logoUrl: apiLeague.league.logo,
            season: currentSeason?.year?.toString(),
            sportId: footballSport.id,
            externalId: apiLeague.league.id.toString(),
            searchKey: buildLeagueSearchKey({
              name: apiLeague.league.name,
              slug: this.generateSlug(apiLeague.league.name, apiLeague.country.name),
              country: apiLeague.country.name,
            }),
          };

          if (existing) {
            await this.prisma.league.update({
              where: { id: existing.id },
              data: leagueData,
            });
            result.updated++;
          } else {
            await this.prisma.league.create({
              data: { ...leagueData, isActive: true },
            });
            result.created++;
          }
        } catch (error) {
          const msg = `Failed to sync league ${apiLeague.league.name}: ${error}`;
          this.logger.warn(msg);
          result.errors.push(msg);
        }
      }

      await this.redis.setJson(CACHE_KEY_LEAGUES, apiLeagues, this.config.cacheTtlSeconds);
      await this.invalidateTopLeaguesCache();

      this.logger.log(`League sync complete: ${result.created} created, ${result.updated} updated, ${result.errors.length} errors`);
    } catch (error) {
      const msg = `League sync failed: ${error}`;
      this.logger.error(msg);
      result.errors.push(msg);
    }

    return result;
  }

  async invalidateCache(): Promise<void> {
    const client = this.redis.getClient();
    await client.del(CACHE_KEY_LEAGUES);
    await client.del(CACHE_KEY_TOP_LEAGUES);
    this.logger.log('League cache invalidated');
  }

  private async invalidateTopLeaguesCache(): Promise<void> {
    const client = this.redis.getClient();
    const keys = await client.keys(`${CACHE_KEY_TOP_LEAGUES}:*`);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  }

  private async fetchLeaguesFromApi(): Promise<ApiLeagueInfo[]> {
    return this.apiFootballService.fetchAllLeagues(this.config.onlyCurrentSeason);
  }

  private async getOrCreateFootballSport() {
    let sport = await this.prisma.sport.findFirst({
      where: { slug: 'football' },
    });

    if (!sport) {
      sport = await this.prisma.sport.create({
        data: {
          name: 'Football',
          slug: 'football',
          icon: 'football',
          isActive: true,
          sortOrder: 1,
        },
      });
    }

    return sport;
  }

  private generateSlug(name: string, country: string | null): string {
    const base = `${country || ''}-${name}`.toLowerCase();
    return base
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async triggerManualSync(): Promise<LeagueSyncResult> {
    return this.syncLeagues();
  }

  getSyncStatus(): { nextRun: Date | null; isEnabled: boolean; intervalMinutes: number } {
    const nextRun = this.syncInterval 
      ? new Date(Date.now() + this.config.syncIntervalMinutes * 60 * 1000)
      : null;

    return {
      nextRun,
      isEnabled: this.config.enableAutoSync,
      intervalMinutes: this.config.syncIntervalMinutes,
    };
  }
}
