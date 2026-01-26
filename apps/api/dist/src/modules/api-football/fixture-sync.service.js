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
var FixtureSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixtureSyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const api_football_service_1 = require("./api-football.service");
const interfaces_1 = require("./interfaces");
const client_1 = require("@prisma/client");
const api_football_constants_1 = require("./constants/api-football.constants");
const CACHE_KEY_FIXTURES = 'api_football:fixtures';
let FixtureSyncService = FixtureSyncService_1 = class FixtureSyncService {
    constructor(prisma, redis, apiFootballService) {
        this.prisma = prisma;
        this.redis = redis;
        this.apiFootballService = apiFootballService;
        this.logger = new common_1.Logger(FixtureSyncService_1.name);
    }
    async syncFixturesByDate(dateFrom, dateTo) {
        const result = {
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
            const activeLeagueExternalIds = new Set();
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
                    const relevantFixtures = fixturesForDate.filter((f) => activeLeagueExternalIds.has(f.league.id.toString()));
                    result.totalFetched += relevantFixtures.length;
                    for (const apiFixture of relevantFixtures) {
                        try {
                            const syncResult = await this.syncSingleFixture(apiFixture);
                            if (syncResult.created)
                                result.created++;
                            if (syncResult.updated)
                                result.updated++;
                            if (syncResult.skipped)
                                result.skipped++;
                        }
                        catch (error) {
                            const msg = `Failed to sync fixture ${apiFixture.fixture.id}: ${error}`;
                            this.logger.warn(msg);
                            result.errors.push(msg);
                        }
                    }
                }
                catch (error) {
                    const msg = `Failed to sync fixtures for date ${dateStr}: ${error}`;
                    this.logger.error(msg);
                    result.errors.push(msg);
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            this.logger.log(`Fixture sync complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`);
        }
        catch (error) {
            const msg = `Fixture sync failed: ${error}`;
            this.logger.error(msg);
            result.errors.push(msg);
        }
        return result;
    }
    async syncFixturesForLeague(leagueExternalId, dateFrom, dateTo) {
        const result = {
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
                        if (syncResult.created)
                            result.created++;
                        if (syncResult.updated)
                            result.updated++;
                        if (syncResult.skipped)
                            result.skipped++;
                    }
                    catch (error) {
                        const msg = `Failed to sync fixture ${apiFixture.fixture.id}: ${error}`;
                        this.logger.warn(msg);
                        result.errors.push(msg);
                    }
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        catch (error) {
            const msg = `Failed to sync fixtures for league ${leagueExternalId}: ${error}`;
            this.logger.error(msg);
            result.errors.push(msg);
        }
        return result;
    }
    async syncSingleFixture(apiFixture) {
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
            this.logger.warn(`Teams not found (home: ${apiFixture.teams.home.id}, away: ${apiFixture.teams.away.id}), skipping fixture ${fixtureExternalId}`);
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
            isLive: interfaces_1.LIVE_STATUSES.includes(apiFixture.fixture.status.short),
            liveMinute: apiFixture.fixture.status.elapsed,
            period: apiFixture.fixture.status.long,
            externalId: fixtureExternalId,
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
        if (existing) {
            await this.prisma.match.update({
                where: { id: existing.id },
                data: matchData,
            });
            return { updated: true };
        }
        else {
            await this.prisma.match.create({
                data: matchData,
            });
            return { created: true };
        }
    }
    async fetchFixturesForLeagueAndDate(leagueExternalId, date) {
        const cacheKey = `${CACHE_KEY_FIXTURES}:league:${leagueExternalId}:${date}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached) {
            this.logger.debug(`Using cached fixtures for league ${leagueExternalId} on ${date}`);
            return cached;
        }
        const params = {
            league: leagueExternalId.toString(),
            date,
        };
        const response = await this.apiFootballService['makeApiRequest']('/fixtures', params);
        const fixtures = response.response;
        await this.redis.setJson(cacheKey, fixtures, api_football_constants_1.CACHE_TTL_SECONDS.FIXTURES);
        return fixtures;
    }
    async fetchFixturesForDate(date) {
        const cacheKey = `${CACHE_KEY_FIXTURES}:date:${date}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached) {
            this.logger.debug(`Using cached fixtures for date ${date}`);
            return cached;
        }
        const response = await this.apiFootballService['makeApiRequest']('/fixtures', { date });
        const fixtures = response.response;
        await this.redis.setJson(cacheKey, fixtures, api_football_constants_1.CACHE_TTL_SECONDS.FIXTURES);
        return fixtures;
    }
    async findTeamByExternalId(externalId) {
        return this.prisma.team.findFirst({
            where: { externalId },
        });
    }
    mapFixtureStatus(statusShort) {
        if (interfaces_1.LIVE_STATUSES.includes(statusShort))
            return client_1.MatchStatus.live;
        if (interfaces_1.FINISHED_STATUSES.includes(statusShort))
            return client_1.MatchStatus.finished;
        if (interfaces_1.SCHEDULED_STATUSES.includes(statusShort))
            return client_1.MatchStatus.scheduled;
        if (statusShort === 'PST')
            return client_1.MatchStatus.postponed;
        if (statusShort === 'CANC' || statusShort === 'ABD')
            return client_1.MatchStatus.cancelled;
        return client_1.MatchStatus.scheduled;
    }
    async getFixturesCount() {
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
            }, {}),
        };
    }
    async invalidateCache() {
        const client = this.redis.getClient();
        const keys = await client.keys(`${CACHE_KEY_FIXTURES}:*`);
        if (keys.length > 0) {
            await client.del(...keys);
        }
        this.logger.log('Fixtures cache invalidated');
    }
};
exports.FixtureSyncService = FixtureSyncService;
exports.FixtureSyncService = FixtureSyncService = FixtureSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        api_football_service_1.ApiFootballService])
], FixtureSyncService);
//# sourceMappingURL=fixture-sync.service.js.map