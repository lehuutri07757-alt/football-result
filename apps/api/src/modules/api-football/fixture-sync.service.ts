import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { ApiFootballService } from './api-football.service';
import { OddsSyncService } from './odds-sync.service';
import { ApiFixture, LIVE_STATUSES, FINISHED_STATUSES, SCHEDULED_STATUSES, FixtureSyncResult } from './interfaces';
import { MatchStatus } from '@prisma/client';
import { CACHE_TTL_SECONDS } from './constants/api-football.constants';

const CACHE_KEY_FIXTURES = 'api_football:fixtures';
const FIXTURE_BATCH_SIZE = 50;

@Injectable()
export class FixtureSyncService {
  private readonly logger = new Logger(FixtureSyncService.name);

  private static readonly MAX_PAST_DAYS = 2;
  private static readonly MAX_FUTURE_DAYS = 14;

  private footballSportId: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly apiFootballService: ApiFootballService,
    private readonly oddsSyncService: OddsSyncService,
  ) {}

  private async getOrCreateFootballSport(): Promise<{ id: string }> {
    if (this.footballSportId) {
      return { id: this.footballSportId };
    }

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
      this.logger.log('Created Football sport');
    }

    this.footballSportId = sport.id;
    return { id: sport.id };
  }

  private async getOrCreateLeague(apiFixture: ApiFixture): Promise<string> {
    const leagueExternalId = apiFixture.league.id.toString();

    let league = await this.prisma.league.findFirst({
      where: { externalId: leagueExternalId },
      select: { id: true },
    });

    if (league) {
      return league.id;
    }

    const sport = await this.getOrCreateFootballSport();
    const leagueName = apiFixture.league.name;
    const slug = this.generateSlug(`${apiFixture.league.country || ''}-${leagueName}`);

    league = await this.prisma.league.create({
      data: {
        name: leagueName,
        slug,
        country: apiFixture.league.country,
        countryCode: apiFixture.league.flag ? this.extractCountryCodeFromFlag(apiFixture.league.flag) : null,
        logoUrl: apiFixture.league.logo,
        season: apiFixture.league.season?.toString(),
        sportId: sport.id,
        externalId: leagueExternalId,
        isActive: true,
      },
    });

    this.logger.log(`Auto-created league: ${leagueName} (${leagueExternalId})`);
    return league.id;
  }

  private async getOrCreateTeam(
    teamData: { id: number; name: string; logo?: string },
  ): Promise<string> {
    const teamExternalId = teamData.id.toString();

    let team = await this.prisma.team.findFirst({
      where: { externalId: teamExternalId },
      select: { id: true },
    });

    if (team) {
      return team.id;
    }

    const sport = await this.getOrCreateFootballSport();
    const slug = this.generateSlug(teamData.name);

    team = await this.prisma.team.create({
      data: {
        name: teamData.name,
        shortName: teamData.name.substring(0, 3).toUpperCase(),
        slug,
        logoUrl: teamData.logo || null,
        sportId: sport.id,
        externalId: teamExternalId,
        isActive: true,
      },
    });

    this.logger.log(`Auto-created team: ${teamData.name} (${teamExternalId})`);
    return team.id;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private extractCountryCodeFromFlag(flagUrl: string): string | null {
    const match = flagUrl.match(/\/([a-z]{2})\.svg$/i);
    return match ? match[1].toUpperCase() : null;
  }

  async syncFixturesByDate(
    dateFrom: string,
    dateTo: string,
    onProgress?: (progress: number, processedItems: number, totalItems: number) => Promise<void>,
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
      this.logger.log(`Syncing fixtures from ${dateFrom} to ${dateTo}...`);

      const activeLeagues = await this.prisma.league.findMany({
        where: { isActive: true, externalId: { not: null } },
        select: { id: true, name: true, externalId: true },
      });

      const activeLeagueExternalIds = new Set<string>();
      const leagueIdMap = new Map<string, string>();
      for (const league of activeLeagues) {
        if (league.externalId) {
          activeLeagueExternalIds.add(league.externalId);
          leagueIdMap.set(league.externalId, league.id);
        }
      }

      const currentDate = new Date(dateFrom);
      const endDate = new Date(dateTo);
      const totalDays = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      let processedDays = 0;

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];

        try {
          const fixturesForDate = await this.fetchFixturesForDate(dateStr);
          const relevantFixtures = fixturesForDate.filter((f) =>
            activeLeagueExternalIds.has(f.league.id.toString()),
          );

          result.totalFetched += relevantFixtures.length;

          const batchResult = await this.syncFixturesBatch(relevantFixtures, leagueIdMap);
          result.created += batchResult.created;
          result.updated += batchResult.updated;
          result.skipped += batchResult.skipped;
          result.errors.push(...batchResult.errors);
        } catch (error) {
          const msg = `Failed to sync fixtures for date ${dateStr}: ${error}`;
          this.logger.error(msg);
          result.errors.push(msg);
        }

        processedDays++;
        const progress = Math.round((processedDays / totalDays) * 100);
        
        if (onProgress) {
          await onProgress(progress, processedDays, totalDays);
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
      const league = await this.prisma.league.findFirst({
        where: { externalId: leagueExternalId.toString() },
        select: { id: true, externalId: true },
      });

      if (!league || !league.externalId) {
        result.errors.push(`League ${leagueExternalId} not found`);
        return result;
      }

      const leagueIdMap = new Map<string, string>();
      leagueIdMap.set(league.externalId, league.id);

      const currentDate = new Date(dateFrom);
      const endDate = new Date(dateTo);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];

        const dayFixtures = await this.fetchFixturesForLeagueAndDate(leagueExternalId, dateStr);
        result.totalFetched += dayFixtures.length;

        const batchResult = await this.syncFixturesBatch(dayFixtures, leagueIdMap);
        result.created += batchResult.created;
        result.updated += batchResult.updated;
        result.skipped += batchResult.skipped;
        result.errors.push(...batchResult.errors);

        currentDate.setDate(currentDate.getDate() + 1);
      }
    } catch (error) {
      const msg = `Failed to sync fixtures for league ${leagueExternalId}: ${error}`;
      this.logger.error(msg);
      result.errors.push(msg);
    }

    return result;
  }

  private async syncFixturesBatch(
    fixtures: ApiFixture[],
    leagueIdMap: Map<string, string>,
  ): Promise<{ created: number; updated: number; skipped: number; errors: string[]; autoCreatedLeagues: number; autoCreatedTeams: number }> {
    const result = { created: 0, updated: 0, skipped: 0, errors: [] as string[], autoCreatedLeagues: 0, autoCreatedTeams: 0 };

    if (fixtures.length === 0) return result;

    const now = new Date();
    const minDate = new Date(now);
    minDate.setDate(minDate.getDate() - FixtureSyncService.MAX_PAST_DAYS);
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + FixtureSyncService.MAX_FUTURE_DAYS);

    const validFixtures = fixtures.filter((f) => {
      const fixtureDate = new Date(f.fixture.date);
      return fixtureDate >= minDate && fixtureDate <= maxDate;
    });

    result.skipped = fixtures.length - validFixtures.length;

    if (validFixtures.length === 0) return result;

    const teamExternalIds = new Set<string>();
    for (const f of validFixtures) {
      teamExternalIds.add(f.teams.home.id.toString());
      teamExternalIds.add(f.teams.away.id.toString());
    }

    const existingTeams = await this.prisma.team.findMany({
      where: { externalId: { in: Array.from(teamExternalIds) } },
      select: { id: true, externalId: true },
    });
    const teamIdMap = new Map(existingTeams.map((t) => [t.externalId, t.id]));

    const fixtureExternalIds = validFixtures.map((f) => f.fixture.id.toString());
    const existingMatches = await this.prisma.match.findMany({
      where: { externalId: { in: fixtureExternalIds } },
      select: { id: true, externalId: true },
    });
    const existingMatchMap = new Map(existingMatches.map((m) => [m.externalId, m.id]));

    const toCreate: Array<{
      leagueId: string;
      homeTeamId: string;
      awayTeamId: string;
      startTime: Date;
      status: MatchStatus;
      homeScore: number | null;
      awayScore: number | null;
      isLive: boolean;
      liveMinute: number | null;
      period: string | null;
      externalId: string;
      metadata: object;
      result: object;
    }> = [];

    const toUpdate: Array<{
      id: string;
      data: {
        leagueId: string;
        homeTeamId: string;
        awayTeamId: string;
        startTime: Date;
        status: MatchStatus;
        homeScore: number | null;
        awayScore: number | null;
        isLive: boolean;
        liveMinute: number | null;
        period: string | null;
        metadata: object;
        result: object;
      };
    }> = [];

    for (const apiFixture of validFixtures) {
      try {
        const fixtureExternalId = apiFixture.fixture.id.toString();
        const leagueExternalIdStr = apiFixture.league.id.toString();

        let leagueId = leagueIdMap.get(leagueExternalIdStr);
        if (!leagueId) {
          leagueId = await this.getOrCreateLeague(apiFixture);
          leagueIdMap.set(leagueExternalIdStr, leagueId);
          result.autoCreatedLeagues++;
        }

        const homeTeamExternalId = apiFixture.teams.home.id.toString();
        let homeTeamId = teamIdMap.get(homeTeamExternalId);
        if (!homeTeamId) {
          homeTeamId = await this.getOrCreateTeam(apiFixture.teams.home);
          teamIdMap.set(homeTeamExternalId, homeTeamId);
          result.autoCreatedTeams++;
        }

        const awayTeamExternalId = apiFixture.teams.away.id.toString();
        let awayTeamId = teamIdMap.get(awayTeamExternalId);
        if (!awayTeamId) {
          awayTeamId = await this.getOrCreateTeam(apiFixture.teams.away);
          teamIdMap.set(awayTeamExternalId, awayTeamId);
          result.autoCreatedTeams++;
        }

        const matchData = {
          leagueId,
          homeTeamId,
          awayTeamId,
          startTime: new Date(apiFixture.fixture.date),
          status: this.mapFixtureStatus(apiFixture.fixture.status.short),
          homeScore: apiFixture.goals.home,
          awayScore: apiFixture.goals.away,
          isLive: LIVE_STATUSES.includes(apiFixture.fixture.status.short as any),
          liveMinute: apiFixture.fixture.status.elapsed,
          period: apiFixture.fixture.status.long,
          metadata: {
            venue: apiFixture.fixture.venue,
            referee: apiFixture.fixture.referee,
            status: apiFixture.fixture.status,
          },
          result: {
            score: apiFixture.score,
            goals: apiFixture.goals,
          },
        };

        const existingId = existingMatchMap.get(fixtureExternalId);
        if (existingId) {
          toUpdate.push({ id: existingId, data: matchData });
        } else {
          toCreate.push({ ...matchData, externalId: fixtureExternalId });
        }
      } catch (error) {
        const msg = `Failed to process fixture ${apiFixture.fixture.id}: ${error}`;
        this.logger.error(msg);
        result.errors.push(msg);
        result.skipped++;
      }
    }

    if (toCreate.length > 0) {
      await this.prisma.match.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
      result.created = toCreate.length;

      // Odds sync for new matches is handled by scheduled odds sync jobs
      // (upcomingOdds, farOdds). Removed immediate syncOddsForNewMatches
      // to avoid N extra API calls per fixture sync run.
    }

    if (toUpdate.length > 0) {
      for (let i = 0; i < toUpdate.length; i += FIXTURE_BATCH_SIZE) {
        const batch = toUpdate.slice(i, i + FIXTURE_BATCH_SIZE);
        await this.prisma.$transaction(
          batch.map(({ id, data }) => this.prisma.match.update({ where: { id }, data })),
        );
      }
      result.updated = toUpdate.length;
    }

    if (result.autoCreatedLeagues > 0 || result.autoCreatedTeams > 0) {
      this.logger.log(`Auto-created ${result.autoCreatedLeagues} leagues, ${result.autoCreatedTeams} teams during fixture sync`);
    }

    return result;
  }

  async syncSingleFixture(apiFixture: ApiFixture): Promise<{ created?: boolean; updated?: boolean; skipped?: boolean }> {
    const fixtureExternalId = apiFixture.fixture.id.toString();

    const fixtureDate = new Date(apiFixture.fixture.date);
    const now = new Date();
    const minDate = new Date(now);
    minDate.setDate(minDate.getDate() - FixtureSyncService.MAX_PAST_DAYS);
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + FixtureSyncService.MAX_FUTURE_DAYS);
    if (fixtureDate < minDate || fixtureDate > maxDate) {
      this.logger.debug(
        `Skipping fixture ${fixtureExternalId} outside sync window (${fixtureDate.toISOString()})`,
      );
      return { skipped: true };
    }
    
    const leagueId = await this.getOrCreateLeague(apiFixture);
    const homeTeamId = await this.getOrCreateTeam(apiFixture.teams.home);
    const awayTeamId = await this.getOrCreateTeam(apiFixture.teams.away);

    const existing = await this.prisma.match.findFirst({
      where: { externalId: fixtureExternalId },
    });

    const matchData = {
      leagueId,
      homeTeamId,
      awayTeamId,
      startTime: fixtureDate,
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
      const created = await this.prisma.match.create({
        data: matchData,
      });
      await this.oddsSyncService.syncOddsForMatch(created.id, fixtureExternalId);
      return { created: true };
    }
  }

  private async syncOddsForNewMatches(externalIds: string[]): Promise<void> {
    if (externalIds.length === 0) return;

    const newMatches = await this.prisma.match.findMany({
      where: { externalId: { in: externalIds } },
      select: { id: true, externalId: true },
    });

    if (newMatches.length === 0) return;

    this.logger.log(`Syncing odds for ${newMatches.length} newly created matches...`);

    const results = await Promise.allSettled(
      newMatches.map((match) =>
        this.oddsSyncService.syncOddsForMatch(match.id, match.externalId!),
      ),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    if (failed > 0) {
      this.logger.warn(`Odds sync for new matches: ${succeeded} succeeded, ${failed} failed`);
    } else {
      this.logger.log(`Odds synced for ${succeeded} new matches`);
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

    const response = await this.apiFootballService.request<ApiFixture>('/fixtures', params);
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

    const response = await this.apiFootballService.request<ApiFixture>('/fixtures', { date });
    const fixtures = response.response;

    await this.redis.setJson(cacheKey, fixtures, CACHE_TTL_SECONDS.FIXTURES);

    return fixtures;
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
