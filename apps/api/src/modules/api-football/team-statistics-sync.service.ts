import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { ApiFootballService } from './api-football.service';
import { TeamStatisticsSyncResult, ApiTeamStatistics } from './interfaces';
import { getCurrentFootballSeason } from './constants/api-football.constants';

const CACHE_KEY_TEAM_STATS = 'api_football:team_statistics';
const PARALLEL_BATCH_SIZE = 3;

@Injectable()
export class TeamStatisticsSyncService {
  private readonly logger = new Logger(TeamStatisticsSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly apiFootballService: ApiFootballService,
  ) {}

  async syncTeamStatisticsForLeague(
    leagueExternalId: string,
    season?: string,
  ): Promise<TeamStatisticsSyncResult> {
    const result: TeamStatisticsSyncResult = {
      totalFetched: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      syncedAt: new Date().toISOString(),
    };

    try {
      const league = await this.prisma.league.findFirst({
        where: { externalId: leagueExternalId },
        include: { sport: true },
      });

      if (!league) {
        const msg = `League with externalId ${leagueExternalId} not found`;
        this.logger.error(msg);
        result.errors.push(msg);
        return result;
      }

      const parsedSeason = season ? parseInt(season, 10) : (league.season ? parseInt(league.season, 10) : getCurrentFootballSeason());
      const effectiveSeason = !isNaN(parsedSeason) ? parsedSeason : getCurrentFootballSeason();

      const teams = await this.prisma.team.findMany({
        where: {
          AND: [
            {
              OR: [
                { homeMatches: { some: { leagueId: league.id } } },
                { awayMatches: { some: { leagueId: league.id } } },
              ],
            },
            { externalId: { not: null } },
          ],
        },
      });

      if (teams.length === 0) {
        this.logger.log(`No teams found for league ${league.name}`);
        return result;
      }

      this.logger.log(`Syncing statistics for ${teams.length} teams in league ${league.name} (season ${effectiveSeason})...`);

      for (let i = 0; i < teams.length; i += PARALLEL_BATCH_SIZE) {
        const batch = teams.slice(i, i + PARALLEL_BATCH_SIZE);
        
        const batchPromises = batch.map(async (team) => {
          try {
            if (!team.externalId) {
              result.skipped++;
              return;
            }

            const teamId = parseInt(team.externalId, 10);
            const leagueId = parseInt(leagueExternalId, 10);

            const stats = await this.apiFootballService.fetchTeamStatistics(
              teamId,
              leagueId,
              effectiveSeason,
            );

            if (stats) {
              await this.updateTeamForm(team.id, stats);
              result.updated++;
            } else {
              result.skipped++;
            }
          } catch (error) {
            const msg = `Failed to sync statistics for team ${team.name}: ${error}`;
            this.logger.error(msg);
            result.errors.push(msg);
          }
        });

        await Promise.all(batchPromises);
        result.totalFetched += batch.length;
      }

      this.logger.log(
        `Team statistics sync complete for league ${league.name}: ${result.updated} updated, ${result.skipped} skipped, ${result.errors.length} errors`,
      );
    } catch (error) {
      const msg = `Team statistics sync failed for league ${leagueExternalId}: ${error}`;
      this.logger.error(msg);
      result.errors.push(msg);
    }

    return result;
  }

  async syncAllActiveLeagues(): Promise<TeamStatisticsSyncResult> {
    const result: TeamStatisticsSyncResult = {
      totalFetched: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      syncedAt: new Date().toISOString(),
    };

    try {
      const activeLeagues = await this.prisma.league.findMany({
        where: { isActive: true },
      });

      this.logger.log(`Starting team statistics sync for ${activeLeagues.length} active leagues...`);

      for (const league of activeLeagues) {
        if (!league.externalId) {
          result.skipped++;
          continue;
        }

        try {
          const leagueResult = await this.syncTeamStatisticsForLeague(
            league.externalId,
            league.season || undefined,
          );

          result.totalFetched += leagueResult.totalFetched;
          result.updated += leagueResult.updated;
          result.skipped += leagueResult.skipped;
          result.errors.push(...leagueResult.errors);
        } catch (error) {
          const msg = `Failed to sync statistics for league ${league.name}: ${error}`;
          this.logger.error(msg);
          result.errors.push(msg);
        }
      }

      this.logger.log(
        `Team statistics sync complete: ${result.updated} updated, ${result.skipped} skipped, ${result.errors.length} errors`,
      );
    } catch (error) {
      const msg = `Team statistics sync failed: ${error}`;
      this.logger.error(msg);
      result.errors.push(msg);
    }

    return result;
  }

  private async updateTeamForm(teamId: string, stats: ApiTeamStatistics): Promise<void> {
    const formString = stats.form || '';
    
    const recentForm: string[] = [];
    const lastFive = formString.slice(-5);
    
    for (const char of lastFive) {
      if (char === 'W' || char === 'L' || char === 'D') {
        recentForm.push(char);
      }
    }

    await this.prisma.team.update({
      where: { id: teamId },
      data: {
        recentForm: recentForm,
      },
    });

    this.logger.debug(`Updated form for team ${teamId}: ${recentForm.join('')}`);
  }

  async invalidateCache(): Promise<void> {
    await this.redis.getClient().del(CACHE_KEY_TEAM_STATS);
    this.logger.log('Team statistics cache invalidated');
  }
}
