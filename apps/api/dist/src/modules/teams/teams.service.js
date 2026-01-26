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
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let TeamsService = class TeamsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createTeamDto) {
        const sport = await this.prisma.sport.findUnique({
            where: { id: createTeamDto.sportId },
        });
        if (!sport) {
            throw new common_1.NotFoundException('Sport not found');
        }
        return this.prisma.team.create({
            data: createTeamDto,
            include: { sport: true },
        });
    }
    async findAll(query) {
        const { page = 1, limit = 10, search, sportId, country, isActive, sortBy = 'name', sortOrder = 'asc' } = query;
        const skip = (page - 1) * limit;
        const where = {
            ...(sportId && { sportId }),
            ...(country && { country: { contains: country, mode: 'insensitive' } }),
            ...(isActive !== undefined && { isActive }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { shortName: { contains: search, mode: 'insensitive' } },
                    { slug: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.team.findMany({
                skip,
                take: limit,
                where,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    sport: true,
                    _count: {
                        select: { homeMatches: true, awayMatches: true },
                    },
                },
            }),
            this.prisma.team.count({ where }),
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
        return this.prisma.team.findMany({
            where: { sportId, isActive: true },
            orderBy: { name: 'asc' },
            include: { sport: true },
        });
    }
    async findOne(id) {
        const team = await this.prisma.team.findUnique({
            where: { id },
            include: {
                sport: true,
                _count: {
                    select: { homeMatches: true, awayMatches: true },
                },
            },
        });
        if (!team) {
            throw new common_1.NotFoundException('Team not found');
        }
        return team;
    }
    async update(id, updateTeamDto) {
        await this.findOne(id);
        if (updateTeamDto.sportId) {
            const sport = await this.prisma.sport.findUnique({
                where: { id: updateTeamDto.sportId },
            });
            if (!sport) {
                throw new common_1.NotFoundException('Sport not found');
            }
        }
        return this.prisma.team.update({
            where: { id },
            data: updateTeamDto,
            include: { sport: true },
        });
    }
    async remove(id) {
        await this.findOne(id);
        const hasMatches = await this.prisma.match.count({
            where: {
                OR: [{ homeTeamId: id }, { awayTeamId: id }],
            },
        });
        if (hasMatches > 0) {
            throw new common_1.ConflictException('Cannot delete team with existing matches');
        }
        await this.prisma.team.delete({ where: { id } });
        return { message: 'Team deleted successfully' };
    }
    async toggleActive(id) {
        const team = await this.findOne(id);
        return this.prisma.team.update({
            where: { id },
            data: { isActive: !team.isActive },
            include: { sport: true },
        });
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeamsService);
//# sourceMappingURL=teams.service.js.map