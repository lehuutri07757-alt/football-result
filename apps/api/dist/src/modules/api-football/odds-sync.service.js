"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OddsSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OddsSyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const api_football_service_1 = require("./api-football.service");
const api_football_constants_1 = require("./constants/api-football.constants");
const library_1 = require("@prisma/client/runtime/library");
const CACHE_KEY_ODDS = 'api_football:odds';
let OddsSyncService = OddsSyncService_1 = class OddsSyncService {
    constructor(prisma, redis, apiFootballService) {
        this.prisma = prisma;
        this.redis = redis;
        this.apiFootballService = apiFootballService;
        this.logger = new common_1.Logger(OddsSyncService_1.name);
    }
    async syncOddsForUpcomingMatches(hoursAhead = 48) {
        const result = {
            totalMatches: 0,
            totalOdds: 0,
            created: 0,
            updated: 0,
            errors: [],
            syncedAt: new Date().toISOString(),
        };
        try {
            const now = new Date();
            const futureDate = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
            const matches = await this.prisma.match.findMany({
                where: {
                    startTime: { gte: now, lte: futureDate },
                    status: 'scheduled',
                    bettingEnabled: true,
                    externalId: { not: null },
                },
                take: 50,
            });
            result.totalMatches = matches.length;
            this.logger.log(`Syncing odds for ${matches.length} upcoming matches...`);
            for (const match of matches) {
                try {
                    const matchResult = await this.syncOddsForMatch(match.id, match.externalId);
                    result.totalOdds += matchResult.totalOdds;
                    result.created += matchResult.created;
                    result.updated += matchResult.updated;
                }
                catch (error) {
                    const msg = `Failed to sync odds for match ${match.externalId}: ${error}`;
                    this.logger.warn(msg);
                    result.errors.push(msg);
                }
            }
            this.logger.log(`Odds sync complete: ${result.created} created, ${result.updated} updated for ${result.totalMatches} matches`);
        }
        catch (error) {
            const msg = `Odds sync failed: ${error}`;
            this.logger.error(msg);
            result.errors.push(msg);
        }
        return result;
    }
    async syncOddsForLiveMatches() {
        const result = {
            totalMatches: 0,
            totalOdds: 0,
            created: 0,
            updated: 0,
            errors: [],
            syncedAt: new Date().toISOString(),
        };
        try {
            const liveMatches = await this.prisma.match.findMany({
                where: {
                    isLive: true,
                    status: 'live',
                    bettingEnabled: true,
                    externalId: { not: null },
                },
                take: 30,
            });
            result.totalMatches = liveMatches.length;
            this.logger.log(`Syncing live odds for ${liveMatches.length} matches...`);
            for (const match of liveMatches) {
                try {
                    const matchResult = await this.syncLiveOddsForMatch(match.id, match.externalId);
                    result.totalOdds += matchResult.totalOdds;
                    result.created += matchResult.created;
                    result.updated += matchResult.updated;
                }
                catch (error) {
                    const msg = `Failed to sync live odds for match ${match.externalId}: ${error}`;
                    this.logger.warn(msg);
                    result.errors.push(msg);
                }
            }
            this.logger.log(`Live odds sync complete: ${result.totalOdds} odds for ${result.totalMatches} matches`);
        }
        catch (error) {
            const msg = `Live odds sync failed: ${error}`;
            this.logger.error(msg);
            result.errors.push(msg);
        }
        return result;
    }
    async syncOddsForMatch(matchId, fixtureExternalId) {
        const result = {
            totalMatches: 1,
            totalOdds: 0,
            created: 0,
            updated: 0,
            errors: [],
            syncedAt: new Date().toISOString(),
        };
        try {
            const fixtureId = parseInt(fixtureExternalId, 10);
            const oddsResponse = await this.apiFootballService['makeApiRequest']('/odds', {
                fixture: fixtureId.toString(),
                bookmaker: api_football_constants_1.DEFAULT_BOOKMAKER_ID.toString(),
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
            for (const bet of bookmakerBets) {
                const betTypeCode = this.mapApiBetIdToBetTypeCode(bet.id);
                if (!betTypeCode || !betTypeMap[betTypeCode])
                    continue;
                const betType = betTypeMap[betTypeCode];
                for (const value of bet.values) {
                    try {
                        const oddsRecord = await this.upsertOdds(matchId, betType.id, value.value, value.odd, value.handicap);
                        if (oddsRecord.created)
                            result.created++;
                        if (oddsRecord.updated)
                            result.updated++;
                        result.totalOdds++;
                    }
                    catch (error) {
                        const msg = `Failed to upsert odds: ${error}`;
                        this.logger.warn(msg);
                        result.errors.push(msg);
                    }
                }
            }
        }
        catch (error) {
            const msg = `Failed to sync odds for match ${matchId}: ${error}`;
            this.logger.error(msg);
            result.errors.push(msg);
        }
        return result;
    }
    async syncLiveOddsForMatch(matchId, fixtureExternalId) {
        const result = {
            totalMatches: 1,
            totalOdds: 0,
            created: 0,
            updated: 0,
            errors: [],
            syncedAt: new Date().toISOString(),
        };
        try {
            const fixtureId = parseInt(fixtureExternalId, 10);
            const liveOddsResponse = await this.apiFootballService['makeApiRequest']('/odds/live', {
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
            for (const market of liveOdds.odds) {
                const betTypeCode = this.mapApiBetIdToBetTypeCode(market.id);
                if (!betTypeCode || !betTypeMap[betTypeCode])
                    continue;
                const betType = betTypeMap[betTypeCode];
                for (const value of market.values) {
                    try {
                        const oddsRecord = await this.upsertOdds(matchId, betType.id, value.value, value.odd, value.handicap);
                        if (oddsRecord.created)
                            result.created++;
                        if (oddsRecord.updated)
                            result.updated++;
                        result.totalOdds++;
                    }
                    catch (error) {
                        const msg = `Failed to upsert live odds: ${error}`;
                        this.logger.warn(msg);
                        result.errors.push(msg);
                    }
                }
            }
        }
        catch (error) {
            const msg = `Failed to sync live odds for match ${matchId}: ${error}`;
            this.logger.error(msg);
            result.errors.push(msg);
        }
        return result;
    }
    async upsertOdds(matchId, betTypeId, selection, oddsValue, handicap) {
        const existing = await this.prisma.odds.findFirst({
            where: {
                matchId,
                betTypeId,
                selection,
                handicap: handicap ? new library_1.Decimal(handicap) : null,
            },
        });
        const oddsData = {
            matchId,
            betTypeId,
            selection,
            selectionName: selection,
            oddsValue: new library_1.Decimal(oddsValue),
            handicap: handicap ? new library_1.Decimal(handicap) : null,
            status: 'active',
        };
        if (existing) {
            await this.prisma.odds.update({
                where: { id: existing.id },
                data: { oddsValue: new library_1.Decimal(oddsValue) },
            });
            return { updated: true };
        }
        else {
            await this.prisma.odds.create({ data: oddsData });
            return { created: true };
        }
    }
    async getBetTypeMap() {
        const betTypes = await this.prisma.betType.findMany();
        return betTypes.reduce((map, bt) => {
            map[bt.code] = bt;
            return map;
        }, {});
    }
    mapApiBetIdToBetTypeCode(apiBetId) {
        const mapping = {
            [api_football_constants_1.API_FOOTBALL_BET_IDS.MATCH_WINNER]: 'match_winner',
            [api_football_constants_1.API_FOOTBALL_BET_IDS.ASIAN_HANDICAP]: 'asian_handicap',
            [api_football_constants_1.API_FOOTBALL_BET_IDS.OVER_UNDER]: 'over_under',
            [api_football_constants_1.API_FOOTBALL_BET_IDS.BOTH_TEAMS_SCORE]: 'btts',
            [api_football_constants_1.API_FOOTBALL_BET_IDS.DOUBLE_CHANCE]: 'double_chance',
            [api_football_constants_1.API_FOOTBALL_BET_IDS.HOME_TEAM_TOTAL]: 'home_total',
            [api_football_constants_1.API_FOOTBALL_BET_IDS.AWAY_TEAM_TOTAL]: 'away_total',
            [api_football_constants_1.API_FOOTBALL_BET_IDS.HT_MATCH_WINNER]: 'ht_match_winner',
            [api_football_constants_1.API_FOOTBALL_BET_IDS.HT_ASIAN_HANDICAP]: 'ht_asian_handicap',
            [api_football_constants_1.API_FOOTBALL_BET_IDS.HT_OVER_UNDER]: 'ht_over_under',
        };
        return mapping[apiBetId] || null;
    }
    async getOddsStats() {
        const total = await this.prisma.odds.count();
        const byBetType = await this.prisma.odds.groupBy({
            by: ['betTypeId'],
            _count: { id: true },
        });
        const betTypes = await this.prisma.betType.findMany();
        const betTypeMap = betTypes.reduce((map, bt) => {
            map[bt.id] = bt.code;
            return map;
        }, {});
        return {
            total,
            byBetType: byBetType.reduce((acc, item) => {
                acc[betTypeMap[item.betTypeId] || item.betTypeId] = item._count.id;
                return acc;
            }, {}),
        };
    }
    async invalidateCache() {
        const client = this.redis.getClient();
        const keys = await client.keys(`${CACHE_KEY_ODDS}:*`);
        if (keys.length > 0) {
            await client.del(...keys);
        }
        this.logger.log('Odds cache invalidated');
    }
};
exports.OddsSyncService = OddsSyncService;
exports.OddsSyncService = OddsSyncService = OddsSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        api_football_service_1.ApiFootballService])
], OddsSyncService);
//# sourceMappingURL=odds-sync.service.js.map