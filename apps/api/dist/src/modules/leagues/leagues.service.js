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
exports.LeaguesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let LeaguesService = class LeaguesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createLeagueDto) {
        const sport = await this.prisma.sport.findUnique({
            where: { id: createLeagueDto.sportId },
        });
        if (!sport) {
            throw new common_1.NotFoundException('Sport not found');
        }
        return this.prisma.league.create({
            data: createLeagueDto,
            include: { sport: true },
        });
    }
    async findAll(query) {
        const { page = 1, limit = 10, search, sportId, country, isActive, isFeatured, sortBy = 'sortOrder', sortOrder = 'asc' } = query;
        const skip = (page - 1) * limit;
        const normalizedSearch = search?.trim().replace(/\s+/g, ' ');
        const where = {
            ...(sportId && { sportId }),
            ...(country && { country: { contains: country, mode: 'insensitive' } }),
            ...(isActive !== undefined && { isActive }),
            ...(isFeatured !== undefined && { isFeatured }),
            ...(normalizedSearch && {
                OR: [
                    { name: { contains: normalizedSearch, mode: 'insensitive' } },
                    { slug: { contains: normalizedSearch, mode: 'insensitive' } },
                    { country: { contains: normalizedSearch, mode: 'insensitive' } },
                ],
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.league.findMany({
                skip,
                take: limit,
                where,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    sport: true,
                    _count: {
                        select: { matches: true },
                    },
                },
            }),
            this.prisma.league.count({ where }),
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
    async findBySport(sportId) {
        return this.prisma.league.findMany({
            where: { sportId, isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: { sport: true },
        });
    }
    async findFeatured() {
        return this.prisma.league.findMany({
            where: { isFeatured: true, isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: { sport: true },
        });
    }
    async findOne(id) {
        const league = await this.prisma.league.findUnique({
            where: { id },
            include: {
                sport: true,
                _count: {
                    select: { matches: true },
                },
            },
        });
        if (!league) {
            throw new common_1.NotFoundException('League not found');
        }
        return league;
    }
    async update(id, updateLeagueDto) {
        await this.findOne(id);
        if (updateLeagueDto.sportId) {
            const sport = await this.prisma.sport.findUnique({
                where: { id: updateLeagueDto.sportId },
            });
            if (!sport) {
                throw new common_1.NotFoundException('Sport not found');
            }
        }
        return this.prisma.league.update({
            where: { id },
            data: updateLeagueDto,
            include: { sport: true },
        });
    }
    async remove(id) {
        await this.findOne(id);
        const hasMatches = await this.prisma.match.count({ where: { leagueId: id } });
        if (hasMatches > 0) {
            throw new common_1.ConflictException('Cannot delete league with existing matches');
        }
        await this.prisma.league.delete({ where: { id } });
        return { message: 'League deleted successfully' };
    }
    async toggleActive(id) {
        const league = await this.findOne(id);
        return this.prisma.league.update({
            where: { id },
            data: { isActive: !league.isActive },
            include: { sport: true },
        });
    }
    async toggleFeatured(id) {
        const league = await this.findOne(id);
        return this.prisma.league.update({
            where: { id },
            data: { isFeatured: !league.isFeatured },
            include: { sport: true },
        });
    }
    async inactiveAll() {
        const result = await this.prisma.league.updateMany({
            data: { isActive: false },
        });
        return {
            message: 'All leagues set to inactive successfully',
            count: result.count,
        };
    }
    async reorder(reorderDto) {
        const updates = reorderDto.items.map((item) => this.prisma.league.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
        }));
        await this.prisma.$transaction(updates);
        return { message: 'Leagues reordered successfully' };
    }
};
exports.LeaguesService = LeaguesService;
exports.LeaguesService = LeaguesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeaguesService);
//# sourceMappingURL=leagues.service.js.map