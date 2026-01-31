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
exports.FeaturedMatchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let FeaturedMatchesService = class FeaturedMatchesService {
    constructor(prisma) {
        this.prisma = prisma;
        this.SETTINGS_KEY = 'featured_matches_settings';
    }
    async getSettings() {
        const setting = await this.prisma.setting.findUnique({
            where: { key: this.SETTINGS_KEY },
        });
        if (!setting) {
            return this.getDefaultSettings();
        }
        return setting.value;
    }
    async updateSettings(settings) {
        const currentSettings = await this.getSettings();
        const mergedSettings = { ...currentSettings, ...settings };
        await this.prisma.setting.upsert({
            where: { key: this.SETTINGS_KEY },
            create: {
                key: this.SETTINGS_KEY,
                value: mergedSettings,
                description: 'Featured Matches Settings',
                category: 'matches',
                isPublic: false,
            },
            update: {
                value: mergedSettings,
            },
        });
        return mergedSettings;
    }
    getDefaultSettings() {
        return {
            featuredLeagueIds: [],
            topTeamRankThreshold: 4,
            topTeamIds: [],
            derbyPairs: [],
            maxFeaturedMatches: 10,
            autoSelectEnabled: true,
            includeUpcoming: true,
            includeLive: true,
            upcomingHours: 24,
        };
    }
    async getFeaturedMatches() {
        const settings = await this.getSettings();
        const now = new Date();
        const upcomingLimit = new Date(now.getTime() + settings.upcomingHours * 60 * 60 * 1000);
        const conditions = [];
        if (settings.featuredLeagueIds.length > 0) {
            conditions.push({
                leagueId: { in: settings.featuredLeagueIds },
            });
        }
        if (settings.topTeamIds.length > 0) {
            conditions.push({
                OR: [
                    { homeTeamId: { in: settings.topTeamIds } },
                    { awayTeamId: { in: settings.topTeamIds } },
                ],
            });
        }
        if (settings.derbyPairs.length > 0) {
            const derbyConditions = settings.derbyPairs.map((pair) => ({
                OR: [
                    { homeTeamId: pair.homeTeamId, awayTeamId: pair.awayTeamId },
                    { homeTeamId: pair.awayTeamId, awayTeamId: pair.homeTeamId },
                ],
            }));
            conditions.push({ OR: derbyConditions });
        }
        conditions.push({ isFeatured: true });
        const statusFilters = [];
        if (settings.includeLive) {
            statusFilters.push({ status: client_1.MatchStatus.live });
        }
        if (settings.includeUpcoming) {
            statusFilters.push({
                status: client_1.MatchStatus.scheduled,
                startTime: { gte: now, lte: upcomingLimit },
            });
        }
        let matches = await this.prisma.match.findMany({
            where: {
                AND: [
                    { OR: conditions.length > 0 ? conditions : [{}] },
                    { OR: statusFilters.length > 0 ? statusFilters : [{}] },
                ],
            },
            take: settings.maxFeaturedMatches,
            orderBy: [
                { isLive: 'desc' },
                { startTime: 'asc' },
            ],
            include: {
                league: { include: { sport: true } },
                homeTeam: true,
                awayTeam: true,
            },
        });
        if (matches.length === 0) {
            matches = await this.prisma.match.findMany({
                where: {
                    status: client_1.MatchStatus.live,
                },
                take: settings.maxFeaturedMatches,
                orderBy: [
                    { startTime: 'asc' },
                ],
                include: {
                    league: { include: { sport: true } },
                    homeTeam: true,
                    awayTeam: true,
                },
            });
        }
        if (matches.length === 0) {
            matches = await this.prisma.match.findMany({
                where: {
                    status: client_1.MatchStatus.scheduled,
                    startTime: { gte: now },
                },
                take: settings.maxFeaturedMatches,
                orderBy: [
                    { startTime: 'asc' },
                ],
                include: {
                    league: { include: { sport: true } },
                    homeTeam: true,
                    awayTeam: true,
                },
            });
        }
        return matches;
    }
    async getStats() {
        const settings = await this.getSettings();
        const now = new Date();
        const upcomingLimit = new Date(now.getTime() + settings.upcomingHours * 60 * 60 * 1000);
        const featuredMatches = await this.prisma.match.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { isFeatured: true },
                            { leagueId: { in: settings.featuredLeagueIds } },
                        ],
                    },
                    {
                        OR: [
                            { status: client_1.MatchStatus.live },
                            {
                                status: client_1.MatchStatus.scheduled,
                                startTime: { gte: now, lte: upcomingLimit },
                            },
                        ],
                    },
                ],
            },
            include: {
                league: true,
            },
        });
        const leagueMap = new Map();
        const statusMap = new Map();
        let liveCount = 0;
        let upcomingCount = 0;
        for (const match of featuredMatches) {
            const leagueKey = match.leagueId;
            const leagueData = leagueMap.get(leagueKey) || { leagueName: match.league.name, count: 0 };
            leagueData.count++;
            leagueMap.set(leagueKey, leagueData);
            statusMap.set(match.status, (statusMap.get(match.status) || 0) + 1);
            if (match.status === client_1.MatchStatus.live)
                liveCount++;
            if (match.status === client_1.MatchStatus.scheduled)
                upcomingCount++;
        }
        return {
            totalFeatured: featuredMatches.length,
            byLeague: Array.from(leagueMap.entries()).map(([leagueId, data]) => ({
                leagueId,
                leagueName: data.leagueName,
                count: data.count,
            })),
            byStatus: Array.from(statusMap.entries()).map(([status, count]) => ({
                status,
                count,
            })),
            liveCount,
            upcomingCount,
        };
    }
    async autoSelectFeaturedMatches() {
        const settings = await this.getSettings();
        if (!settings.autoSelectEnabled) {
            return { updated: 0 };
        }
        const now = new Date();
        const upcomingLimit = new Date(now.getTime() + settings.upcomingHours * 60 * 60 * 1000);
        await this.prisma.match.updateMany({
            where: {
                isFeatured: true,
                status: { in: [client_1.MatchStatus.scheduled, client_1.MatchStatus.live] },
            },
            data: { isFeatured: false },
        });
        const conditions = [];
        if (settings.featuredLeagueIds.length > 0) {
            conditions.push({ leagueId: { in: settings.featuredLeagueIds } });
        }
        if (settings.topTeamIds.length > 0) {
            conditions.push({
                OR: [
                    { homeTeamId: { in: settings.topTeamIds } },
                    { awayTeamId: { in: settings.topTeamIds } },
                ],
            });
        }
        if (settings.derbyPairs.length > 0) {
            for (const pair of settings.derbyPairs) {
                conditions.push({
                    OR: [
                        { homeTeamId: pair.homeTeamId, awayTeamId: pair.awayTeamId },
                        { homeTeamId: pair.awayTeamId, awayTeamId: pair.homeTeamId },
                    ],
                });
            }
        }
        if (conditions.length === 0) {
            return { updated: 0 };
        }
        const matchesToFeature = await this.prisma.match.findMany({
            where: {
                AND: [
                    { OR: conditions },
                    {
                        OR: [
                            { status: client_1.MatchStatus.live },
                            {
                                status: client_1.MatchStatus.scheduled,
                                startTime: { gte: now, lte: upcomingLimit },
                            },
                        ],
                    },
                ],
            },
            take: settings.maxFeaturedMatches,
            orderBy: [
                { status: 'asc' },
                { startTime: 'asc' },
            ],
            select: { id: true },
        });
        const matchIds = matchesToFeature.map((m) => m.id);
        if (matchIds.length > 0) {
            await this.prisma.match.updateMany({
                where: { id: { in: matchIds } },
                data: { isFeatured: true },
            });
        }
        return { updated: matchIds.length };
    }
    async toggleMatchFeatured(matchId) {
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
        });
        if (!match) {
            throw new common_1.NotFoundException('Match not found');
        }
        return this.prisma.match.update({
            where: { id: matchId },
            data: { isFeatured: !match.isFeatured },
            include: {
                league: { include: { sport: true } },
                homeTeam: true,
                awayTeam: true,
            },
        });
    }
    async batchUpdateFeatured(matchIds, featured) {
        const result = await this.prisma.match.updateMany({
            where: { id: { in: matchIds } },
            data: { isFeatured: featured },
        });
        return { updated: result.count };
    }
    async getAvailableLeagues() {
        return this.prisma.league.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            include: {
                sport: true,
                _count: { select: { matches: true } },
            },
        });
    }
    async getAvailableTeams(leagueId) {
        return this.prisma.team.findMany({
            where: {
                isActive: true,
                ...(leagueId && {
                    OR: [
                        { homeMatches: { some: { leagueId } } },
                        { awayMatches: { some: { leagueId } } },
                    ],
                }),
            },
            orderBy: { name: 'asc' },
            include: {
                sport: true,
            },
        });
    }
};
exports.FeaturedMatchesService = FeaturedMatchesService;
exports.FeaturedMatchesService = FeaturedMatchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FeaturedMatchesService);
//# sourceMappingURL=featured-matches.service.js.map