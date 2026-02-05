import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { ApiFootballService } from './api-football.service';
import { StandingsSyncResult, ApiStandingEntry } from './interfaces';

const CACHE_KEY_STANDINGS = 'api_football:standings';
const PARALLEL_LEAGUE_BATCH_SIZE = 5;

@Injectable()
export class StandingsSyncService {
  private readonly logger = new Logger(StandingsSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly apiFootballService: ApiFootballService,
  ) {}

  async syncAllActiveLeagues(
    onProgress?: (progress: number, processedItems: number, totalItems: number) => Promise<void>,
  ): Promise<StandingsSyncResult> {
    const result: StandingsSyncResult = {
      totalFetched: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      syncedAt: new Date().toISOString(),
    };

    try {
      this.logger.log('Starting standings sync for all active leagues...');

      const activeLeagues = await this.prisma.league.findMany({
        where: { isActive: true, externalId: { not: null } },
        select: { id: true, externalId: true, season: true, name: true },
      });

      this.logger.log(`Found ${activeLeagues.length} active leagues`);
      const totalLeagues = activeLeagues.length;
      let processedLeagues = 0;

      for (let i = 0; i < activeLeagues.length; i += PARALLEL_LEAGUE_BATCH_SIZE) {
        const batch = activeLeagues.slice(i, i + PARALLEL_LEAGUE_BATCH_SIZE);
        const batchNumber = Math.floor(i / PARALLEL_LEAGUE_BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(activeLeagues.length / PARALLEL_LEAGUE_BATCH_SIZE);
        
        this.logger.log(`Processing standings batch ${batchNumber}/${totalBatches} (${batch.length} leagues)`);

        const batchPromises = batch.map(async (league) => {
          try {
            return await this.syncStandingsByLeague(
              league.id,
              league.externalId!,
              league.season || undefined,
            );
          } catch (error) {
            const msg = `Failed to sync standings for league ${league.name}: ${error}`;
            this.logger.error(msg);
            return {
              totalFetched: 0,
              created: 0,
              updated: 0,
              skipped: 0,
              errors: [msg],
              syncedAt: new Date().toISOString(),
            } as StandingsSyncResult;
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
        `Standings sync complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.errors.length} errors`,
      );
    } catch (error) {
      const msg = `Standings sync failed: ${error}`;
      this.logger.error(msg);
      result.errors.push(msg);
    }

    return result;
  }

  async syncStandingsByLeague(
    dbLeagueId: string,
    externalLeagueId: string,
    season?: string,
  ): Promise<StandingsSyncResult> {
    const result: StandingsSyncResult = {
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
      
      this.logger.log(`Fetching standings for league ${externalLeagueId}, season ${effectiveSeason || 'current'}...`);

      const apiStandings = await this.apiFootballService.fetchStandings(
        parseInt(externalLeagueId, 10),
        effectiveSeason,
      );

      if (!apiStandings || !apiStandings.league?.standings) {
        this.logger.log(`No standings data for league ${externalLeagueId}`);
        return result;
      }

      const apiSeason = apiStandings.league?.season;
      if (apiSeason == null) {
        this.logger.warn(`No season data returned from API for league ${externalLeagueId}, skipping`);
        return result;
      }

      const seasonStr = apiSeason.toString();
      const allEntries: ApiStandingEntry[] = apiStandings.league.standings.flat();
      
      result.totalFetched = allEntries.length;
      this.logger.log(`Fetched ${allEntries.length} standing entries from API for league ${externalLeagueId}`);

      if (allEntries.length === 0) {
        return result;
      }

      const teamExternalIds = allEntries.map(e => e.team.id.toString());
      const existingTeams = await this.prisma.team.findMany({
        where: { externalId: { in: teamExternalIds } },
        select: { id: true, externalId: true },
      });

      const teamIdMap = new Map(existingTeams.map(t => [t.externalId, t.id]));

      for (const entry of allEntries) {
        const teamDbId = teamIdMap.get(entry.team.id.toString());
        
        if (!teamDbId) {
          this.logger.warn(`Team with externalId ${entry.team.id} not found in DB, skipping standing entry`);
          result.skipped++;
          continue;
        }

        try {
          const standingData = {
            position: entry.rank,
            played: entry.all.played,
            won: entry.all.win,
            drawn: entry.all.draw,
            lost: entry.all.lose,
            goalsFor: entry.all.goals.for,
            goalsAgainst: entry.all.goals.against,
            goalDiff: entry.goalsDiff,
            points: entry.points,
            form: entry.form,
            description: entry.description,
            group: entry.group !== 'Group A' && entry.group !== '' ? entry.group : null,
            homeRecord: {
              played: entry.home.played,
              won: entry.home.win,
              drawn: entry.home.draw,
              lost: entry.home.lose,
              goalsFor: entry.home.goals.for,
              goalsAgainst: entry.home.goals.against,
            },
            awayRecord: {
              played: entry.away.played,
              won: entry.away.win,
              drawn: entry.away.draw,
              lost: entry.away.lose,
              goalsFor: entry.away.goals.for,
              goalsAgainst: entry.away.goals.against,
            },
            lastUpdated: new Date(),
          };

          const existing = await this.prisma.standing.findUnique({
            where: {
              leagueId_teamId_season: {
                leagueId: dbLeagueId,
                teamId: teamDbId,
                season: seasonStr,
              },
            },
          });

          if (existing) {
            await this.prisma.standing.update({
              where: { id: existing.id },
              data: standingData,
            });
            result.updated++;
          } else {
            await this.prisma.standing.create({
              data: {
                ...standingData,
                leagueId: dbLeagueId,
                teamId: teamDbId,
                season: seasonStr,
              },
            });
            result.created++;
          }
        } catch (error) {
          const msg = `Failed to upsert standing for team ${entry.team.id}: ${error}`;
          this.logger.warn(msg);
          result.errors.push(msg);
        }
      }

      const cacheKey = `${CACHE_KEY_STANDINGS}:${dbLeagueId}:${seasonStr}`;
      await this.redis.getClient().del(cacheKey);

      this.logger.log(
        `League ${externalLeagueId} standings sync: ${result.created} created, ${result.updated} updated`,
      );
    } catch (error) {
      const msg = `Failed to sync standings for league ${externalLeagueId}: ${error}`;
      this.logger.error(msg);
      result.errors.push(msg);
    }

    return result;
  }

  async getStandingsByLeague(
    leagueId: string,
    season?: string,
  ): Promise<{
    standings: Array<{
      position: number;
      team: { id: string; name: string; logoUrl: string | null };
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDiff: number;
      points: number;
      form: string | null;
    }>;
    league: { id: string; name: string; logoUrl: string | null } | null;
  }> {
    const cacheKey = `${CACHE_KEY_STANDINGS}:${leagueId}:${season || 'current'}`;
    
    const cached = await this.redis.getJson<{
      standings: Array<{
        position: number;
        team: { id: string; name: string; logoUrl: string | null };
        played: number;
        won: number;
        drawn: number;
        lost: number;
        goalsFor: number;
        goalsAgainst: number;
        goalDiff: number;
        points: number;
        form: string | null;
      }>;
      league: { id: string; name: string; logoUrl: string | null } | null;
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
      select: { id: true, name: true, logoUrl: true, season: true },
    });

    if (!league) {
      return { standings: [], league: null };
    }

    const effectiveSeason = season || league.season || new Date().getFullYear().toString();

    const standings = await this.prisma.standing.findMany({
      where: {
        leagueId,
        season: effectiveSeason,
      },
      include: {
        team: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
      orderBy: { position: 'asc' },
    });

    const result = {
      standings: standings.map(s => ({
        position: s.position,
        team: s.team,
        played: s.played,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        goalsFor: s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        goalDiff: s.goalDiff,
        points: s.points,
        form: s.form,
      })),
      league: { id: league.id, name: league.name, logoUrl: league.logoUrl },
    };

    await this.redis.setJson(cacheKey, result, 3600);

    return result;
  }

  async getStandingsByExternalLeagueId(
    externalLeagueId: string,
    season?: string,
  ): Promise<{
    standings: Array<{
      position: number;
      team: { id: string; name: string; logoUrl: string | null };
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDiff: number;
      points: number;
      form: string | null;
    }>;
    league: { id: string; name: string; logoUrl: string | null } | null;
  }> {
    const league = await this.prisma.league.findFirst({
      where: { externalId: externalLeagueId },
      select: { id: true },
    });

    if (!league) {
      return { standings: [], league: null };
    }

    return this.getStandingsByLeague(league.id, season);
  }

  async invalidateCache(): Promise<void> {
    const client = this.redis.getClient();
    const keys = await client.keys(`${CACHE_KEY_STANDINGS}:*`);
    if (keys.length > 0) {
      await client.del(...keys);
    }
    this.logger.log('Standings cache invalidated');
  }
}
