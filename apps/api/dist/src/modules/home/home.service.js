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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const client_1 = require("@prisma/client");
const home_constants_1 = require("./constants/home.constants");
let HomeService = class HomeService {
    constructor(prisma, redisService) {
        this.prisma = prisma;
        this.redisService = redisService;
    }
    async getFeed(query) {
        const limit = query.limit ?? home_constants_1.HOME_FEED_DEFAULT_LIMIT;
        const cacheKey = this.buildCacheKey({ sportId: query.sportId, limit });
        const cached = await this.redisService.getJson(cacheKey);
        if (cached)
            return cached;
        const whereLive = {
            status: client_1.MatchStatus.live,
            isLive: true,
            ...(query.sportId ? { league: { sportId: query.sportId } } : {}),
        };
        const topLiveMatchesRaw = await this.prisma.match.findMany({
            where: whereLive,
            take: limit,
            orderBy: [{ isFeatured: 'desc' }, { startTime: 'asc' }],
            include: {
                league: { select: { id: true, name: true } },
                homeTeam: { select: { id: true, name: true, logoUrl: true } },
                awayTeam: { select: { id: true, name: true, logoUrl: true } },
            },
        });
        const matchIds = topLiveMatchesRaw.map((m) => m.id);
        const leaguesAgg = await this.prisma.match.groupBy({
            by: ['leagueId'],
            where: whereLive,
            _count: { leagueId: true },
            orderBy: { _count: { leagueId: 'desc' } },
            take: Math.min(30, limit),
        });
        const leagueIds = leaguesAgg.map((x) => x.leagueId);
        const leagues = leagueIds.length
            ? await this.prisma.league.findMany({
                where: { id: { in: leagueIds }, ...(query.sportId ? { sportId: query.sportId } : {}) },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    country: true,
                    countryCode: true,
                    logoUrl: true,
                },
            })
            : [];
        const leagueById = new Map(leagues.map((l) => [l.id, l]));
        const hotLeagues = leaguesAgg.flatMap((x) => {
            const league = leagueById.get(x.leagueId);
            if (!league)
                return [];
            return [
                {
                    id: league.id,
                    name: league.name,
                    slug: league.slug,
                    country: league.country,
                    countryCode: league.countryCode,
                    logoUrl: league.logoUrl,
                    liveMatchCount: x._count.leagueId,
                },
            ];
        });
        const topLiveMatches = topLiveMatchesRaw.map((m) => ({
            id: m.id,
            leagueId: m.league.id,
            leagueName: m.league.name,
            startTime: m.startTime.toISOString(),
            status: m.status,
            isLive: m.isLive,
            liveMinute: m.liveMinute,
            period: m.period ?? null,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            homeTeam: {
                id: m.homeTeam.id,
                name: m.homeTeam.name,
                logoUrl: m.homeTeam.logoUrl,
            },
            awayTeam: {
                id: m.awayTeam.id,
                name: m.awayTeam.name,
                logoUrl: m.awayTeam.logoUrl,
            },
        }));
        const oddsSnapshotByMatchId = {};
        if (matchIds.length > 0) {
            const odds = await this.prisma.odds.findMany({
                where: {
                    matchId: { in: matchIds },
                    status: client_1.OddsStatus.active,
                },
                orderBy: [{ matchId: 'asc' }, { betTypeId: 'asc' }, { selection: 'asc' }],
                include: {
                    betType: { select: { id: true, code: true } },
                },
            });
            for (const row of odds) {
                if (!oddsSnapshotByMatchId[row.matchId])
                    oddsSnapshotByMatchId[row.matchId] = [];
                if (oddsSnapshotByMatchId[row.matchId].length >= 30)
                    continue;
                oddsSnapshotByMatchId[row.matchId].push({
                    betTypeId: row.betType.id,
                    betTypeCode: row.betType.code,
                    selection: row.selection,
                    handicap: row.handicap ? row.handicap.toString() : null,
                    oddsValue: row.oddsValue.toString(),
                });
            }
        }
        const result = {
            hotLeagues,
            topLiveMatches,
            oddsSnapshotByMatchId,
            lastUpdate: new Date().toISOString(),
        };
        await this.redisService.setJson(cacheKey, result, home_constants_1.HOME_FEED_TTL_SECONDS);
        return result;
    }
    buildCacheKey(params) {
        return `home:feed:sport:${params.sportId || 'all'}:limit:${params.limit}`;
    }
};
exports.HomeService = HomeService;
exports.HomeService = HomeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], HomeService);
//# sourceMappingURL=home.service.js.map