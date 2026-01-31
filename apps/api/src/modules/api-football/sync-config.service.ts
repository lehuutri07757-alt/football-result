import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { 
  ApiFootballSyncConfig, 
  DEFAULT_SYNC_CONFIG, 
  SETTING_KEYS 
} from './constants/api-football.constants';

@Injectable()
export class SyncConfigService implements OnModuleInit {
  private readonly logger = new Logger(SyncConfigService.name);
  private config: ApiFootballSyncConfig = DEFAULT_SYNC_CONFIG;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadConfig();
  }

  async loadConfig(): Promise<void> {
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { key: SETTING_KEYS.SYNC_CONFIG },
      });

      if (setting?.value && typeof setting.value === 'object') {
        this.config = this.mergeConfig(setting.value as Partial<ApiFootballSyncConfig>);
        this.logger.log('Sync config loaded from database');
      } else {
        this.logger.log('Using default sync config');
      }

      this.logConfig();
    } catch (error) {
      this.logger.warn(`Failed to load sync config: ${error}`);
    }
  }

  private mergeConfig(partial: Partial<ApiFootballSyncConfig>): ApiFootballSyncConfig {
    return {
      fixture: { ...DEFAULT_SYNC_CONFIG.fixture, ...partial.fixture },
      liveOdds: { ...DEFAULT_SYNC_CONFIG.liveOdds, ...partial.liveOdds },
      upcomingOdds: { ...DEFAULT_SYNC_CONFIG.upcomingOdds, ...partial.upcomingOdds },
      league: { ...DEFAULT_SYNC_CONFIG.league, ...partial.league },
      team: { ...DEFAULT_SYNC_CONFIG.team, ...partial.team },
      rateLimit: { ...DEFAULT_SYNC_CONFIG.rateLimit, ...partial.rateLimit },
    };
  }

  private logConfig(): void {
    this.logger.log(`Fixture: every ${this.config.fixture.intervalMinutes}min, enabled=${this.config.fixture.enabled}`);
    this.logger.log(`Live Odds: every ${this.config.liveOdds.intervalMinutes}min, max=${this.config.liveOdds.maxMatchesPerSync}, enabled=${this.config.liveOdds.enabled}`);
    this.logger.log(`Upcoming Odds: every ${this.config.upcomingOdds.intervalMinutes}min, max=${this.config.upcomingOdds.maxMatchesPerSync}, enabled=${this.config.upcomingOdds.enabled}`);
  }

  getConfig(): ApiFootballSyncConfig {
    return this.config;
  }

  async updateConfig(partial: Partial<ApiFootballSyncConfig>): Promise<ApiFootballSyncConfig> {
    this.config = this.mergeConfig(partial);

    await this.prisma.setting.upsert({
      where: { key: SETTING_KEYS.SYNC_CONFIG },
      create: {
        key: SETTING_KEYS.SYNC_CONFIG,
        value: this.config as object,
        category: 'api_football',
        description: 'API Football sync configuration',
        isPublic: false,
      },
      update: {
        value: this.config as object,
      },
    });

    this.logger.log('Sync config updated');
    this.logConfig();

    return this.config;
  }

  // Convenience getters
  get fixtureConfig() { return this.config.fixture; }
  get liveOddsConfig() { return this.config.liveOdds; }
  get upcomingOddsConfig() { return this.config.upcomingOdds; }
  get leagueConfig() { return this.config.league; }
  get teamConfig() { return this.config.team; }
  get rateLimitConfig() { return this.config.rateLimit; }
}
