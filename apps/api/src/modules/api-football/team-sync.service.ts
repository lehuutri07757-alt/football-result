import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { ApiFootballService } from './api-football.service';
import { ApiTeamInfo, TeamSyncResult } from './interfaces';

const CACHE_KEY_TEAMS = 'api_football:teams';

@Injectable()
export class TeamSyncService {
  private readonly logger = new Logger(TeamSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly apiFootballService: ApiFootballService,
  ) {}

  /**
   * Sync teams for all active leagues
   */
  async syncAllActiveLeagues(): Promise<TeamSyncResult> {
    const result: TeamSyncResult = {
      totalFetched: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      syncedAt: new Date().toISOString(),
    };

    try {
      this.logger.log('Starting team sync for all active leagues...');

      // Get all active leagues
      const activeLeagues = await this.prisma.league.findMany({
        where: { isActive: true },
        include: { sport: true },
      });

      this.logger.log(`Found ${activeLeagues.length} active leagues`);

      for (const league of activeLeagues) {
        try {
          const leagueResult = await this.syncTeamsByLeague(
            league.externalId!,
            league.season || undefined,
          );

          result.totalFetched += leagueResult.totalFetched;
          result.created += leagueResult.created;
          result.updated += leagueResult.updated;
          result.skipped += leagueResult.skipped;
          result.errors.push(...leagueResult.errors);
        } catch (error) {
          const msg = `Failed to sync teams for league ${league.name}: ${error}`;
          this.logger.error(msg);
          result.errors.push(msg);
        }
      }

      this.logger.log(
        `Team sync complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.errors.length} errors`,
      );
    } catch (error) {
      const msg = `Team sync failed: ${error}`;
      this.logger.error(msg);
      result.errors.push(msg);
    }

    return result;
  }

  /**
   * Sync teams for a specific league
   */
  async syncTeamsByLeague(
    leagueExternalId: string,
    season?: string,
  ): Promise<TeamSyncResult> {
    const result: TeamSyncResult = {
      totalFetched: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      syncedAt: new Date().toISOString(),
    };

    try {
      this.logger.log(`Fetching teams for league ${leagueExternalId}, season ${season || 'current'}...`);

      // Fetch teams from API-Football
      const apiTeams = await this.apiFootballService.fetchTeams(
        parseInt(leagueExternalId, 10),
        season ? parseInt(season, 10) : undefined,
      );

      result.totalFetched = apiTeams.length;
      this.logger.log(`Fetched ${apiTeams.length} teams from API`);

      // Get football sport
      const footballSport = await this.getOrCreateFootballSport();

      // Sync each team
      for (const apiTeam of apiTeams) {
        try {
          if (!apiTeam.team?.id) {
            result.skipped++;
            continue;
          }

          const existing = await this.prisma.team.findFirst({
            where: { 
              externalId: apiTeam.team.id.toString(),
              sportId: footballSport.id,
            },
          });

          const teamData = {
            name: apiTeam.team.name,
            shortName: apiTeam.team.code || apiTeam.team.name.substring(0, 3).toUpperCase(),
            slug: this.generateSlug(apiTeam.team.name),
            logoUrl: apiTeam.team.logo,
            country: apiTeam.team.country,
            countryCode: apiTeam.team.code || null,
            sportId: footballSport.id,
            externalId: apiTeam.team.id.toString(),
            isActive: true,
          };

          if (existing) {
            await this.prisma.team.update({
              where: { id: existing.id },
              data: teamData,
            });
            result.updated++;
          } else {
            await this.prisma.team.create({
              data: teamData,
            });
            result.created++;
          }
        } catch (error) {
          const msg = `Failed to sync team ${apiTeam.team?.name}: ${error}`;
          this.logger.warn(msg);
          result.errors.push(msg);
        }
      }

      // Cache teams for this league
      const cacheKey = `${CACHE_KEY_TEAMS}:${leagueExternalId}:${season || 'current'}`;
      await this.redis.setJson(cacheKey, apiTeams, 86400); // 24h cache

      this.logger.log(
        `League ${leagueExternalId} sync: ${result.created} created, ${result.updated} updated`,
      );
    } catch (error) {
      const msg = `Failed to sync teams for league ${leagueExternalId}: ${error}`;
      this.logger.error(msg);
      result.errors.push(msg);
    }

    return result;
  }

  /**
   * Get teams count by league
   */
  async getTeamsCount(): Promise<{ total: number; byLeague: Record<string, number> }> {
    const total = await this.prisma.team.count();
    
    const byLeague = await this.prisma.team.groupBy({
      by: ['sportId'],
      _count: { id: true },
    });

    return {
      total,
      byLeague: byLeague.reduce((acc, item) => {
        acc[item.sportId] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Invalidate teams cache
   */
  async invalidateCache(): Promise<void> {
    const client = this.redis.getClient();
    const keys = await client.keys(`${CACHE_KEY_TEAMS}:*`);
    if (keys.length > 0) {
      await client.del(...keys);
    }
    this.logger.log('Teams cache invalidated');
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

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
