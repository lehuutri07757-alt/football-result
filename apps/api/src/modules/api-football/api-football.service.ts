import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";
import { MatchStatus, Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import {
  ApiFootballResponse,
  ApiFixture,
  ApiOddsResponse,
  ApiLiveOddsResponse,
  OddsMarket,
  OddsValue,
  LIVE_STATUSES,
  FixtureStatusShort,
  ApiAccountStatus,
  CountryLeagueStats,
  TopLeaguesResponse,
  ApiLeagueInfo,
  ApiTeamInfo,
  ApiStandingsResponse,
  ApiTeamStatistics,
} from "./interfaces";
import { parseApiFootballErrors } from "./interceptors/api-football-response.interceptor";
import {
  OddsTableRow,
  LeagueOddsGroup,
  OddsTableResponse,
  MatchOdds,
  OddsCell,
} from "./interfaces/odds-table.interface";
import { QueryOddsDto, QueryApiLogsDto, ApiRequestStatusFilter } from "./dto";
import {
  API_FOOTBALL_BET_IDS,
  CACHE_TTL_SECONDS,
  DEFAULT_BOOKMAKER_ID,
} from "./constants/api-football.constants";
import { SyncConfigService } from "./sync-config.service";

const PROVIDER_CODE = "api_football";
const PROVIDER_STATUS_ACTIVE = "active";

interface ProviderConfig {
  id: string;
  baseUrl: string;
  apiKey: string;
  headers: Record<string, string>;
}

interface RateLimitConfig {
  /** Maximum requests per minute allowed (provider subscription) */
  requestsPerMinute: number;
  /** Additional delay between requests in ms */
  delayBetweenRequestsMs: number;
  /** Max retries when hitting provider rate limit or transient errors */
  maxRetries: number;
  /** Base backoff for rate limit retries */
  baseBackoffMs: number;
}

interface ApiLogData {
  endpoint: string;
  method: string;
  params: Record<string, string>;
  responseBody?: unknown;
  statusCode?: number;
  responseTime: number;
  responseSize?: number;
  resultCount?: number;
  errorMessage?: string;
  errorCode?: string;
  fixtureIds?: string[];
  leagueIds?: number[];
  apiErrors?: Record<string, string>;
}

@Injectable()
export class ApiFootballService implements OnModuleInit {
  private readonly logger = new Logger(ApiFootballService.name);
  private providerConfig: ProviderConfig | null = null;
  private readonly apiCachePrefix = "api_football:api_cache";
  private readonly inFlightRequests = new Map<
    string,
    Promise<ApiFootballResponse<unknown>>
  >();

  /**
   * Global rate limiter for outbound API-Football calls.
   * API-Football can return HTTP 200 with errors in body (incl. rate limit).
   */
  private rateLimitChain: Promise<void> = Promise.resolve();
  private lastRequestAtMs = 0;
  private cooldownUntilMs = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
    private readonly syncConfig: SyncConfigService,
  ) {}

  async onModuleInit() {
    await this.loadProviderConfig();
  }

  private async loadProviderConfig(): Promise<void> {
    try {
      const provider = await this.prisma.dataProvider.findUnique({
        where: { code: PROVIDER_CODE },
      });

      if (!provider) {
        this.logger.warn(`Provider '${PROVIDER_CODE}' not found in database`);
        return;
      }

      if (provider.status !== PROVIDER_STATUS_ACTIVE) {
        this.logger.warn(
          `Provider '${PROVIDER_CODE}' is not active (status: ${provider.status})`,
        );
        return;
      }

      const apiKey =
        this.configService.get<string>("API_FOOTBALL_KEY") ||
        provider.apiKey ||
        "";

      this.providerConfig = {
        id: provider.id,
        baseUrl: provider.baseUrl,
        apiKey,
        headers: (provider.headers as Record<string, string>) || {},
      };

      this.logger.log(`Provider '${PROVIDER_CODE}' loaded successfully`);
    } catch (error) {
      this.logger.error(`Failed to load provider config: ${error}`);
    }
  }

  async refreshConfig(): Promise<void> {
    await this.loadProviderConfig();
  }

  /**
   * Public wrapper for raw API-Football requests.
   * Prefer using this instead of accessing private methods.
   */
  async request<T>(
    endpoint: string,
    params: Record<string, string>,
  ): Promise<ApiFootballResponse<T>> {
    return this.makeApiRequest<T>(endpoint, params);
  }

  isConfigured(): boolean {
    return this.providerConfig !== null && !!this.providerConfig.apiKey;
  }

  /**
   * Fetch ALL live odds in a single API call (no fixture param).
   * Returns a Map of fixtureId → odds markets.
   * This replaces N individual calls with 1 call.
   */
  async fetchAllLiveOddsBatch(): Promise<Map<number, OddsMarket[]>> {
    const oddsMap = new Map<number, OddsMarket[]>();

    try {
      const response = await this.makeApiRequest<ApiLiveOddsResponse>(
        "/odds/live",
        {},
      );

      for (const item of response.response) {
        if (item.fixture?.id && item.odds) {
          oddsMap.set(item.fixture.id, item.odds);
        }
      }

      this.logger.log(
        `Batch live odds: fetched ${oddsMap.size} fixtures in 1 API call`,
      );
    } catch (error) {
      this.logger.error(`Batch live odds fetch failed: ${error}`);
    }

    return oddsMap;
  }

  /**
   * Fetch pre-match odds for ALL fixtures on a given date in batch.
   * Uses /odds?date={date}&bookmaker={id} with auto-pagination.
   * Returns a Map of fixtureId → bookmaker bets.
   */
  async fetchOddsByDateBatch(
    date: string,
    bookmakerId: number = DEFAULT_BOOKMAKER_ID,
  ): Promise<Map<number, OddsMarket[]>> {
    const oddsMap = new Map<number, OddsMarket[]>();

    try {
      let currentPage = 1;
      let totalPages = 1;

      while (currentPage <= totalPages) {
        const response = await this.makeApiRequest<ApiOddsResponse>("/odds", {
          date,
          bookmaker: bookmakerId.toString(),
          page: currentPage.toString(),
        });

        totalPages = response.paging?.total ?? 1;

        for (const item of response.response) {
          if (!item.fixture?.id || !item.bookmakers?.length) continue;

          const targetBookmaker =
            item.bookmakers.find((b) => b.id === bookmakerId) ||
            item.bookmakers[0];
          if (targetBookmaker) {
            oddsMap.set(item.fixture.id, targetBookmaker.bets);
          }
        }

        currentPage++;
      }

      this.logger.log(
        `Batch pre-match odds: fetched ${oddsMap.size} fixtures for date ${date} in ${totalPages} API call(s)`,
      );
    } catch (error) {
      this.logger.error(`Batch odds fetch for date ${date} failed: ${error}`);
    }

    return oddsMap;
  }

  async getOddsTable(query: QueryOddsDto): Promise<OddsTableResponse> {
    const fixtures = await this.fetchFixtures(query);
    const fixtureIds = fixtures.map((f) => f.fixture.id);

    if (fixtureIds.length === 0) {
      return {
        leagues: [],
        totalMatches: 0,
        page: 1,
        limit: 20,
        hasMore: false,
        lastUpdate: new Date().toISOString(),
      };
    }

    const oddsMap = await this.fetchOddsForFixtures(fixtureIds, query.live);
    const rows = this.transformToOddsTableRows(fixtures, oddsMap);
    const leagues = this.groupByLeague(rows);

    return {
      leagues,
      totalMatches: rows.length,
      page: 1,
      limit: rows.length,
      hasMore: false,
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Get odds table from database (synced data) instead of external API
   * This is more efficient and doesn't consume API quota
   */
  async getOddsTableFromDb(query: QueryOddsDto): Promise<OddsTableResponse> {
    const { live, date, leagueIds, page = 1, limit = 20 } = query;

    // Default behavior (no date, not live): return upcoming matches only.
    // Upcoming here means: live matches + matches that haven't started yet,
    // excluding finished/cancelled.
    const shouldDefaultToUpcoming = !live && !date;
    const now = new Date();

    let dateStart: Date | undefined;
    let dateEnd: Date | undefined;

    if (live) {
      dateStart = new Date();
      dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date();
      dateEnd.setHours(23, 59, 59, 999);
    } else if (date) {
      dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);
    }

    const leagueFilter: Prisma.LeagueWhereInput = {
      isActive: true,
      ...(leagueIds?.length && { externalId: { in: leagueIds.map(String) } }),
    };

    const whereClause: Prisma.MatchWhereInput = {
      league: leagueFilter,
      ...(dateStart &&
        dateEnd && {
          startTime: { gte: dateStart, lte: dateEnd },
        }),
      ...(live && { isLive: true }),
      ...(shouldDefaultToUpcoming && {
        AND: [
          {
            status: {
              notIn: [MatchStatus.finished, MatchStatus.cancelled],
            },
          },
          {
            OR: [{ isLive: true }, { startTime: { gte: now } }],
          },
        ],
      }),
    };

    const skip = (page - 1) * limit;

    const [matches, totalMatches] = await Promise.all([
      this.prisma.match.findMany({
        where: whereClause,
        include: {
          league: true,
          homeTeam: true,
          awayTeam: true,
          odds: {
            where: { status: "active" },
            include: { betType: true },
          },
        },
        orderBy: [{ startTime: "asc" }],
        skip,
        take: limit,
      }),
      this.prisma.match.count({ where: whereClause }),
    ]);

    const rows: OddsTableRow[] = matches.map((match) =>
      this.transformDbMatchToOddsTableRow(match),
    );

    const leagues = this.groupByLeagueFromDb(rows, matches);
    const hasMore = skip + matches.length < totalMatches;

    return {
      leagues,
      totalMatches,
      page,
      limit,
      hasMore,
      lastUpdate: new Date().toISOString(),
    };
  }

  private extractOddsFromDb(
    odds:
      | Array<{
          id: string;
          selection: string;
          selectionName: string | null;
          oddsValue: { toNumber(): number };
          handicap: { toNumber(): number } | null;
          status: string;
        }>
      | undefined,
    type: "hdp" | "ou" | "1x2" | "btts",
  ): MatchOdds | undefined {
    if (!odds || odds.length === 0) return undefined;

    const createCell = (odd: (typeof odds)[0], label: string): OddsCell => ({
      oddsId: odd.id,
      label,
      odds: odd.oddsValue.toNumber(),
      handicap: odd.handicap ? odd.handicap.toNumber().toString() : undefined,
      suspended: odd.status !== "active",
    });

    if (type === "hdp") {
      const home = odds.find((o) => o.selection === "Home");
      const away = odds.find((o) => o.selection === "Away");
      if (!home || !away) return undefined;
      return {
        home: createCell(
          home,
          home.handicap ? home.handicap.toNumber().toString() : "",
        ),
        away: createCell(
          away,
          away.handicap ? away.handicap.toNumber().toString() : "",
        ),
      };
    }

    if (type === "ou") {
      const over = odds.find(
        (o) => o.selection === "Over" || o.selection.includes("Over"),
      );
      const under = odds.find(
        (o) => o.selection === "Under" || o.selection.includes("Under"),
      );
      if (!over || !under) return undefined;
      const handicap = over.handicap
        ? over.handicap.toNumber().toString()
        : "2.5";
      return {
        home: createCell(over, `O ${handicap}`),
        away: createCell(under, `U ${handicap}`),
      };
    }

    if (type === "1x2") {
      const home = odds.find((o) => o.selection === "Home");
      const draw = odds.find((o) => o.selection === "Draw");
      const away = odds.find((o) => o.selection === "Away");
      if (!home || !away) return undefined;
      return {
        home: createCell(home, "H"),
        away: createCell(away, "A"),
        draw: draw ? createCell(draw, "D") : undefined,
      };
    }

    if (type === "btts") {
      const yes = odds.find((o) => o.selection === "Yes");
      const no = odds.find((o) => o.selection === "No");
      if (!yes || !no) return undefined;
      return {
        home: createCell(yes, "Yes"),
        away: createCell(no, "No"),
      };
    }

    return undefined;
  }

  private groupByLeagueFromDb(
    rows: OddsTableRow[],
    matches: Array<{
      league: {
        externalId: string | null;
        name: string;
        slug?: string;
        country: string | null;
        logoUrl: string | null;
      };
    }>,
  ): LeagueOddsGroup[] {
    const leagueMap = new Map<number, LeagueOddsGroup>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const match = matches[i];

      if (!leagueMap.has(row.leagueId)) {
        leagueMap.set(row.leagueId, {
          leagueId: row.leagueId,
          leagueName: row.leagueName,
          leagueSlug: row.leagueSlug || match.league.slug || undefined,
          country: row.country,
          leagueLogo: match.league.logoUrl || undefined,
          matches: [],
        });
      }
      leagueMap.get(row.leagueId)!.matches.push(row);
    }

    return Array.from(leagueMap.values()).sort((a, b) =>
      a.leagueName.localeCompare(b.leagueName),
    );
  }

  async getFixtureOdds(fixtureId: number): Promise<OddsTableRow | null> {
    return this.getFixtureOddsFromDb(fixtureId);
  }

  private async getFixtureOddsFromDb(
    fixtureId: number,
  ): Promise<OddsTableRow | null> {
    const match = await this.prisma.match.findFirst({
      where: { externalId: fixtureId.toString() },
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
        odds: {
          where: { status: "active" },
          include: { betType: true },
        },
      },
    });

    if (!match || match.odds.length === 0) {
      return null;
    }

    return this.transformDbMatchToOddsTableRow(match);
  }

  private transformDbMatchToOddsTableRow(match: {
    id: string;
    externalId: string | null;
    isLive: boolean;
    liveMinute: number | null;
    startTime: Date;
    status: string;
    period: string | null;
    homeScore: number | null;
    awayScore: number | null;
    league: {
      externalId: string | null;
      name: string;
      slug?: string;
      country: string | null;
      logoUrl: string | null;
    };
    homeTeam: {
      id: string;
      name: string;
      shortName: string | null;
      logoUrl: string | null;
    };
    awayTeam: {
      id: string;
      name: string;
      shortName: string | null;
      logoUrl: string | null;
    };
    odds: Array<{
      id: string;
      selection: string;
      selectionName: string | null;
      oddsValue: { toNumber(): number };
      handicap: { toNumber(): number } | null;
      status: string;
      betType: { code: string };
    }>;
  }): OddsTableRow {
    const isLive = match.isLive;
    const matchTime = isLive
      ? `${match.liveMinute || 0}'`
      : new Date(match.startTime).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });

    const oddsByType = new Map<string, typeof match.odds>();
    for (const odd of match.odds) {
      const code = odd.betType.code;
      if (!oddsByType.has(code)) {
        oddsByType.set(code, []);
      }
      oddsByType.get(code)!.push(odd);
    }

    return {
      matchId: match.id,
      fixtureId: match.externalId ? parseInt(match.externalId, 10) : 0,
      externalId: match.externalId ? parseInt(match.externalId, 10) : 0,
      leagueId: match.league.externalId
        ? parseInt(match.league.externalId, 10)
        : 0,
      leagueName: match.league.name,
      leagueSlug: match.league.slug || undefined,
      country: match.league.country || "",
      matchTime,
      startTime: match.startTime.toISOString(),
      isLive,
      status: match.status,
      period: match.period || undefined,

      homeTeam: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        shortName: match.homeTeam.shortName || undefined,
        logo: match.homeTeam.logoUrl || undefined,
        score: match.homeScore,
      },
      awayTeam: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        shortName: match.awayTeam.shortName || undefined,
        logo: match.awayTeam.logoUrl || undefined,
        score: match.awayScore,
      },

      hdp: this.extractOddsFromDb(oddsByType.get("asian_handicap"), "hdp"),
      overUnder: this.extractOddsFromDb(oddsByType.get("over_under"), "ou"),
      oneXTwo: this.extractOddsFromDb(oddsByType.get("match_winner"), "1x2"),
      homeGoalOU: this.extractOddsFromDb(oddsByType.get("home_total"), "ou"),
      awayGoalOU: this.extractOddsFromDb(oddsByType.get("away_total"), "ou"),
      btts: this.extractOddsFromDb(oddsByType.get("btts"), "btts"),

      htHdp: isLive
        ? this.extractOddsFromDb(oddsByType.get("ht_asian_handicap"), "hdp")
        : undefined,
      htOverUnder: isLive
        ? this.extractOddsFromDb(oddsByType.get("ht_over_under"), "ou")
        : undefined,
      htOneXTwo: isLive
        ? this.extractOddsFromDb(oddsByType.get("ht_match_winner"), "1x2")
        : undefined,

      totalMarkets: match.odds.length,
    };
  }

  async getLiveOdds(fixtureIds: number[]): Promise<Map<number, OddsMarket[]>> {
    const oddsMap = new Map<number, OddsMarket[]>();

    const promises = fixtureIds.map(async (id) => {
      try {
        const liveOdds = await this.fetchLiveOdds(id);
        if (liveOdds) {
          oddsMap.set(id, liveOdds.odds);
        }
      } catch {
        this.logger.warn(`Failed to fetch live odds for fixture ${id}`);
      }
    });

    await Promise.all(promises);
    return oddsMap;
  }

  async getApiLogs(query: QueryApiLogsDto) {
    const {
      endpoint,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (endpoint) {
      where.endpoint = { contains: endpoint };
    }

    if (status && status !== ApiRequestStatusFilter.ALL) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(
          endDate + "T23:59:59.999Z",
        );
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.apiRequestLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          provider: {
            select: { code: true, name: true },
          },
        },
      }),
      this.prisma.apiRequestLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getApiLogsStats(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalRequests,
      successCount,
      errorCount,
      avgResponseTime,
      requestsByEndpoint,
      requestsByDay,
    ] = await Promise.all([
      this.prisma.apiRequestLog.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.apiRequestLog.count({
        where: { createdAt: { gte: startDate }, status: "success" },
      }),
      this.prisma.apiRequestLog.count({
        where: { createdAt: { gte: startDate }, status: "error" },
      }),
      this.prisma.apiRequestLog.aggregate({
        where: { createdAt: { gte: startDate } },
        _avg: { responseTime: true },
      }),
      this.prisma.apiRequestLog.groupBy({
        by: ["endpoint"],
        where: { createdAt: { gte: startDate } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      this.prisma.$queryRaw`
          SELECT DATE(created_at) as date, COUNT(*)::int as count
          FROM api_request_logs
          WHERE created_at >= ${startDate}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `,
    ]);

    return {
      period: { days, startDate: startDate.toISOString() },
      summary: {
        totalRequests,
        successCount,
        errorCount,
        successRate:
          totalRequests > 0
            ? ((successCount / totalRequests) * 100).toFixed(2) + "%"
            : "0%",
        avgResponseTime: Math.round(avgResponseTime._avg.responseTime || 0),
      },
      requestsByEndpoint: requestsByEndpoint.map(
        (r: { endpoint: string; _count: { id: number } }) => ({
          endpoint: r.endpoint,
          count: r._count.id,
        }),
      ),
      requestsByDay,
    };
  }

  async getAccountStatus() {
    if (!this.providerConfig || !this.providerConfig.apiKey) {
      return null;
    }

    const startTime = Date.now();
    const endpoint = "/status";

    try {
      const url = new URL(`${this.providerConfig.baseUrl}${endpoint}`);

      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(this.providerConfig.headers)) {
        headers[key] = value.replace("{{apiKey}}", this.providerConfig.apiKey);
      }

      if (Object.keys(headers).length === 0) {
        headers["x-apisports-key"] = this.providerConfig.apiKey;
      }

      const response = await fetch(url.toString(), { headers });
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        await this.logApiRequest({
          endpoint,
          method: "GET",
          params: {},
          statusCode: response.status,
          responseTime,
          errorMessage: `Status API failed: ${response.status}`,
          errorCode: response.status.toString(),
        });
        throw new Error(`Status API failed: ${response.status}`);
      }

      const responseText = await response.text();
      const data = JSON.parse(responseText);

      await this.logApiRequest({
        endpoint,
        method: "GET",
        params: {},
        responseBody: data,
        statusCode: response.status,
        responseTime,
        responseSize: responseText.length,
        resultCount: data.results,
      });

      const accountStatus: ApiAccountStatus | null = Array.isArray(
        data.response,
      )
        ? data.response[0]
        : data.response;

      if (!accountStatus || !accountStatus.requests) {
        this.logger.warn(
          `Status API returned unexpected payload (missing requests): ${responseText.slice(0, 500)}`,
        );
        return null;
      }

      await this.prisma.dataProvider.update({
        where: { code: PROVIDER_CODE },
        data: {
          dailyUsage: accountStatus.requests.current,
          dailyLimit: accountStatus.requests.limit_day,
          lastSyncAt: new Date(),
          healthScore: 100,
          config: {
            subscription: accountStatus.subscription,
            account: {
              email: accountStatus.account.email,
            },
          },
        },
      });

      return {
        account: accountStatus.account,
        subscription: accountStatus.subscription,
        requests: accountStatus.requests,
        provider: {
          dailyUsage: accountStatus.requests.current,
          dailyLimit: accountStatus.requests.limit_day,
          remainingToday:
            accountStatus.requests.limit_day - accountStatus.requests.current,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error(`Failed to fetch account status: ${error}`);

      await this.logApiRequest({
        endpoint,
        method: "GET",
        params: {},
        responseTime,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorCode: "FETCH_ERROR",
      });

      throw error;
    }
  }

  private async fetchFixtures(query: QueryOddsDto): Promise<ApiFixture[]> {
    const params: Record<string, string> = {};

    if (query.live) {
      params.live = query.leagueIds?.length ? query.leagueIds.join("-") : "all";
    } else if (query.date) {
      params.date = query.date;
    } else {
      const today = new Date().toISOString().split("T")[0];
      params.date = today;
    }

    if (query.leagueIds?.length && !query.live) {
      params.league = query.leagueIds[0].toString();
    }

    const response = await this.makeApiRequest<ApiFixture>("/fixtures", params);
    return response.response;
  }

  private async fetchOddsForFixtures(
    fixtureIds: number[],
    isLive?: boolean,
  ): Promise<Map<number, OddsMarket[]>> {
    const oddsMap = new Map<number, OddsMarket[]>();

    const batchSize = 10;
    for (let i = 0; i < fixtureIds.length; i += batchSize) {
      const batch = fixtureIds.slice(i, i + batchSize);

      const promises = batch.map(async (id) => {
        try {
          const odds = isLive
            ? await this.fetchLiveOddsMarkets(id)
            : await this.fetchPreMatchOdds(id);
          if (odds.length > 0) {
            oddsMap.set(id, odds);
          }
        } catch {
          this.logger.warn(`Failed to fetch odds for fixture ${id}`);
        }
      });

      await Promise.all(promises);
    }

    return oddsMap;
  }

  private async fetchPreMatchOdds(fixtureId: number): Promise<OddsMarket[]> {
    const response = await this.makeApiRequest<ApiOddsResponse>("/odds", {
      fixture: fixtureId.toString(),
      bookmaker: DEFAULT_BOOKMAKER_ID.toString(),
    });

    if (response.response.length === 0) {
      return [];
    }

    const bookmakers = response.response[0].bookmakers;
    const targetBookmaker =
      bookmakers.find((b) => b.id === DEFAULT_BOOKMAKER_ID) || bookmakers[0];

    if (!targetBookmaker) {
      return [];
    }

    return targetBookmaker.bets;
  }

  private async fetchLiveOdds(
    fixtureId: number,
  ): Promise<ApiLiveOddsResponse | null> {
    const response = await this.makeApiRequest<ApiLiveOddsResponse>(
      "/odds/live",
      {
        fixture: fixtureId.toString(),
      },
    );

    return response.response[0] || null;
  }

  private async fetchLiveOddsMarkets(fixtureId: number): Promise<OddsMarket[]> {
    const liveOdds = await this.fetchLiveOdds(fixtureId);
    return liveOdds?.odds || [];
  }

  private async makeApiRequest<T>(
    endpoint: string,
    params: Record<string, string>,
  ): Promise<ApiFootballResponse<T>> {
    const providerConfig = this.providerConfig;
    if (!providerConfig || !providerConfig.apiKey) {
      this.logger.warn("API Football provider not configured");
      return {
        get: endpoint,
        parameters: params,
        errors: [],
        results: 0,
        paging: { current: 1, total: 1 },
        response: [],
      };
    }

    const cacheTtlSeconds = this.getCacheTtlSeconds(endpoint, params);
    const cacheKey =
      cacheTtlSeconds > 0 ? this.buildCacheKey(endpoint, params) : null;

    if (cacheKey) {
      const cached = await this.redis.getJson<ApiFootballResponse<T>>(cacheKey);
      if (cached) return cached;

      const inFlight = this.inFlightRequests.get(cacheKey);
      if (inFlight) return (await inFlight) as ApiFootballResponse<T>;
    }

    if (await this.isDailyQuotaExceeded()) {
      this.logger.warn(`Daily quota exceeded — skipping API call: ${endpoint}`);
      return {
        get: endpoint,
        parameters: params,
        errors: { quota: "Daily API quota exceeded" },
        results: 0,
        paging: { current: 1, total: 1 },
        response: [],
      };
    }

    const requestPromise = (async () => {
      const startTime = Date.now();

      const url = new URL(`${providerConfig.baseUrl}${endpoint}`);
      Object.entries(params).forEach(([key, value]) =>
        url.searchParams.append(key, value),
      );

      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(providerConfig.headers)) {
        headers[key] = value.replace("{{apiKey}}", providerConfig.apiKey);
      }

      if (Object.keys(headers).length === 0) {
        headers["x-apisports-key"] = providerConfig.apiKey;
      }

      const rateLimitConfig = this.getEffectiveRateLimitConfig();

      try {
        for (
          let attempt = 0;
          attempt <= rateLimitConfig.maxRetries;
          attempt++
        ) {
          await this.waitForRateLimitSlot(rateLimitConfig);

          const response = await fetch(url.toString(), { headers });
          const responseTime = Date.now() - startTime;

          if (!response.ok) {
            if (
              response.status === 429 &&
              attempt < rateLimitConfig.maxRetries
            ) {
              const backoffMs = this.getBackoffMs(rateLimitConfig, attempt);
              await this.logApiRequest({
                endpoint,
                method: "GET",
                params,
                statusCode: response.status,
                responseTime,
                errorMessage: `API request rate-limited: ${response.status}`,
                errorCode: "HTTP_429",
                fixtureIds: this.extractFixtureIds(params),
                leagueIds: this.extractLeagueIds(params),
              });
              this.applyCooldown(backoffMs);
              this.logger.warn(
                `API rate limited (HTTP 429): ${endpoint} - retrying in ${backoffMs}ms`,
              );
              continue;
            }

            const errorMessage = `API request failed: ${response.status}`;
            await this.logApiRequest({
              endpoint,
              method: "GET",
              params,
              statusCode: response.status,
              responseTime,
              errorMessage,
              errorCode: response.status.toString(),
              fixtureIds: this.extractFixtureIds(params),
              leagueIds: this.extractLeagueIds(params),
            });
            throw new Error(errorMessage);
          }

          const responseText = await response.text();
          const responseData = JSON.parse(
            responseText,
          ) as ApiFootballResponse<T>;

          const apiErrors = parseApiFootballErrors(responseData);

          if (apiErrors.hasError) {
            await this.logApiRequest({
              endpoint,
              method: "GET",
              params,
              responseBody: responseData,
              statusCode: response.status,
              responseTime,
              responseSize: responseText.length,
              resultCount: responseData.results,
              errorMessage:
                apiErrors.errorMessage || "API returned error in response body",
              errorCode: apiErrors.errorCode || "API_BODY_ERROR",
              fixtureIds: this.extractFixtureIds(params),
              leagueIds: this.extractLeagueIds(params),
              apiErrors: apiErrors.errors as Record<string, string>,
            });

            await this.recordError(apiErrors.errorMessage || "API error");
            this.logger.warn(
              `API returned error: ${endpoint} - ${apiErrors.errorMessage}`,
            );

            if (
              apiErrors.errorType === "rate_limit" &&
              attempt < rateLimitConfig.maxRetries
            ) {
              const backoffMs = this.getBackoffMs(rateLimitConfig, attempt);
              this.applyCooldown(backoffMs);
              this.logger.warn(
                `API body rate-limit: ${endpoint} - retrying in ${backoffMs}ms`,
              );
              continue;
            }

            return responseData;
          }

          await this.logApiRequest({
            endpoint,
            method: "GET",
            params,
            responseBody: responseData,
            statusCode: response.status,
            responseTime,
            responseSize: responseText.length,
            resultCount: responseData.results,
            fixtureIds: this.extractFixtureIds(params),
            leagueIds: this.extractLeagueIds(params),
          });

          await this.incrementUsage();
          return responseData;
        }

        throw new Error("API request failed after retries");
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        const isAlreadyLoggedError = errorMessage.startsWith(
          "API request failed:",
        );
        if (!isAlreadyLoggedError) {
          await this.logApiRequest({
            endpoint,
            method: "GET",
            params,
            responseTime,
            errorMessage,
            errorCode: "FETCH_ERROR",
            fixtureIds: this.extractFixtureIds(params),
            leagueIds: this.extractLeagueIds(params),
          });
        }

        await this.recordError(errorMessage);
        this.logger.error(`API request failed: ${endpoint}`, error);
        throw error;
      }
    })();

    if (cacheKey) {
      this.inFlightRequests.set(
        cacheKey,
        requestPromise as Promise<ApiFootballResponse<unknown>>,
      );
    }

    try {
      const responseData = await requestPromise;
      if (cacheKey) {
        const parsedErrors = parseApiFootballErrors(responseData);
        // Avoid caching error responses (esp. rate limits), otherwise we can serve errors for TTL seconds.
        if (!parsedErrors.hasError) {
          await this.redis.setJson(cacheKey, responseData, cacheTtlSeconds);
        }
      }
      return responseData;
    } finally {
      if (cacheKey) {
        this.inFlightRequests.delete(cacheKey);
      }
    }
  }

  private buildCacheKey(
    endpoint: string,
    params: Record<string, string>,
  ): string {
    const canonicalParams = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    const hash = createHash("sha256")
      .update(`${endpoint}?${canonicalParams}`)
      .digest("hex")
      .slice(0, 32);
    return `${this.apiCachePrefix}:${endpoint.replaceAll("/", "_")}:${hash}`;
  }

  private getCacheTtlSeconds(
    endpoint: string,
    params: Record<string, string>,
  ): number {
    if (endpoint === "/status") return 0;

    if (endpoint === "/fixtures") {
      if (params.live) return CACHE_TTL_SECONDS.LIVE_FIXTURES;
      return CACHE_TTL_SECONDS.FIXTURES;
    }

    if (endpoint === "/odds") return CACHE_TTL_SECONDS.PRE_MATCH_ODDS;
    if (endpoint === "/odds/live") return CACHE_TTL_SECONDS.LIVE_ODDS;

    return 0;
  }

  private getEffectiveRateLimitConfig(): RateLimitConfig {
    const syncRateLimit = this.syncConfig?.rateLimitConfig;

    // Env overrides (useful for local dev without DB changes)
    const envRpm = this.parsePositiveInt(
      this.configService.get<string>("API_FOOTBALL_RPM"),
    );
    const envDelayMs = this.parsePositiveInt(
      this.configService.get<string>("API_FOOTBALL_DELAY_MS"),
    );
    const envMaxRetries = this.parsePositiveInt(
      this.configService.get<string>("API_FOOTBALL_MAX_RETRIES"),
    );
    const envBaseBackoffMs = this.parsePositiveInt(
      this.configService.get<string>("API_FOOTBALL_BASE_BACKOFF_MS"),
    );

    const requestsPerMinute = envRpm ?? syncRateLimit?.requestsPerMinute ?? 300;
    const delayBetweenRequestsMs =
      envDelayMs ??
      syncRateLimit?.delayBetweenRequests ??
      Math.ceil(60_000 / Math.max(1, requestsPerMinute));

    return {
      requestsPerMinute,
      delayBetweenRequestsMs,
      maxRetries: envMaxRetries ?? 2,
      baseBackoffMs: envBaseBackoffMs ?? 2_000,
    };
  }

  private async waitForRateLimitSlot(config: RateLimitConfig): Promise<void> {
    const rpmIntervalMs = Math.ceil(
      60_000 / Math.max(1, config.requestsPerMinute),
    );
    const minIntervalMs = Math.max(
      config.delayBetweenRequestsMs,
      rpmIntervalMs,
    );

    const task = async () => {
      const now = Date.now();
      const earliest = Math.max(
        this.cooldownUntilMs,
        this.lastRequestAtMs + minIntervalMs,
      );
      const waitMs = earliest - now;
      if (waitMs > 0) {
        await this.sleep(waitMs);
      }
      this.lastRequestAtMs = Date.now();
    };

    this.rateLimitChain = this.rateLimitChain.then(task, task);
    await this.rateLimitChain;
  }

  private applyCooldown(ms: number): void {
    const until = Date.now() + Math.max(0, ms);
    this.cooldownUntilMs = Math.max(this.cooldownUntilMs, until);
  }

  private getBackoffMs(config: RateLimitConfig, attempt: number): number {
    const base = config.baseBackoffMs * Math.pow(2, attempt);
    const jitter = Math.floor(Math.random() * 250);
    return base + jitter;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private parsePositiveInt(value: string | undefined): number | null {
    if (!value) return null;
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  }

  private extractFixtureIds(params: Record<string, string>): string[] {
    const fixtureIds: string[] = [];
    if (params.fixture) {
      fixtureIds.push(params.fixture);
    }
    if (params.id) {
      fixtureIds.push(params.id);
    }
    return fixtureIds;
  }

  private extractLeagueIds(params: Record<string, string>): number[] {
    const leagueIds: number[] = [];
    if (params.league) {
      const id = parseInt(params.league, 10);
      if (!isNaN(id)) {
        leagueIds.push(id);
      }
    }
    if (params.live && params.live !== "all") {
      const ids = params.live
        .split("-")
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id));
      leagueIds.push(...ids);
    }
    return leagueIds;
  }

  private async logApiRequest(data: ApiLogData): Promise<void> {
    if (!this.providerConfig) return;

    try {
      const sanitizedHeaders = this.sanitizeHeadersForLogging(
        this.providerConfig.headers,
      );

      await this.prisma.apiRequestLog.create({
        data: {
          providerId: this.providerConfig.id,
          endpoint: data.endpoint,
          method: data.method,
          params: data.params,
          headers: sanitizedHeaders,
          status: data.errorMessage ? "error" : "success",
          statusCode: data.statusCode,
          responseTime: data.responseTime,
          responseSize: data.responseSize,
          resultCount: data.resultCount,
          responseBody: this.truncateResponseBodyForLogging(data.responseBody),
          errorMessage: data.errorMessage,
          errorCode: data.errorCode,
          apiErrors: data.apiErrors || undefined,
          fixtureIds: data.fixtureIds || [],
          leagueIds: data.leagueIds || [],
        },
      });
    } catch (logError) {
      this.logger.warn(`Failed to log API request: ${logError}`);
    }
  }

  private truncateResponseBodyForLogging(body: unknown): object | undefined {
    if (body === undefined || body === null) return undefined;

    const maxChars = 20_000;
    try {
      const json = JSON.stringify(body);
      if (json.length <= maxChars) {
        return JSON.parse(json) as object;
      }
      return {
        truncated: true,
        preview: json.slice(0, maxChars),
        originalLength: json.length,
      };
    } catch {
      return { truncated: true, preview: String(body).slice(0, 1_000) };
    }
  }

  private sanitizeHeadersForLogging(
    headers: Record<string, string>,
  ): Record<string, string> {
    const sanitized: Record<string, string> = {};
    for (const key of Object.keys(headers)) {
      const isSensitiveKey =
        key.toLowerCase().includes("key") ||
        key.toLowerCase().includes("secret");
      sanitized[key] = isSensitiveKey ? "[REDACTED]" : headers[key];
    }
    return sanitized;
  }

  private async incrementUsage(): Promise<void> {
    try {
      await this.prisma.dataProvider.update({
        where: { code: PROVIDER_CODE },
        data: {
          dailyUsage: { increment: 1 },
          monthlyUsage: { increment: 1 },
          lastSyncAt: new Date(),
        },
      });
    } catch {
      this.logger.warn("Failed to increment usage counter");
    }
  }

  private async isDailyQuotaExceeded(): Promise<boolean> {
    try {
      const provider = await this.prisma.dataProvider.findUnique({
        where: { code: PROVIDER_CODE },
        select: { dailyUsage: true, dailyLimit: true },
      });

      if (!provider || !provider.dailyLimit) return false;

      return provider.dailyUsage >= provider.dailyLimit;
    } catch {
      return false;
    }
  }

  private async recordError(errorMessage: string): Promise<void> {
    try {
      await this.prisma.dataProvider.update({
        where: { code: PROVIDER_CODE },
        data: {
          lastErrorAt: new Date(),
          lastError: errorMessage,
          healthScore: { decrement: 5 },
        },
      });
    } catch {
      this.logger.warn("Failed to record error");
    }
  }

  private transformToOddsTableRows(
    fixtures: ApiFixture[],
    oddsMap: Map<number, OddsMarket[]>,
  ): OddsTableRow[] {
    return fixtures.map((fixture) => {
      const odds = oddsMap.get(fixture.fixture.id) || [];
      return this.transformFixtureToRow(fixture, odds);
    });
  }

  private transformFixtureToRow(
    fixture: ApiFixture,
    odds: OddsMarket[],
  ): OddsTableRow {
    const isLive = LIVE_STATUSES.includes(
      fixture.fixture.status.short as FixtureStatusShort,
    );
    const matchTime = isLive
      ? `${fixture.fixture.status.elapsed || 0}'`
      : new Date(fixture.fixture.date).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });

    return {
      fixtureId: fixture.fixture.id,
      externalId: fixture.fixture.id,
      leagueId: fixture.league.id,
      leagueName: fixture.league.name,
      country: fixture.league.country,
      matchTime,
      startTime: fixture.fixture.date,
      isLive,
      status: fixture.fixture.status.short,
      period: fixture.fixture.status.long,

      homeTeam: {
        id: fixture.teams.home.id.toString(),
        name: fixture.teams.home.name,
        logo: fixture.teams.home.logo,
        score: fixture.goals.home,
      },
      awayTeam: {
        id: fixture.teams.away.id.toString(),
        name: fixture.teams.away.name,
        logo: fixture.teams.away.logo,
        score: fixture.goals.away,
      },

      hdp: this.extractAsianHandicap(odds, API_FOOTBALL_BET_IDS.ASIAN_HANDICAP),
      overUnder: this.extractOverUnder(odds, API_FOOTBALL_BET_IDS.OVER_UNDER),
      oneXTwo: this.extractMatchWinner(odds, API_FOOTBALL_BET_IDS.MATCH_WINNER),
      homeGoalOU: this.extractTeamTotal(
        odds,
        API_FOOTBALL_BET_IDS.HOME_TEAM_TOTAL,
      ),
      awayGoalOU: this.extractTeamTotal(
        odds,
        API_FOOTBALL_BET_IDS.AWAY_TEAM_TOTAL,
      ),
      btts: this.extractBTTS(odds),

      htHdp: isLive
        ? this.extractAsianHandicap(
            odds,
            API_FOOTBALL_BET_IDS.HT_ASIAN_HANDICAP,
          )
        : undefined,
      htOverUnder: isLive
        ? this.extractOverUnder(odds, API_FOOTBALL_BET_IDS.HT_OVER_UNDER)
        : undefined,
      htOneXTwo: isLive
        ? this.extractMatchWinner(odds, API_FOOTBALL_BET_IDS.HT_MATCH_WINNER)
        : undefined,

      totalMarkets: odds.length,
    };
  }

  private extractAsianHandicap(
    odds: OddsMarket[],
    betId: number,
  ): MatchOdds | undefined {
    const market = odds.find((o) => o.id === betId);
    if (!market) return undefined;

    const mainValues = market.values.filter((v) => v.main === true);
    const values =
      mainValues.length > 0 ? mainValues : market.values.slice(0, 2);

    const home = values.find((v) => v.value === "Home");
    const away = values.find((v) => v.value === "Away");

    if (!home || !away) return undefined;

    return {
      home: this.createOddsCell(home, home.handicap || ""),
      away: this.createOddsCell(away, away.handicap || ""),
    };
  }

  private extractOverUnder(
    odds: OddsMarket[],
    betId: number,
  ): MatchOdds | undefined {
    const market = odds.find((o) => o.id === betId);
    if (!market) return undefined;

    const mainValues = market.values.filter((v) => v.main === true);
    const values =
      mainValues.length > 0 ? mainValues : market.values.slice(0, 2);

    const over = values.find((v) => v.value === "Over");
    const under = values.find((v) => v.value === "Under");

    if (!over || !under) return undefined;

    const handicap = over.handicap || "2.5";

    return {
      home: this.createOddsCell(over, `O ${handicap}`),
      away: this.createOddsCell(under, `U ${handicap}`),
    };
  }

  private extractMatchWinner(
    odds: OddsMarket[],
    betId: number,
  ): MatchOdds | undefined {
    const market = odds.find((o) => o.id === betId);
    if (!market) return undefined;

    const home = market.values.find((v) => v.value === "Home");
    const draw = market.values.find((v) => v.value === "Draw");
    const away = market.values.find((v) => v.value === "Away");

    if (!home || !away) return undefined;

    return {
      home: this.createOddsCell(home, "H"),
      away: this.createOddsCell(away, "A"),
      draw: draw ? this.createOddsCell(draw, "D") : undefined,
    };
  }

  private extractTeamTotal(
    odds: OddsMarket[],
    betId: number,
  ): MatchOdds | undefined {
    const market = odds.find((o) => o.id === betId);
    if (!market) return undefined;

    const over = market.values.find((v) => v.value.includes("Over"));
    const under = market.values.find((v) => v.value.includes("Under"));

    if (!over || !under) return undefined;

    const handicap = over.handicap || "0.5";

    return {
      home: this.createOddsCell(over, `O ${handicap}`),
      away: this.createOddsCell(under, `U ${handicap}`),
    };
  }

  private extractBTTS(odds: OddsMarket[]): MatchOdds | undefined {
    const market = odds.find(
      (o) => o.id === API_FOOTBALL_BET_IDS.BOTH_TEAMS_SCORE,
    );
    if (!market) return undefined;

    const yes = market.values.find((v) => v.value === "Yes");
    const no = market.values.find((v) => v.value === "No");

    if (!yes || !no) return undefined;

    return {
      home: this.createOddsCell(yes, "Yes"),
      away: this.createOddsCell(no, "No"),
    };
  }

  private createOddsCell(value: OddsValue, label: string): OddsCell {
    return {
      oddsId: (value as any).id || undefined,
      label,
      odds: parseFloat(value.odd),
      handicap: value.handicap || undefined,
      suspended: value.suspended,
    };
  }

  private groupByLeague(rows: OddsTableRow[]): LeagueOddsGroup[] {
    const leagueMap = new Map<number, LeagueOddsGroup>();

    for (const row of rows) {
      if (!leagueMap.has(row.leagueId)) {
        leagueMap.set(row.leagueId, {
          leagueId: row.leagueId,
          leagueName: row.leagueName,
          country: row.country,
          matches: [],
        });
      }
      leagueMap.get(row.leagueId)!.matches.push(row);
    }

    return Array.from(leagueMap.values()).sort((a, b) =>
      a.leagueName.localeCompare(b.leagueName),
    );
  }

  private readonly TOP_COUNTRIES = [
    {
      code: "GB",
      name: "United Kingdom",
      flag: "https://media.api-sports.io/flags/gb.svg",
      aliases: ["England", "Scotland", "Wales", "Northern Ireland"],
    },
    {
      code: "IT",
      name: "Italy",
      flag: "https://media.api-sports.io/flags/it.svg",
      aliases: ["Italy"],
    },
    {
      code: "ES",
      name: "Spain",
      flag: "https://media.api-sports.io/flags/es.svg",
      aliases: ["Spain"],
    },
    {
      code: "DE",
      name: "Germany",
      flag: "https://media.api-sports.io/flags/de.svg",
      aliases: ["Germany"],
    },
    {
      code: "FR",
      name: "France",
      flag: "https://media.api-sports.io/flags/fr.svg",
      aliases: ["France"],
    },
  ];

  private readonly INTERNATIONAL_KEYWORDS = [
    "World",
    "UEFA",
    "CONMEBOL",
    "AFC",
    "CAF",
    "CONCACAF",
    "OFC",
    "International",
    "Euro",
  ];

  async getTopLeagues(date?: string): Promise<TopLeaguesResponse> {
    const targetDate = date || new Date().toISOString().split("T")[0];
    const dateStart = new Date(targetDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(targetDate);
    dateEnd.setHours(23, 59, 59, 999);

    const dbMatches = await this.prisma.match.findMany({
      where: {
        startTime: { gte: dateStart, lte: dateEnd },
        league: { isActive: true },
      },
      include: {
        league: {
          select: {
            externalId: true,
            name: true,
            country: true,
            logoUrl: true,
            sortOrder: true,
          },
        },
      },
    });

    const fixtures: ApiFixture[] = dbMatches.map((m) => ({
      fixture: {
        id: m.externalId ? parseInt(m.externalId, 10) : 0,
        referee: null,
        timezone: "UTC",
        date: m.startTime.toISOString(),
        timestamp: Math.floor(m.startTime.getTime() / 1000),
        periods: { first: null, second: null },
        venue: { id: null, name: null, city: null },
        status: {
          long: m.period || "",
          short: m.status,
          elapsed: m.liveMinute,
        },
      },
      league: {
        id: m.league.externalId ? parseInt(m.league.externalId, 10) : 0,
        name: m.league.name,
        country: m.league.country || "",
        logo: m.league.logoUrl || "",
        flag: "",
        season: null,
        round: null,
      },
      teams: {
        home: { id: 0, name: "", logo: "", winner: null },
        away: { id: 0, name: "", logo: "", winner: null },
      },
      goals: { home: m.homeScore, away: m.awayScore },
      score: {
        halftime: { home: null, away: null },
        fulltime: { home: null, away: null },
        extratime: { home: null, away: null },
        penalty: { home: null, away: null },
      },
    })) as unknown as ApiFixture[];

    const countryStats = this.groupFixturesByCountry(fixtures);
    const topLeagues = this.calculateTopLeaguesStats(countryStats);

    await this.applyDbLeagueOrdering(countryStats, topLeagues);

    return {
      topLeagues,
      countries: countryStats,
      totalMatches: dbMatches.length,
      lastUpdate: new Date().toISOString(),
    };
  }

  private async applyDbLeagueOrdering(
    countries: CountryLeagueStats[],
    topLeagues: CountryLeagueStats,
  ): Promise<void> {
    const externalIds = new Set<string>();

    for (const country of countries) {
      for (const league of country.leagues) {
        externalIds.add(String(league.id));
      }
    }
    for (const league of topLeagues.leagues) {
      externalIds.add(String(league.id));
    }

    if (externalIds.size === 0) return;

    const dbLeagues = await this.prisma.league.findMany({
      where: { externalId: { in: Array.from(externalIds) } },
      select: { externalId: true, sortOrder: true },
    });

    const sortOrderByExternalId = new Map<string, number>();
    for (const league of dbLeagues) {
      if (league.externalId) {
        sortOrderByExternalId.set(league.externalId, league.sortOrder);
      }
    }

    const compare = (
      a: { id: number; name: string; matchCount: number },
      b: { id: number; name: string; matchCount: number },
    ) => {
      const aOrder = sortOrderByExternalId.get(String(a.id));
      const bOrder = sortOrderByExternalId.get(String(b.id));

      if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
      if (aOrder !== undefined) return -1;
      if (bOrder !== undefined) return 1;

      if (a.matchCount !== b.matchCount) return b.matchCount - a.matchCount;
      return a.name.localeCompare(b.name);
    };

    for (const country of countries) {
      country.leagues.sort(compare);
    }
    topLeagues.leagues.sort(compare);
  }

  private getCountryConfig(country: string) {
    for (const config of this.TOP_COUNTRIES) {
      if (config.aliases.includes(country)) {
        return config;
      }
    }
    return null;
  }

  private groupFixturesByCountry(fixtures: ApiFixture[]): CountryLeagueStats[] {
    const countryMap = new Map<string, CountryLeagueStats>();

    for (const fixture of fixtures) {
      const country = fixture.league.country;
      const countryConfig = this.getCountryConfig(country);
      const countryKey = countryConfig?.code || country;

      if (!countryMap.has(countryKey)) {
        countryMap.set(countryKey, {
          countryCode: countryConfig?.code || "",
          countryName: countryConfig?.name || country,
          countryFlag: countryConfig?.flag || fixture.league.flag,
          matchCount: 0,
          leagues: [],
        });
      }

      const stats = countryMap.get(countryKey)!;
      stats.matchCount++;

      const existingLeague = stats.leagues.find(
        (l) => l.id === fixture.league.id,
      );
      if (existingLeague) {
        existingLeague.matchCount++;
      } else {
        stats.leagues.push({
          id: fixture.league.id,
          name: fixture.league.name,
          logo: fixture.league.logo,
          matchCount: 1,
        });
      }
    }

    const result: CountryLeagueStats[] = [];

    for (const config of this.TOP_COUNTRIES) {
      const countryData = countryMap.get(config.code);
      if (countryData) {
        result.push(countryData);
      } else {
        for (const [key, stats] of countryMap.entries()) {
          if (config.aliases.includes(stats.countryName)) {
            stats.countryCode = config.code;
            stats.countryName = config.name;
            stats.countryFlag = config.flag;
            result.push(stats);
            countryMap.delete(key);
            break;
          }
        }
      }
    }

    const internationals = this.getInternationalsStats(fixtures);
    if (internationals.matchCount > 0) {
      result.push(internationals);
    }

    return result;
  }

  private getInternationalsStats(fixtures: ApiFixture[]): CountryLeagueStats {
    const internationalFixtures = fixtures.filter((f) =>
      this.INTERNATIONAL_KEYWORDS.some(
        (keyword) =>
          f.league.name.includes(keyword) ||
          f.league.country.includes(keyword) ||
          f.league.country === "World",
      ),
    );

    const leagueMap = new Map<
      number,
      { id: number; name: string; logo: string; matchCount: number }
    >();

    for (const fixture of internationalFixtures) {
      const existing = leagueMap.get(fixture.league.id);
      if (existing) {
        existing.matchCount++;
      } else {
        leagueMap.set(fixture.league.id, {
          id: fixture.league.id,
          name: fixture.league.name,
          logo: fixture.league.logo,
          matchCount: 1,
        });
      }
    }

    return {
      countryCode: "INT",
      countryName: "Internationals",
      countryFlag: "https://media.api-sports.io/flags/eu.svg",
      matchCount: internationalFixtures.length,
      leagues: Array.from(leagueMap.values()),
    };
  }

  private calculateTopLeaguesStats(
    countries: CountryLeagueStats[],
  ): CountryLeagueStats {
    const totalMatches = countries.reduce((sum, c) => sum + c.matchCount, 0);
    const allLeagues: Array<{
      id: number;
      name: string;
      logo: string;
      matchCount: number;
    }> = [];

    for (const country of countries) {
      allLeagues.push(...country.leagues);
    }

    allLeagues.sort((a, b) => b.matchCount - a.matchCount);

    return {
      countryCode: "TOP",
      countryName: "Top Leagues",
      countryFlag: null,
      matchCount: totalMatches,
      leagues: allLeagues.slice(0, 10),
    };
  }

  async fetchAllLeagues(onlyCurrentSeason = true): Promise<ApiLeagueInfo[]> {
    const params: Record<string, string> = {};
    if (onlyCurrentSeason) {
      params.current = "true";
    }

    const response = await this.makeApiRequest<ApiLeagueInfo>(
      "/leagues",
      params,
    );
    return response.response;
  }

  async fetchTeams(leagueId: number, season?: number): Promise<ApiTeamInfo[]> {
    // API-Football requires season parameter when querying by league
    // If not provided, use current year as season
    const effectiveSeason = season ?? new Date().getFullYear();

    const params: Record<string, string> = {
      league: leagueId.toString(),
      season: effectiveSeason.toString(),
    };

    const response = await this.makeApiRequest<ApiTeamInfo>("/teams", params);
    return response.response;
  }

  async fetchStandings(
    leagueId: number,
    season?: number,
  ): Promise<ApiStandingsResponse | null> {
    const effectiveSeason = season ?? new Date().getFullYear();

    const params: Record<string, string> = {
      league: leagueId.toString(),
      season: effectiveSeason.toString(),
    };

    const response = await this.makeApiRequest<ApiStandingsResponse>(
      "/standings",
      params,
    );
    return response.response[0] || null;
  }

  async fetchTeamStatistics(
    teamId: number,
    leagueId: number,
    season?: number,
  ): Promise<ApiTeamStatistics | null> {
    const effectiveSeason = season ?? new Date().getFullYear();

    const params: Record<string, string> = {
      team: teamId.toString(),
      league: leagueId.toString(),
      season: effectiveSeason.toString(),
    };

    const response = await this.makeApiRequest<ApiTeamStatistics>(
      "/teams/statistics",
      params,
    );
    return response.response[0] || null;
  }
}
