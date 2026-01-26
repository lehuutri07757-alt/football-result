import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeamDto, UpdateTeamDto, QueryTeamDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async create(createTeamDto: CreateTeamDto) {
    const sport = await this.prisma.sport.findUnique({
      where: { id: createTeamDto.sportId },
    });

    if (!sport) {
      throw new NotFoundException('Sport not found');
    }

    return this.prisma.team.create({
      data: createTeamDto,
      include: { sport: true },
    });
  }

  async findAll(query: QueryTeamDto) {
    const { page = 1, limit = 10, search, sportId, country, isActive, sortBy = 'name', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TeamWhereInput = {
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

  async findBySport(sportId: string) {
    return this.prisma.team.findMany({
      where: { sportId, isActive: true },
      orderBy: { name: 'asc' },
      include: { sport: true },
    });
  }

  async findOne(id: string) {
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
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  async update(id: string, updateTeamDto: UpdateTeamDto) {
    await this.findOne(id);

    if (updateTeamDto.sportId) {
      const sport = await this.prisma.sport.findUnique({
        where: { id: updateTeamDto.sportId },
      });

      if (!sport) {
        throw new NotFoundException('Sport not found');
      }
    }

    return this.prisma.team.update({
      where: { id },
      data: updateTeamDto,
      include: { sport: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const hasMatches = await this.prisma.match.count({
      where: {
        OR: [{ homeTeamId: id }, { awayTeamId: id }],
      },
    });

    if (hasMatches > 0) {
      throw new ConflictException('Cannot delete team with existing matches');
    }

    await this.prisma.team.delete({ where: { id } });
    return { message: 'Team deleted successfully' };
  }

  async toggleActive(id: string) {
    const team = await this.findOne(id);
    return this.prisma.team.update({
      where: { id },
      data: { isActive: !team.isActive },
      include: { sport: true },
    });
  }
}
