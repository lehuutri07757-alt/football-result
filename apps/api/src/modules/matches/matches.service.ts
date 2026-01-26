import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMatchDto, UpdateMatchDto, QueryMatchDto, UpdateScoreDto } from './dto';
import { OddsStatus, Prisma, MatchStatus } from '@prisma/client';

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  async create(createMatchDto: CreateMatchDto) {
    const [league, homeTeam, awayTeam] = await Promise.all([
      this.prisma.league.findUnique({ where: { id: createMatchDto.leagueId } }),
      this.prisma.team.findUnique({ where: { id: createMatchDto.homeTeamId } }),
      this.prisma.team.findUnique({ where: { id: createMatchDto.awayTeamId } }),
    ]);

    if (!league) throw new NotFoundException('League not found');
    if (!homeTeam) throw new NotFoundException('Home team not found');
    if (!awayTeam) throw new NotFoundException('Away team not found');

    if (createMatchDto.homeTeamId === createMatchDto.awayTeamId) {
      throw new BadRequestException('Home team and away team cannot be the same');
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

  async findAll(query: QueryMatchDto) {
    const {
      page = 1,
      limit = 10,
      search,
      leagueId,
      sportId,
      teamId,
      status,
      isLive,
      isFeatured,
      bettingEnabled,
      dateFrom,
      dateTo,
      sortBy = 'startTime',
      sortOrder = 'asc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.MatchWhereInput = {
      ...(leagueId && { leagueId }),
      ...(sportId && { league: { sportId } }),
      ...(teamId && {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      }),
      ...(status && { status }),
      ...(isLive !== undefined && { isLive }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(bettingEnabled !== undefined && { bettingEnabled }),
      ...(dateFrom && { startTime: { gte: new Date(dateFrom) } }),
      ...(dateTo && { startTime: { lte: new Date(dateTo) } }),
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
      where: { status: MatchStatus.live, isLive: true },
      orderBy: { startTime: 'asc' },
      include: {
        league: { include: { sport: true } },
        homeTeam: true,
        awayTeam: true,
      },
    });
  }

  async findUpcoming(limit = 10) {
    return this.prisma.match.findMany({
      where: {
        status: MatchStatus.scheduled,
        startTime: { gte: new Date() },
      },
      take: limit,
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
    return this.prisma.match.findMany({
      where: {
        isFeatured: true,
        status: { in: [MatchStatus.scheduled, MatchStatus.live] },
      },
      orderBy: { startTime: 'asc' },
      include: {
        league: { include: { sport: true } },
        homeTeam: true,
        awayTeam: true,
      },
    });
  }

  async findOne(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: {
        league: { include: { sport: true } },
        homeTeam: true,
        awayTeam: true,
        odds: {
          include: { betType: true },
          where: { status: OddsStatus.active },
        },
        _count: {
          select: { betSelections: true },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return match;
  }

  async update(id: string, updateMatchDto: UpdateMatchDto) {
    await this.findOne(id);

    if (updateMatchDto.leagueId) {
      const league = await this.prisma.league.findUnique({
        where: { id: updateMatchDto.leagueId },
      });
      if (!league) throw new NotFoundException('League not found');
    }

    if (updateMatchDto.homeTeamId) {
      const homeTeam = await this.prisma.team.findUnique({
        where: { id: updateMatchDto.homeTeamId },
      });
      if (!homeTeam) throw new NotFoundException('Home team not found');
    }

    if (updateMatchDto.awayTeamId) {
      const awayTeam = await this.prisma.team.findUnique({
        where: { id: updateMatchDto.awayTeamId },
      });
      if (!awayTeam) throw new NotFoundException('Away team not found');
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

  async updateScore(id: string, updateScoreDto: UpdateScoreDto) {
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

  async startMatch(id: string) {
    await this.findOne(id);

    return this.prisma.match.update({
      where: { id },
      data: {
        status: MatchStatus.live,
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

  async endMatch(id: string) {
    await this.findOne(id);

    return this.prisma.match.update({
      where: { id },
      data: {
        status: MatchStatus.finished,
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

  async cancelMatch(id: string) {
    await this.findOne(id);

    return this.prisma.match.update({
      where: { id },
      data: {
        status: MatchStatus.cancelled,
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

  async postponeMatch(id: string) {
    await this.findOne(id);

    return this.prisma.match.update({
      where: { id },
      data: {
        status: MatchStatus.postponed,
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

  async toggleBetting(id: string) {
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

  async toggleFeatured(id: string) {
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

  async remove(id: string) {
    await this.findOne(id);

    const hasBets = await this.prisma.betSelection.count({ where: { matchId: id } });
    if (hasBets > 0) {
      throw new BadRequestException('Cannot delete match with existing bets');
    }

    await this.prisma.odds.deleteMany({ where: { matchId: id } });
    await this.prisma.match.delete({ where: { id } });

    return { message: 'Match deleted successfully' };
  }

  async getMatchStats(id: string) {
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
}
