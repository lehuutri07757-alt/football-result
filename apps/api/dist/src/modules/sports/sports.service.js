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
exports.SportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SportsService = class SportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createSportDto) {
        const existing = await this.prisma.sport.findUnique({
            where: { slug: createSportDto.slug },
        });
        if (existing) {
            throw new common_1.ConflictException('Sport with this slug already exists');
        }
        return this.prisma.sport.create({
            data: createSportDto,
        });
    }
    async findAll(query) {
        const { page = 1, limit = 10, search, isActive, sortBy = 'sortOrder', sortOrder = 'asc' } = query;
        const skip = (page - 1) * limit;
        const where = {
            ...(isActive !== undefined && { isActive }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { slug: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.sport.findMany({
                skip,
                take: limit,
                where,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    _count: {
                        select: { leagues: true, teams: true },
                    },
                },
            }),
            this.prisma.sport.count({ where }),
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
    async findAllActive() {
        return this.prisma.sport.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }
    async findOne(id) {
        const sport = await this.prisma.sport.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { leagues: true, teams: true },
                },
            },
        });
        if (!sport) {
            throw new common_1.NotFoundException('Sport not found');
        }
        return sport;
    }
    async findBySlug(slug) {
        const sport = await this.prisma.sport.findUnique({
            where: { slug },
        });
        if (!sport) {
            throw new common_1.NotFoundException('Sport not found');
        }
        return sport;
    }
    async update(id, updateSportDto) {
        await this.findOne(id);
        if (updateSportDto.slug) {
            const existing = await this.prisma.sport.findFirst({
                where: { slug: updateSportDto.slug, id: { not: id } },
            });
            if (existing) {
                throw new common_1.ConflictException('Sport with this slug already exists');
            }
        }
        return this.prisma.sport.update({
            where: { id },
            data: updateSportDto,
        });
    }
    async remove(id) {
        await this.findOne(id);
        const hasLeagues = await this.prisma.league.count({ where: { sportId: id } });
        if (hasLeagues > 0) {
            throw new common_1.ConflictException('Cannot delete sport with existing leagues');
        }
        await this.prisma.sport.delete({ where: { id } });
        return { message: 'Sport deleted successfully' };
    }
    async toggleActive(id) {
        const sport = await this.findOne(id);
        return this.prisma.sport.update({
            where: { id },
            data: { isActive: !sport.isActive },
        });
    }
};
exports.SportsService = SportsService;
exports.SportsService = SportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SportsService);
//# sourceMappingURL=sports.service.js.map