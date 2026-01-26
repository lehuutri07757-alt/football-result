import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { ApiFootballService } from './api-football.service';
import { ApiFixture, LIVE_STATUSES, FINISHED_STATUSES, SCHEDULED_STATUSES, FixtureSyncResult } from './interfaces';
import { MatchStatus } from '@prisma/client';
import { CACHE_TTL_SECONDS } from './constants/api-football.constants';

const CACHE_KEY_FIXTURES = 'api_football:fixtures';

@Injectable()
export class FixtureSyncService {
  private readonly logger = new Logger(FixtureSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly apiFootballService: ApiFootballService,
  ) {}

  async syncFixturesByDate(dateFrom: string, dateTo: string): Promise<FixtureSyncResult> {
    const result: FixtureSyncResult = {
      totalFetched: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      syncedAt: new Date().toISOString(),
    };

    try {
      this.logger.log(`Syncing fixtures from ${dateFrom} to ${dateTo}...`);

      const activeLeagues = await this.prisma.league.findMany({
        where: { isActive: true, externalId: { not: null } },
        select: { id: true, name: true, externalId: true },
      });

      const activeLeagueExternalIds = new Set<string>();
      for (const league of activeLeagues) {
        if (league.externalId) {
          activeLeagueExternalIds.add(league.externalId);
        }
      }

      const currentDate = new Date(dateFrom);
      const endDate = new Date(dateTo);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];

        try {
          const fixturesForDate = await this.fetchFixturesForDate(dateStr);
          const relevantFixtures = fixturesForDate.filter((f) =>
            activeLeagueExternalIds.has(f.league.id.toString()),
          );

          result.totalFetched += relevantFixtures.length;

          for (const apiFixture of relevantFixtures) {
            try {
              const syncResult = await this.syncSingleFixture(apiFixture);
              if (syncResult.created) result.created++;
              if (syncResult.updated) result.updated++;
              if (syncResult.skipped) result.skipped++;
            } catch (error) {
              const msg = `Failed to sync fixture ${apiFixture.fixture.id}: ${error}`;
              this.logger.warn(msg);
              result.errors.push(msg);
            }
          }
        } catch (error) {
          const msg = `Failed to sync fixtures for date ${dateStr}: ${error}`;
          this.logger.error(msg);
          result.errors.push(msg);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      this.logger.log(
        `Fixture sync complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
      );
    } catch (error) {
      const msg = `Fixture sync failed: ${error}`;
      this.logger.error(msg);
      result.errors.push(msg);
    }

    return result;
  }

  async syncFixturesForLeague(
    leagueExternalId: number,
    dateFrom: string,
    dateTo: string,
  ): Promise<FixtureSyncResult> {
    const result: FixtureSyncResult = {
      totalFetched: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      syncedAt: new Date().toISOString(),
    };

    try {
      const currentDate = new Date(dateFrom);
      const endDate = new Date(dateTo);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];

        const dayFixtures = await this.fetchFixturesForLeagueAndDate(leagueExternalId, dateStr);
        result.totalFetched += dayFixtures.length;

        for (const apiFixture of dayFixtures) {
          try {
            const syncResult = await this.syncSingleFixture(apiFixture);
            if (syncResult.created) result.created++;
            if (syncResult.updated) result.updated++;
            if (syncResult.skipped) result.skipped++;
          } catch (error) {
            const msg = `Failed to sync fixture ${apiFixture.fixture.id}: ${error}`;
            this.logger.warn(msg);
            result.errors.push(msg);
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    } catch (error) {
      const msg = `Failed to sync fixtures for league ${leagueExternalId}: ${error}`;
      this.logger.error(msg);
      result.errors.push(msg);
    }

    return result;
  }

  async syncSingleFixture(apiFixture: ApiFixture): Promise<{ created?: boolean; updated?: boolean; skipped?: boolean }> {
    const fixtureExternalId = apiFixture.fixture.id.toString();
    
    const league = await this.prisma.league.findFirst({
      where: { externalId: apiFixture.league.id.toString() },
    });

    if (!league) {
      this.logger.warn(`League ${apiFixture.league.id} not found in DB, skipping fixture ${fixtureExternalId}`);
      return { skipped: true };
    }

    const homeTeam = await this.findTeamByExternalId(apiFixture.teams.home.id.toString());
    const awayTeam = await this.findTeamByExternalId(apiFixture.teams.away.id.toString());

    if (!homeTeam || !awayTeam) {
      this.logger.warn(
        `Teams not found (home: ${apiFixture.teams.home.id}, away: ${apiFixture.teams.away.id}), skipping fixture ${fixtureExternalId}`,
      );
      return { skipped: true };
    }

    const existing = await this.prisma.match.findFirst({
      where: { externalId: fixtureExternalId },
    });

    const matchData = {
      leagueId: league.id,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      startTime: new Date(apiFixture.fixture.date),
      status: this.mapFixtureStatus(apiFixture.fixture.status.short),
      homeScore: apiFixture.goals.home,
      awayScore: apiFixture.goals.away,
      isLive: LIVE_STATUSES.includes(apiFixture.fixture.status.short as any),
      liveMinute: apiFixture.fixture.status.elapsed,
      period: apiFixture.fixture.status.long,
      externalId: fixtureExternalId,
      metadata: {
        venue: apiFixture.fixture.venue,
        referee: apiFixture.fixture.referee,
        status: apiFixture.fixture.status,
      } as any,
      result: {
        score: apiFixture.score,
        goals: apiFixture.goals,
      } as any,
    };

    if (existing) {
      await this.prisma.match.update({
        where: { id: existing.id },
        data: matchData,
      });
      return { updated: true };
    } else {
      await this.prisma.match.create({
        data: matchData,
      });
      return { created: true };
    }
  }

  private async fetchFixturesForLeagueAndDate(leagueExternalId: number, date: string): Promise<ApiFixture[]> {
    const cacheKey = `${CACHE_KEY_FIXTURES}:league:${leagueExternalId}:${date}`;
    const cached = await this.redis.getJson<ApiFixture[]>(cacheKey);
    
    if (cached) {
      this.logger.debug(`Using cached fixtures for league ${leagueExternalId} on ${date}`);
      return cached;
    }

    const params = {
      league: leagueExternalId.toString(),
      date,
    };

    const response = await this.apiFootballService['makeApiRequest']<ApiFixture>('/fixtures', params);
    const fixtures = response.response;

    await this.redis.setJson(cacheKey, fixtures, CACHE_TTL_SECONDS.FIXTURES);

    return fixtures;
  }

  private async fetchFixturesForDate(date: string): Promise<ApiFixture[]> {
    const cacheKey = `${CACHE_KEY_FIXTURES}:date:${date}`;
    const cached = await this.redis.getJson<ApiFixture[]>(cacheKey);

    if (cached) {
      this.logger.debug(`Using cached fixtures for date ${date}`);
      return cached;
    }

    const response = await this.apiFootballService['makeApiRequest']<ApiFixture>('/fixtures', { date });
    const fixtures = response.response;

    await this.redis.setJson(cacheKey, fixtures, CACHE_TTL_SECONDS.FIXTURES);

    return fixtures;
  }

  private async findTeamByExternalId(externalId: string) {
    return this.prisma.team.findFirst({
      where: { externalId },
    });
  }

  private mapFixtureStatus(statusShort: string): MatchStatus {
    if (LIVE_STATUSES.includes(statusShort as any)) return MatchStatus.live;
    if (FINISHED_STATUSES.includes(statusShort as any)) return MatchStatus.finished;
    if (SCHEDULED_STATUSES.includes(statusShort as any)) return MatchStatus.scheduled;
    if (statusShort === 'PST') return MatchStatus.postponed;
    if (statusShort === 'CANC' || statusShort === 'ABD') return MatchStatus.cancelled;
    return MatchStatus.scheduled;
  }

  async getFixturesCount(): Promise<{ total: number; byStatus: Record<string, number> }> {
    const total = await this.prisma.match.count();
    
    const byStatus = await this.prisma.match.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async invalidateCache(): Promise<void> {
    const client = this.redis.getClient();
    const keys = await client.keys(`${CACHE_KEY_FIXTURES}:*`);
    if (keys.length > 0) {
      await client.del(...keys);
    }
    this.logger.log('Fixtures cache invalidated');
  }
}
