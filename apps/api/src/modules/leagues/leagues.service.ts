import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeagueDto, UpdateLeagueDto, QueryLeagueDto, ReorderLeaguesDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeaguesService {
  constructor(private prisma: PrismaService) {}

  async create(createLeagueDto: CreateLeagueDto) {
    const sport = await this.prisma.sport.findUnique({
      where: { id: createLeagueDto.sportId },
    });

    if (!sport) {
      throw new NotFoundException('Sport not found');
    }

    return this.prisma.league.create({
      data: createLeagueDto,
      include: { sport: true },
    });
  }

  async findAll(query: QueryLeagueDto) {
    const { page = 1, limit = 10, search, sportId, country, isActive, isFeatured, sortBy = 'sortOrder', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const normalizedSearch = search?.trim().replace(/\s+/g, ' ');

    const where: Prisma.LeagueWhereInput = {
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

  async findBySport(sportId: string) {
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

  async findOne(id: string) {
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
      throw new NotFoundException('League not found');
    }

    return league;
  }

  async update(id: string, updateLeagueDto: UpdateLeagueDto) {
    await this.findOne(id);

    if (updateLeagueDto.sportId) {
      const sport = await this.prisma.sport.findUnique({
        where: { id: updateLeagueDto.sportId },
      });

      if (!sport) {
        throw new NotFoundException('Sport not found');
      }
    }

    return this.prisma.league.update({
      where: { id },
      data: updateLeagueDto,
      include: { sport: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const hasMatches = await this.prisma.match.count({ where: { leagueId: id } });
    if (hasMatches > 0) {
      throw new ConflictException('Cannot delete league with existing matches');
    }

    await this.prisma.league.delete({ where: { id } });
    return { message: 'League deleted successfully' };
  }

  async toggleActive(id: string) {
    const league = await this.findOne(id);
    return this.prisma.league.update({
      where: { id },
      data: { isActive: !league.isActive },
      include: { sport: true },
    });
  }

  async toggleFeatured(id: string) {
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

  async reorder(reorderDto: ReorderLeaguesDto) {
    const updates = reorderDto.items.map((item) =>
      this.prisma.league.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      }),
    );

    await this.prisma.$transaction(updates);

    return { message: 'Leagues reordered successfully' };
  }
}
