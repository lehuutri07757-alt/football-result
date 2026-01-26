import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { OddsStatus, Prisma, MatchStatus } from '@prisma/client';
import { QueryHomeFeedDto } from './dto';
import { HOME_FEED_DEFAULT_LIMIT, HOME_FEED_TTL_SECONDS } from './constants/home.constants';
import { HomeFeedEntity, HomeLeagueEntity, HomeMatchEntity, OddsSnapshotEntity } from './entities/home-feed.entity';

type CachedHomeFeed = HomeFeedEntity;

@Injectable()
export class HomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getFeed(query: QueryHomeFeedDto): Promise<HomeFeedEntity> {
    const limit = query.limit ?? HOME_FEED_DEFAULT_LIMIT;
    const cacheKey = this.buildCacheKey({ sportId: query.sportId, limit });

    const cached = await this.redisService.getJson<CachedHomeFeed>(cacheKey);
    if (cached) return cached;

    const whereLive: Prisma.MatchWhereInput = {
      status: MatchStatus.live,
      isLive: true,
      ...(query.sportId ? { league: { sportId: query.sportId } } : {}),
    };

    const topLiveMatchesRaw = await this.prisma.match.findMany({
      where: whereLive,
      take: limit,
      orderBy: [{ isFeatured: 'desc' }, { startTime: 'asc' }],
      include: {
        league: { select: { id: true, name: true } },
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    const matchIds = topLiveMatchesRaw.map((m) => m.id);

    const leaguesAgg = await this.prisma.match.groupBy({
      by: ['leagueId'],
      where: whereLive,
      _count: { leagueId: true },
      orderBy: { _count: { leagueId: 'desc' } },
      take: Math.min(30, limit),
    });

    const leagueIds = leaguesAgg.map((x) => x.leagueId);

    const leagues = leagueIds.length
      ? await this.prisma.league.findMany({
          where: { id: { in: leagueIds }, ...(query.sportId ? { sportId: query.sportId } : {}) },
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
            countryCode: true,
            logoUrl: true,
          },
        })
      : [];

    const leagueById = new Map(leagues.map((l) => [l.id, l]));

    const hotLeagues: HomeLeagueEntity[] = leaguesAgg.flatMap((x) => {
      const league = leagueById.get(x.leagueId);
      if (!league) return [];
      return [
        {
          id: league.id,
          name: league.name,
          slug: league.slug,
          country: league.country,
          countryCode: league.countryCode,
          logoUrl: league.logoUrl,
          liveMatchCount: x._count.leagueId,
        },
      ];
    });

    const topLiveMatches: HomeMatchEntity[] = topLiveMatchesRaw.map((m) => ({
      id: m.id,
      leagueId: m.league.id,
      leagueName: m.league.name,
      startTime: m.startTime.toISOString(),
      status: m.status,
      isLive: m.isLive,
      liveMinute: m.liveMinute,
      period: m.period ?? null,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      homeTeam: {
        id: m.homeTeam.id,
        name: m.homeTeam.name,
        logoUrl: m.homeTeam.logoUrl,
      },
      awayTeam: {
        id: m.awayTeam.id,
        name: m.awayTeam.name,
        logoUrl: m.awayTeam.logoUrl,
      },
    }));

    const oddsSnapshotByMatchId: Record<string, OddsSnapshotEntity[]> = {};
    if (matchIds.length > 0) {
      const odds = await this.prisma.odds.findMany({
        where: {
          matchId: { in: matchIds },
          status: OddsStatus.active,
        },
        orderBy: [{ matchId: 'asc' }, { betTypeId: 'asc' }, { selection: 'asc' }],
        include: {
          betType: { select: { id: true, code: true } },
        },
      });

      for (const row of odds) {
        if (!oddsSnapshotByMatchId[row.matchId]) oddsSnapshotByMatchId[row.matchId] = [];
        if (oddsSnapshotByMatchId[row.matchId].length >= 30) continue;

        oddsSnapshotByMatchId[row.matchId].push({
          betTypeId: row.betType.id,
          betTypeCode: row.betType.code,
          selection: row.selection,
          handicap: row.handicap ? row.handicap.toString() : null,
          oddsValue: row.oddsValue.toString(),
        });
      }
    }

    const result: HomeFeedEntity = {
      hotLeagues,
      topLiveMatches,
      oddsSnapshotByMatchId,
      lastUpdate: new Date().toISOString(),
    };

    await this.redisService.setJson(cacheKey, result, HOME_FEED_TTL_SECONDS);
    return result;
  }

  private buildCacheKey(params: { sportId?: string; limit: number }): string {
    return `home:feed:sport:${params.sportId || 'all'}:limit:${params.limit}`;
  }
}
