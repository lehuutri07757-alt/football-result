import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MatchStatus, Prisma } from '@prisma/client';

export interface FeaturedMatchesSettings {
  featuredLeagueIds: string[];
  topTeamRankThreshold: number;
  topTeamIds: string[];
  derbyPairs: { homeTeamId: string; awayTeamId: string; name?: string }[];
  maxFeaturedMatches: number;
  autoSelectEnabled: boolean;
  includeUpcoming: boolean;
  includeLive: boolean;
  upcomingHours: number;
}

export interface FeaturedMatchesStats {
  totalFeatured: number;
  byLeague: { leagueId: string; leagueName: string; count: number }[];
  byStatus: { status: string; count: number }[];
  liveCount: number;
  upcomingCount: number;
}

@Injectable()
export class FeaturedMatchesService {
  private readonly SETTINGS_KEY = 'featured_matches_settings';

  constructor(private prisma: PrismaService) {}

  async getSettings(): Promise<FeaturedMatchesSettings> {
    const setting = await this.prisma.setting.findUnique({
      where: { key: this.SETTINGS_KEY },
    });

    if (!setting) {
      return this.getDefaultSettings();
    }

    return setting.value as unknown as FeaturedMatchesSettings;
  }

  async updateSettings(settings: Partial<FeaturedMatchesSettings>): Promise<FeaturedMatchesSettings> {
    const currentSettings = await this.getSettings();
    const mergedSettings = { ...currentSettings, ...settings };

    await this.prisma.setting.upsert({
      where: { key: this.SETTINGS_KEY },
      create: {
        key: this.SETTINGS_KEY,
        value: mergedSettings as object,
        description: 'Featured Matches Settings',
        category: 'matches',
        isPublic: false,
      },
      update: {
        value: mergedSettings as object,
      },
    });

    return mergedSettings;
  }

  private getDefaultSettings(): FeaturedMatchesSettings {
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

    const conditions: Prisma.MatchWhereInput[] = [];

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

    const statusFilters: Prisma.MatchWhereInput[] = [];
    if (settings.includeLive) {
      statusFilters.push({ status: MatchStatus.live });
    }
    if (settings.includeUpcoming) {
      statusFilters.push({
        status: MatchStatus.scheduled,
        startTime: { gte: now, lte: upcomingLimit },
      });
    }

    let matches = await this.prisma.match.findMany({
      where: {
        league: { isActive: true },
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

    // Fallback: If no featured matches, try to get live matches
    if (matches.length === 0) {
      matches = await this.prisma.match.findMany({
        where: {
          status: MatchStatus.live,
          league: { isActive: true },
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

    // Fallback: If still no matches, get upcoming matches (nearest first)
    if (matches.length === 0) {
      matches = await this.prisma.match.findMany({
        where: {
          status: MatchStatus.scheduled,
          startTime: { gte: now },
          league: { isActive: true },
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

  async getStats(): Promise<FeaturedMatchesStats> {
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
              { status: MatchStatus.live },
              {
                status: MatchStatus.scheduled,
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

    const leagueMap = new Map<string, { leagueName: string; count: number }>();
    const statusMap = new Map<string, number>();
    let liveCount = 0;
    let upcomingCount = 0;

    for (const match of featuredMatches) {
      const leagueKey = match.leagueId;
      const leagueData = leagueMap.get(leagueKey) || { leagueName: match.league.name, count: 0 };
      leagueData.count++;
      leagueMap.set(leagueKey, leagueData);

      statusMap.set(match.status, (statusMap.get(match.status) || 0) + 1);

      if (match.status === MatchStatus.live) liveCount++;
      if (match.status === MatchStatus.scheduled) upcomingCount++;
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

  async autoSelectFeaturedMatches(): Promise<{ updated: number }> {
    const settings = await this.getSettings();
    
    if (!settings.autoSelectEnabled) {
      return { updated: 0 };
    }

    const now = new Date();
    const upcomingLimit = new Date(now.getTime() + settings.upcomingHours * 60 * 60 * 1000);

    await this.prisma.match.updateMany({
      where: {
        isFeatured: true,
        status: { in: [MatchStatus.scheduled, MatchStatus.live] },
      },
      data: { isFeatured: false },
    });

    const conditions: Prisma.MatchWhereInput[] = [];

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
              { status: MatchStatus.live },
              {
                status: MatchStatus.scheduled,
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

  async toggleMatchFeatured(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
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

  async batchUpdateFeatured(matchIds: string[], featured: boolean) {
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

  async getAvailableTeams(leagueId?: string) {
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
}
