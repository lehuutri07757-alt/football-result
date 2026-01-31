import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { ApiFootballService } from './api-football.service';
import { ApiTeamInfo, TeamSyncResult } from './interfaces';

const CACHE_KEY_TEAMS = 'api_football:teams';
const PARALLEL_LEAGUE_BATCH_SIZE = 5;

@Injectable()
export class TeamSyncService {
  private readonly logger = new Logger(TeamSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly apiFootballService: ApiFootballService,
  ) {}

  async syncAllActiveLeagues(
    onProgress?: (progress: number, processedItems: number, totalItems: number) => Promise<void>,
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
      this.logger.log('Starting team sync for all active leagues...');

      const activeLeagues = await this.prisma.league.findMany({
        where: { isActive: true },
        include: { sport: true },
      });

      this.logger.log(`Found ${activeLeagues.length} active leagues`);
      const totalLeagues = activeLeagues.length;
      let processedLeagues = 0;

      for (let i = 0; i < activeLeagues.length; i += PARALLEL_LEAGUE_BATCH_SIZE) {
        const batch = activeLeagues.slice(i, i + PARALLEL_LEAGUE_BATCH_SIZE);
        const batchNumber = Math.floor(i / PARALLEL_LEAGUE_BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(activeLeagues.length / PARALLEL_LEAGUE_BATCH_SIZE);
        
        this.logger.log(`Processing league batch ${batchNumber}/${totalBatches} (${batch.length} leagues)`);

        const batchPromises = batch.map(async (league) => {
          try {
            return await this.syncTeamsByLeague(
              league.externalId!,
              league.season || undefined,
            );
          } catch (error) {
            const msg = `Failed to sync teams for league ${league.name}: ${error}`;
            this.logger.error(msg);
            return {
              totalFetched: 0,
              created: 0,
              updated: 0,
              skipped: 0,
              errors: [msg],
              syncedAt: new Date().toISOString(),
            } as TeamSyncResult;
          }
        });

        const batchResults = await Promise.all(batchPromises);

        for (const leagueResult of batchResults) {
          result.totalFetched += leagueResult.totalFetched;
          result.created += leagueResult.created;
          result.updated += leagueResult.updated;
          result.skipped += leagueResult.skipped;
          result.errors.push(...leagueResult.errors);
        }

        processedLeagues += batch.length;
        const progress = Math.round((processedLeagues / totalLeagues) * 100);
        
        if (onProgress) {
          await onProgress(progress, processedLeagues, totalLeagues);
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
      const parsedSeason = season ? parseInt(season, 10) : undefined;
      const effectiveSeason = parsedSeason && !isNaN(parsedSeason) ? parsedSeason : undefined;
      
      this.logger.log(`Fetching teams for league ${leagueExternalId}, season ${effectiveSeason || 'current'}...`);

      const apiTeams = await this.apiFootballService.fetchTeams(
        parseInt(leagueExternalId, 10),
        effectiveSeason,
      );

      result.totalFetched = apiTeams.length;
      this.logger.log(`Fetched ${apiTeams.length} teams from API for league ${leagueExternalId}`);

      if (apiTeams.length === 0) {
        return result;
      }

      const footballSport = await this.getOrCreateFootballSport();

      const validTeams = apiTeams.filter(t => t.team?.id);
      const externalIds = validTeams.map(t => t.team.id.toString());
      
      const existingTeams = await this.prisma.team.findMany({
        where: { 
          externalId: { in: externalIds },
          sportId: footballSport.id,
        },
        select: { id: true, externalId: true },
      });

      const existingMap = new Map(existingTeams.map(t => [t.externalId, t.id]));

      const teamsToCreate: Array<{
        name: string;
        shortName: string;
        slug: string;
        logoUrl: string | null;
        country: string | null;
        countryCode: string | null;
        sportId: string;
        externalId: string;
        isActive: boolean;
      }> = [];

      const teamsToUpdate: Array<{
        id: string;
        data: {
          name: string;
          shortName: string;
          slug: string;
          logoUrl: string | null;
          country: string | null;
          countryCode: string | null;
          isActive: boolean;
        };
      }> = [];

      for (const apiTeam of validTeams) {
        if (!apiTeam.team?.id) {
          result.skipped++;
          continue;
        }

        const externalId = apiTeam.team.id.toString();
        const existingId = existingMap.get(externalId);

        const teamData = {
          name: apiTeam.team.name,
          shortName: apiTeam.team.code || apiTeam.team.name.substring(0, 3).toUpperCase(),
          slug: this.generateSlug(apiTeam.team.name),
          logoUrl: apiTeam.team.logo,
          country: apiTeam.team.country,
          countryCode: apiTeam.team.code || null,
          isActive: true,
        };

        if (existingId) {
          teamsToUpdate.push({ id: existingId, data: teamData });
        } else {
          teamsToCreate.push({
            ...teamData,
            sportId: footballSport.id,
            externalId,
          });
        }
      }

      if (teamsToCreate.length > 0) {
        await this.prisma.team.createMany({
          data: teamsToCreate,
          skipDuplicates: true,
        });
        result.created = teamsToCreate.length;
      }

      if (teamsToUpdate.length > 0) {
        const UPDATE_BATCH_SIZE = 50;
        for (let i = 0; i < teamsToUpdate.length; i += UPDATE_BATCH_SIZE) {
          const updateBatch = teamsToUpdate.slice(i, i + UPDATE_BATCH_SIZE);
          await this.prisma.$transaction(
            updateBatch.map(({ id, data }) =>
              this.prisma.team.update({ where: { id }, data })
            )
          );
        }
        result.updated = teamsToUpdate.length;
      }

      const cacheKey = `${CACHE_KEY_TEAMS}:${leagueExternalId}:${season || 'current'}`;
      await this.redis.setJson(cacheKey, apiTeams, 86400);

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
