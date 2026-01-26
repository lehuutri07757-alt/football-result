import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSportDto, UpdateSportDto, QuerySportDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SportsService {
  constructor(private prisma: PrismaService) {}

  async create(createSportDto: CreateSportDto) {
    const existing = await this.prisma.sport.findUnique({
      where: { slug: createSportDto.slug },
    });

    if (existing) {
      throw new ConflictException('Sport with this slug already exists');
    }

    return this.prisma.sport.create({
      data: createSportDto,
    });
  }

  async findAll(query: QuerySportDto) {
    const { page = 1, limit = 10, search, isActive, sortBy = 'sortOrder', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SportWhereInput = {
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

  async findOne(id: string) {
    const sport = await this.prisma.sport.findUnique({
      where: { id },
      include: {
        _count: {
          select: { leagues: true, teams: true },
        },
      },
    });

    if (!sport) {
      throw new NotFoundException('Sport not found');
    }

    return sport;
  }

  async findBySlug(slug: string) {
    const sport = await this.prisma.sport.findUnique({
      where: { slug },
    });

    if (!sport) {
      throw new NotFoundException('Sport not found');
    }

    return sport;
  }

  async update(id: string, updateSportDto: UpdateSportDto) {
    await this.findOne(id);

    if (updateSportDto.slug) {
      const existing = await this.prisma.sport.findFirst({
        where: { slug: updateSportDto.slug, id: { not: id } },
      });

      if (existing) {
        throw new ConflictException('Sport with this slug already exists');
      }
    }

    return this.prisma.sport.update({
      where: { id },
      data: updateSportDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const hasLeagues = await this.prisma.league.count({ where: { sportId: id } });
    if (hasLeagues > 0) {
      throw new ConflictException('Cannot delete sport with existing leagues');
    }

    await this.prisma.sport.delete({ where: { id } });
    return { message: 'Sport deleted successfully' };
  }

  async toggleActive(id: string) {
    const sport = await this.findOne(id);
    return this.prisma.sport.update({
      where: { id },
      data: { isActive: !sport.isActive },
    });
  }
}
