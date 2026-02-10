import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { ApiFootballService } from './api-football.service';
import { SyncConfigService } from './sync-config.service';
import { OddsSyncResult } from './interfaces';
import { API_FOOTBALL_BET_IDS, DEFAULT_BOOKMAKER_ID } from './constants/api-football.constants';
import { Decimal } from '@prisma/client/runtime/library';
import { OddsStatus, Prisma } from '@prisma/client';

const CACHE_KEY_ODDS = 'api_football:odds';

/** Batch size for parallel API calls - balances speed vs rate limits */
const PARALLEL_BATCH_SIZE = 10;

/** Batch size for database operations */
const DB_BATCH_SIZE = 100;

/** Item to be bulk upserted */
interface OddsUpsertItem {
  matchId: string;
  betTypeId: string;
  selection: string;
  oddsValue: string;
  handicap?: string;
}

@Injectable()
export class OddsSyncService {
  private readonly logger = new Logger(OddsSyncService.name);

  /** Cached betTypeMap to avoid repeated DB queries within a sync job */
  private betTypeMapCache: Record<string, any> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly apiFootballService: ApiFootballService,
    private readonly syncConfig: SyncConfigService,
  ) {}

  async syncOddsForUpcomingMatches(
    hoursAhead?: number,
    onProgress?: (progress: number, processedItems: number, totalItems: number) => Promise<void>,
  ): Promise<OddsSyncResult> {
    const config = this.syncConfig.upcomingOddsConfig;

    const result: OddsSyncResult = {
      totalMatches: 0,
      totalOdds: 0,
      created: 0,
      updated: 0,
      errors: [],
      syncedAt: new Date().toISOString(),
    };

    if (!config.enabled) {
      this.logger.log('Upcoming odds sync is disabled');
      return result;
    }

    try {
      const effectiveHoursAhead = hoursAhead ?? config.hoursAhead;
      const now = new Date();
      const futureDate = new Date(now.getTime() + effectiveHoursAhead * 60 * 60 * 1000);

      const matches = await this.prisma.match.findMany({
        where: {
          startTime: { gte: now, lte: futureDate },
          status: 'scheduled',
          externalId: { not: null },
        },
        orderBy: { startTime: 'asc' },
        take: config.maxMatchesPerSync,
      });

      const totalEligible = await this.prisma.match.count({
        where: {
          startTime: { gte: now, lte: futureDate },
          status: 'scheduled',
          externalId: { not: null },
        },
      });

      result.totalMatches = matches.length;
      this.logger.log(
        `Upcoming odds sync: ${matches.length}/${totalEligible} matches selected (within ${effectiveHoursAhead}h, limit ${config.maxMatchesPerSync})`,
      );

      if (matches.length === 0) {
        return result;
      }

      await this.processMatchBatch(matches, result, onProgress);
    } catch (error) {
      const msg = `Upcoming odds sync failed: ${error}`;
      this.logger.error(msg);
      result.errors.push(msg);
      this.betTypeMapCache = null;
    }

    return result;
  }

  async syncOddsForFarMatches(
    maxDaysAhead?: number,
    onProgress?: (progress: number, processedItems: number, totalItems: number) => Promise<void>,
  ): Promise<OddsSyncResult> {
    const farConfig = this.syncConfig.farOddsConfig;
    const nearConfig = this.syncConfig.upcomingOddsConfig;

    const result: OddsSyncResult = {
      totalMatches: 0,
      totalOdds: 0,
      created: 0,
      updated: 0,
      errors: [],
      syncedAt: new Date().toISOString(),
    };

    if (!farConfig.enabled) {
      this.logger.log('Far odds sync is disabled');
      return result;
    }

    try {
      const effectiveMaxDays = maxDaysAhead ?? farConfig.maxDaysAhead;
      const now = new Date();
      const nearBoundary = new Date(now.getTime() + nearConfig.hoursAhead * 60 * 60 * 1000);
      const farBoundary = new Date(now.getTime() + effectiveMaxDays * 24 * 60 * 60 * 1000);

      const matches = await this.prisma.match.findMany({
        where: {
          startTime: { gt: nearBoundary, lte: farBoundary },
          status: 'scheduled',
          externalId: { not: null },
        },
        orderBy: { startTime: 'asc' },
        take: farConfig.maxMatchesPerSync,
      });

      const totalEligible = await this.prisma.match.count({
        where: {
          startTime: { gt: nearBoundary, lte: farBoundary },
          status: 'scheduled',
          externalId: { not: null },
        },
      });

      result.totalMatches = matches.length;
      this.logger.log(
        `Far odds sync: ${matches.length}/${totalEligible} matches selected (${nearConfig.hoursAhead}h - ${effectiveMaxDays}d, limit ${farConfig.maxMatchesPerSync})`,
      );

      if (matches.length === 0) {
        return result;
      }

      await this.processMatchBatch(matches, result, onProgress);
    } catch (error) {
      const msg = `Far odds sync failed: ${error}`;
      this.logger.error(msg);
      result.errors.push(msg);
      this.betTypeMapCache = null;
    }

    return result;
  }

  private async processMatchBatch(
    matches: Array<{ id: string; externalId: string | null }>,
    result: OddsSyncResult,
    onProgress?: (progress: number, processedItems: number, totalItems: number) => Promise<void>,
  ): Promise<void> {
    this.betTypeMapCache = await this.getBetTypeMap();

    let processedMatches = 0;

    for (let i = 0; i < matches.length; i += PARALLEL_BATCH_SIZE) {
      const batch = matches.slice(i, i + PARALLEL_BATCH_SIZE);
      
      const batchResults = await Promise.allSettled(
        batch.map(match => this.syncOddsForMatch(match.id, match.externalId!))
      );

      for (let j = 0; j < batchResults.length; j++) {
        const batchResult = batchResults[j];
        if (batchResult.status === 'fulfilled') {
          result.totalOdds += batchResult.value.totalOdds;
          result.created += batchResult.value.created;
          result.updated += batchResult.value.updated;
          result.errors.push(...batchResult.value.errors);
        } else {
          const msg = `Failed to sync odds for match ${batch[j].externalId}: ${batchResult.reason}`;
          this.logger.warn(msg);
          result.errors.push(msg);
        }
      }

      processedMatches += batch.length;
      const progress = Math.round((processedMatches / matches.length) * 100);
      
      if (onProgress) {
        await onProgress(progress, processedMatches, matches.length);
      }
    }

    this.betTypeMapCache = null;

    this.logger.log(
      `Odds sync complete: ${result.created} created, ${result.updated} updated for ${result.totalMatches} matches`,
    );
  }

  async syncOddsForLiveMatches(
    onProgress?: (progress: number, processedItems: number, totalItems: number) => Promise<void>,
  ): Promise<OddsSyncResult> {
    const config = this.syncConfig.liveOddsConfig;

    const result: OddsSyncResult = {
      totalMatches: 0,
      totalOdds: 0,
      created: 0,
      updated: 0,
      errors: [],
      syncedAt: new Date().toISOString(),
    };

    if (!config.enabled) {
      this.logger.log('Live odds sync is disabled');
      return result;
    }

    try {
      const liveMatches = await this.prisma.match.findMany({
        where: {
          isLive: true,
          status: 'live',
          externalId: { not: null },
        },
        orderBy: { startTime: 'asc' },
        take: config.maxMatchesPerSync,
      });

      const totalEligible = await this.prisma.match.count({
        where: {
          isLive: true,
          status: 'live',
          externalId: { not: null },
        },
      });

      result.totalMatches = liveMatches.length;
      this.logger.log(
        `Live odds sync: ${liveMatches.length}/${totalEligible} matches selected (limit ${config.maxMatchesPerSync})`,
      );

      if (liveMatches.length === 0) {
        return result;
      }

      this.betTypeMapCache = await this.getBetTypeMap();

      let processedMatches = 0;

      for (let i = 0; i < liveMatches.length; i += PARALLEL_BATCH_SIZE) {
        const batch = liveMatches.slice(i, i + PARALLEL_BATCH_SIZE);
        
        const batchResults = await Promise.allSettled(
          batch.map(match => this.syncLiveOddsForMatch(match.id, match.externalId!))
        );

        for (let j = 0; j < batchResults.length; j++) {
          const batchResult = batchResults[j];
          if (batchResult.status === 'fulfilled') {
            result.totalOdds += batchResult.value.totalOdds;
            result.created += batchResult.value.created;
            result.updated += batchResult.value.updated;
            result.errors.push(...batchResult.value.errors);
          } else {
            const msg = `Failed to sync live odds for match ${batch[j].externalId}: ${batchResult.reason}`;
            this.logger.warn(msg);
            result.errors.push(msg);
          }
        }

        processedMatches += batch.length;
        const progress = Math.round((processedMatches / liveMatches.length) * 100);
        
        if (onProgress) {
          await onProgress(progress, processedMatches, liveMatches.length);
        }
      }

      this.betTypeMapCache = null;

      this.logger.log(`Live odds sync complete: ${result.totalOdds} odds for ${result.totalMatches} matches`);
    } catch (error) {
      const msg = `Live odds sync failed: ${error}`;
      this.logger.error(msg);
      result.errors.push(msg);
      this.betTypeMapCache = null;
    }

    return result;
  }

  async syncOddsForMatch(matchId: string, fixtureExternalId: string): Promise<OddsSyncResult> {
    const result: OddsSyncResult = {
      totalMatches: 1,
      totalOdds: 0,
      created: 0,
      updated: 0,
      errors: [],
      syncedAt: new Date().toISOString(),
    };

    try {
      const fixtureId = parseInt(fixtureExternalId, 10);
      const oddsResponse = await this.apiFootballService.request<any>('/odds', {
        fixture: fixtureId.toString(),
        bookmaker: DEFAULT_BOOKMAKER_ID.toString(),
      });

      if (!oddsResponse.response || oddsResponse.response.length === 0) {
        this.logger.debug(`No odds found for fixture ${fixtureExternalId}`);
        return result;
      }

      const oddsData = oddsResponse.response[0];
      if (!oddsData.bookmakers || oddsData.bookmakers.length === 0) {
        return result;
      }

      const bookmakerBets = oddsData.bookmakers[0].bets;
      const betTypeMap = await this.getBetTypeMap();

      const oddsToUpsert: OddsUpsertItem[] = [];

      for (const bet of bookmakerBets) {
        const betTypeCode = this.mapApiBetIdToBetTypeCode(bet.id);
        if (!betTypeCode || !betTypeMap[betTypeCode]) continue;

        const betType = betTypeMap[betTypeCode];

        for (const value of bet.values) {
          oddsToUpsert.push({
            matchId,
            betTypeId: betType.id,
            selection: value.value,
            oddsValue: value.odd,
            handicap: value.handicap,
          });
        }
      }

      const upsertResult = await this.bulkUpsertOdds(oddsToUpsert);
      result.totalOdds = oddsToUpsert.length;
      result.created = upsertResult.created;
      result.updated = upsertResult.updated;
      result.errors.push(...upsertResult.errors);
    } catch (error) {
      const msg = `Failed to sync odds for match ${matchId}: ${error}`;
      this.logger.error(msg);
      result.errors.push(msg);
    }

    return result;
  }

  async syncLiveOddsForMatch(matchId: string, fixtureExternalId: string): Promise<OddsSyncResult> {
    const result: OddsSyncResult = {
      totalMatches: 1,
      totalOdds: 0,
      created: 0,
      updated: 0,
      errors: [],
      syncedAt: new Date().toISOString(),
    };

    try {
      const fixtureId = parseInt(fixtureExternalId, 10);
      const liveOddsResponse = await this.apiFootballService.request<any>('/odds/live', {
        fixture: fixtureId.toString(),
      });

      if (!liveOddsResponse.response || liveOddsResponse.response.length === 0) {
        return result;
      }

      const liveOdds = liveOddsResponse.response[0];
      if (!liveOdds.odds || liveOdds.odds.length === 0) {
        return result;
      }

      const betTypeMap = await this.getBetTypeMap();

      const oddsToUpsert: OddsUpsertItem[] = [];

      for (const market of liveOdds.odds) {
        const betTypeCode = this.mapApiBetIdToBetTypeCode(market.id);
        if (!betTypeCode || !betTypeMap[betTypeCode]) continue;

        const betType = betTypeMap[betTypeCode];

        for (const value of market.values) {
          oddsToUpsert.push({
            matchId,
            betTypeId: betType.id,
            selection: value.value,
            oddsValue: value.odd,
            handicap: value.handicap,
          });
        }
      }

      const upsertResult = await this.bulkUpsertOdds(oddsToUpsert);
      result.totalOdds = oddsToUpsert.length;
      result.created = upsertResult.created;
      result.updated = upsertResult.updated;
      result.errors.push(...upsertResult.errors);
    } catch (error) {
      const msg = `Failed to sync live odds for match ${matchId}: ${error}`;
      this.logger.error(msg);
      result.errors.push(msg);
    }

    return result;
  }

  private async bulkUpsertOdds(
    items: OddsUpsertItem[],
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    const result = { created: 0, updated: 0, errors: [] as string[] };

    if (items.length === 0) return result;

    try {
      const matchIds = [...new Set(items.map((i) => i.matchId))];

      const existingOdds = await this.prisma.odds.findMany({
        where: { matchId: { in: matchIds } },
        select: {
          id: true,
          matchId: true,
          betTypeId: true,
          selection: true,
          handicap: true,
          oddsValue: true,
        },
      });

      const existingMap = new Map<string, { id: string; oddsValue: Decimal }>();
      for (const odd of existingOdds) {
        const key = this.buildOddsKey(
          odd.matchId,
          odd.betTypeId,
          odd.selection,
          odd.handicap?.toString(),
        );
        existingMap.set(key, { id: odd.id, oddsValue: odd.oddsValue });
      }

      const toCreate: Prisma.OddsCreateManyInput[] = [];
      const toUpdate: Array<{ id: string; oddsValue: Decimal }> = [];

      for (const item of items) {
        const key = this.buildOddsKey(
          item.matchId,
          item.betTypeId,
          item.selection,
          item.handicap,
        );
        const existing = existingMap.get(key);
        const newOddsValue = new Decimal(item.oddsValue);

        if (existing) {
          if (!existing.oddsValue.equals(newOddsValue)) {
            toUpdate.push({ id: existing.id, oddsValue: newOddsValue });
          }
        } else {
          toCreate.push({
            matchId: item.matchId,
            betTypeId: item.betTypeId,
            selection: item.selection,
            selectionName: item.selection,
            oddsValue: newOddsValue,
            handicap: item.handicap ? new Decimal(item.handicap) : null,
            status: OddsStatus.active,
          });
        }
      }

      if (toCreate.length > 0) {
        for (let i = 0; i < toCreate.length; i += DB_BATCH_SIZE) {
          const batch = toCreate.slice(i, i + DB_BATCH_SIZE);
          const createResult = await this.prisma.odds.createMany({
            data: batch,
            skipDuplicates: true,
          });
          result.created += createResult.count;
        }
      }

      if (toUpdate.length > 0) {
        for (let i = 0; i < toUpdate.length; i += DB_BATCH_SIZE) {
          const batch = toUpdate.slice(i, i + DB_BATCH_SIZE);
          await this.prisma.$transaction(
            batch.map((u) =>
              this.prisma.odds.update({
                where: { id: u.id },
                data: { oddsValue: u.oddsValue },
              }),
            ),
          );
          result.updated += batch.length;
        }
      }
    } catch (error) {
      const msg = `Bulk upsert failed: ${error}`;
      this.logger.error(msg);
      result.errors.push(msg);
    }

    return result;
  }

  private buildOddsKey(
    matchId: string,
    betTypeId: string,
    selection: string,
    handicap?: string | null,
  ): string {
    return `${matchId}:${betTypeId}:${selection}:${handicap ?? 'null'}`;
  }

  private async getBetTypeMap(): Promise<Record<string, any>> {
    if (this.betTypeMapCache) {
      return this.betTypeMapCache;
    }
    
    const betTypes = await this.prisma.betType.findMany();
    return betTypes.reduce((map, bt) => {
      map[bt.code] = bt;
      return map;
    }, {} as Record<string, any>);
  }

  private mapApiBetIdToBetTypeCode(apiBetId: number): string | null {
    const mapping: Record<number, string> = {
      [API_FOOTBALL_BET_IDS.MATCH_WINNER]: 'match_winner',
      [API_FOOTBALL_BET_IDS.ASIAN_HANDICAP]: 'asian_handicap',
      [API_FOOTBALL_BET_IDS.OVER_UNDER]: 'over_under',
      [API_FOOTBALL_BET_IDS.BOTH_TEAMS_SCORE]: 'btts',
      [API_FOOTBALL_BET_IDS.DOUBLE_CHANCE]: 'double_chance',
      [API_FOOTBALL_BET_IDS.HOME_TEAM_TOTAL]: 'home_total',
      [API_FOOTBALL_BET_IDS.AWAY_TEAM_TOTAL]: 'away_total',
      [API_FOOTBALL_BET_IDS.HT_MATCH_WINNER]: 'ht_match_winner',
      [API_FOOTBALL_BET_IDS.HT_ASIAN_HANDICAP]: 'ht_asian_handicap',
      [API_FOOTBALL_BET_IDS.HT_OVER_UNDER]: 'ht_over_under',
    };

    return mapping[apiBetId] || null;
  }

  async getOddsStats(): Promise<{ total: number; byBetType: Record<string, number> }> {
    const total = await this.prisma.odds.count();
    
    const byBetType = await this.prisma.odds.groupBy({
      by: ['betTypeId'],
      _count: { id: true },
    });

    const betTypes = await this.prisma.betType.findMany();
    const betTypeMap = betTypes.reduce((map, bt) => {
      map[bt.id] = bt.code;
      return map;
    }, {} as Record<string, string>);

    return {
      total,
      byBetType: byBetType.reduce((acc, item) => {
        acc[betTypeMap[item.betTypeId] || item.betTypeId] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async invalidateCache(): Promise<void> {
    const client = this.redis.getClient();
    const keys = await client.keys(`${CACHE_KEY_ODDS}:*`);
    if (keys.length > 0) {
      await client.del(...keys);
    }
    this.logger.log('Odds cache invalidated');
  }
}
