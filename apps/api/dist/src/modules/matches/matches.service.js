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
exports.MatchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let MatchesService = class MatchesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createMatchDto) {
        const [league, homeTeam, awayTeam] = await Promise.all([
            this.prisma.league.findUnique({ where: { id: createMatchDto.leagueId } }),
            this.prisma.team.findUnique({ where: { id: createMatchDto.homeTeamId } }),
            this.prisma.team.findUnique({ where: { id: createMatchDto.awayTeamId } }),
        ]);
        if (!league)
            throw new common_1.NotFoundException('League not found');
        if (!homeTeam)
            throw new common_1.NotFoundException('Home team not found');
        if (!awayTeam)
            throw new common_1.NotFoundException('Away team not found');
        if (createMatchDto.homeTeamId === createMatchDto.awayTeamId) {
            throw new common_1.BadRequestException('Home team and away team cannot be the same');
        }
        return this.prisma.match.create({
            data: {
                ...createMatchDto,
                startTime: new Date(createMatchDto.startTime),
            },
            include: {
                league: { include: { sport: true } },
                homeTeam: true,
                awayTeam: true,
            },
        });
    }
    async findAll(query) {
        const { page = 1, limit = 10, search, leagueId, sportId, teamId, status, isLive, isFeatured, bettingEnabled, dateFrom, dateTo, sortBy = 'startTime', sortOrder = 'asc', } = query;
        const skip = (page - 1) * limit;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const effectiveDateFrom = dateFrom ? new Date(dateFrom) : todayStart;
        const effectiveDateTo = dateTo ? new Date(dateTo) : undefined;
        const where = {
            ...(leagueId && { leagueId }),
            ...(sportId && { league: { sportId } }),
            ...(teamId && {
                OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
            }),
            ...(status && { status }),
            ...(isLive !== undefined && { isLive }),
            ...(isFeatured !== undefined && { isFeatured }),
            ...(bettingEnabled !== undefined && { bettingEnabled }),
            ...(effectiveDateFrom && { startTime: { gte: effectiveDateFrom } }),
            ...(effectiveDateTo && { startTime: { lte: effectiveDateTo } }),
            ...(search && {
                OR: [
                    { homeTeam: { name: { contains: search, mode: 'insensitive' } } },
                    { awayTeam: { name: { contains: search, mode: 'insensitive' } } },
                    { league: { name: { contains: search, mode: 'insensitive' } } },
                ],
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.match.findMany({
                skip,
                take: limit,
                where,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    league: { include: { sport: true } },
                    homeTeam: true,
                    awayTeam: true,
                    _count: {
                        select: { odds: true, betSelections: true },
                    },
                },
            }),
            this.prisma.match.count({ where }),
        ]);
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findLive() {
        return this.prisma.match.findMany({
            where: { status: client_1.MatchStatus.live, isLive: true },
            orderBy: { startTime: 'asc' },
            include: {
                league: { include: { sport: true } },
                homeTeam: true,
                awayTeam: true,
            },
        });
    }
    async findUpcoming(limit = 10) {
        const take = Number.isFinite(limit) && limit > 0 ? limit : 10;
        return this.prisma.match.findMany({
            where: {
                status: client_1.MatchStatus.scheduled,
                startTime: { gte: new Date() },
            },
            take,
            orderBy: { startTime: 'asc' },
            include: {
                league: { include: { sport: true } },
                homeTeam: true,
                awayTeam: true,
            },
        });
    }
    async findToday() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this.prisma.match.findMany({
            where: {
                startTime: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            orderBy: { startTime: 'asc' },
            include: {
                league: { include: { sport: true } },
                homeTeam: true,
                awayTeam: true,
            },
        });
    }
    async findFeatured() {
        const now = new Date();
        const maxFeatured = 10;
        let matches = await this.prisma.match.findMany({
            where: {
                isFeatured: true,
                OR: [
                    { status: client_1.MatchStatus.live },
                    {
                        status: client_1.MatchStatus.scheduled,
                        startTime: { gte: now },
                    },
                ],
            },
            take: maxFeatured,
            orderBy: [{ isLive: 'desc' }, { startTime: 'asc' }],
            include: {
                league: { include: { sport: true } },
                homeTeam: true,
                awayTeam: true,
            },
        });
        if (matches.length === 0) {
            matches = await this.prisma.match.findMany({
                where: { status: client_1.MatchStatus.live },
                take: maxFeatured,
                orderBy: { startTime: 'asc' },
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
                take: maxFeatured,
                orderBy: { startTime: 'asc' },
                include: {
                    league: { include: { sport: true } },
                    homeTeam: true,
                    awayTeam: true,
                },
            });
        }
        return matches;
    }
    async findOne(id) {
        const match = await this.prisma.match.findUnique({
            where: { id },
            include: {
                league: { include: { sport: true } },
                homeTeam: true,
                awayTeam: true,
                odds: {
                    include: { betType: true },
                    where: { status: client_1.OddsStatus.active },
                },
                _count: {
                    select: { betSelections: true },
                },
            },
        });
        if (!match) {
            throw new common_1.NotFoundException('Match not found');
        }
        return match;
    }
    async update(id, updateMatchDto) {
        await this.findOne(id);
        if (updateMatchDto.leagueId) {
            const league = await this.prisma.league.findUnique({
                where: { id: updateMatchDto.leagueId },
            });
            if (!league)
                throw new common_1.NotFoundException('League not found');
        }
        if (updateMatchDto.homeTeamId) {
            const homeTeam = await this.prisma.team.findUnique({
                where: { id: updateMatchDto.homeTeamId },
            });
            if (!homeTeam)
                throw new common_1.NotFoundException('Home team not found');
        }
        if (updateMatchDto.awayTeamId) {
            const awayTeam = await this.prisma.team.findUnique({
                where: { id: updateMatchDto.awayTeamId },
            });
            if (!awayTeam)
                throw new common_1.NotFoundException('Away team not found');
        }
        return this.prisma.match.update({
            where: { id },
            data: {
                ...updateMatchDto,
                ...(updateMatchDto.startTime && { startTime: new Date(updateMatchDto.startTime) }),
            },
            include: {
                league: { include: { sport: true } },
                homeTeam: true,
                awayTeam: true,
            },
        });
    }
    async updateScore(id, updateScoreDto) {
        await this.findOne(id);
        return this.prisma.match.update({
            where: { id },
            data: {
                homeScore: updateScoreDto.homeScore,
                awayScore: updateScoreDto.awayScore,
                liveMinute: updateScoreDto.liveMinute,
                period: updateScoreDto.period,
                status: updateScoreDto.status,
            },
            include: {
                league: { include: { sport: true } },
                homeTeam: true,
                awayTeam: true,
            },
        });
    }
    async startMatch(id) {
        await this.findOne(id);
        return this.prisma.match.update({
            where: { id },
            data: {
                status: client_1.MatchStatus.live,
                isLive: true,
                homeScore: 0,
                awayScore: 0,
                liveMinute: 0,
            },
            include: {
                league: { include: { sport: true } },
                homeTeam: true,
                awayTeam: true,
            },
        });
    }
    async endMatch(id) {
        await this.findOne(id);
        return this.prisma.match.update({
            where: { id },
            data: {
                status: client_1.MatchStatus.finished,
                isLive: false,
                bettingEnabled: false,
            },
            include: {
                league: { include: { sport: true } },
                homeTeam: true,
                awayTeam: true,
            },
        });
    }
    async cancelMatch(id) {
        await this.findOne(id);
        return this.prisma.match.update({
            where: { id },
            data: {
                status: client_1.MatchStatus.cancelled,
                isLive: false,
                bettingEnabled: false,
            },
            include: {
                league: { include: { sport: true } },
                homeTeam: true,
                awayTeam: true,
            },
        });
    }
    async postponeMatch(id) {
        await this.findOne(id);
        return this.prisma.match.update({
            where: { id },
            data: {
                status: client_1.MatchStatus.postponed,
                isLive: false,
                bettingEnabled: false,
            },
            include: {
                league: { include: { sport: true } },
                homeTeam: true,
                awayTeam: true,
            },
        });
    }
    async toggleBetting(id) {
        const match = await this.findOne(id);
        return this.prisma.match.update({
            where: { id },
            data: { bettingEnabled: !match.bettingEnabled },
            include: {
                league: { include: { sport: true } },
                homeTeam: true,
                awayTeam: true,
            },
        });
    }
    async toggleFeatured(id) {
        const match = await this.findOne(id);
        return this.prisma.match.update({
            where: { id },
            data: { isFeatured: !match.isFeatured },
            include: {
                league: { include: { sport: true } },
                homeTeam: true,
                awayTeam: true,
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        const hasBets = await this.prisma.betSelection.count({ where: { matchId: id } });
        if (hasBets > 0) {
            throw new common_1.BadRequestException('Cannot delete match with existing bets');
        }
        await this.prisma.odds.deleteMany({ where: { matchId: id } });
        await this.prisma.match.delete({ where: { id } });
        return { message: 'Match deleted successfully' };
    }
    async getMatchStats(id) {
        const match = await this.findOne(id);
        const [totalBets, totalStake] = await Promise.all([
            this.prisma.betSelection.count({ where: { matchId: id } }),
            this.prisma.betSelection.findMany({
                where: { matchId: id },
                include: { bet: true },
            }),
        ]);
        const stake = totalStake.reduce((sum, sel) => sum + Number(sel.bet.stake), 0);
        return {
            matchId: id,
            totalBets,
            totalStake: stake,
            homeTeam: match.homeTeam.name,
            awayTeam: match.awayTeam.name,
            status: match.status,
        };
    }
};
exports.MatchesService = MatchesService;
exports.MatchesService = MatchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MatchesService);
//# sourceMappingURL=matches.service.js.map