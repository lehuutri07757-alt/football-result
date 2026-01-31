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
var ApiFootballService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiFootballService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const interfaces_1 = require("./interfaces");
const api_football_response_interceptor_1 = require("./interceptors/api-football-response.interceptor");
const dto_1 = require("./dto");
const api_football_constants_1 = require("./constants/api-football.constants");
const PROVIDER_CODE = 'api_football';
const PROVIDER_STATUS_ACTIVE = 'active';
let ApiFootballService = ApiFootballService_1 = class ApiFootballService {
    constructor(prisma, configService, redis) {
        this.prisma = prisma;
        this.configService = configService;
        this.redis = redis;
        this.logger = new common_1.Logger(ApiFootballService_1.name);
        this.providerConfig = null;
        this.apiCachePrefix = 'api_football:api_cache';
        this.inFlightRequests = new Map();
        this.TOP_COUNTRIES = [
            { code: 'GB', name: 'United Kingdom', flag: 'https://media.api-sports.io/flags/gb.svg', aliases: ['England', 'Scotland', 'Wales', 'Northern Ireland'] },
            { code: 'IT', name: 'Italy', flag: 'https://media.api-sports.io/flags/it.svg', aliases: ['Italy'] },
            { code: 'ES', name: 'Spain', flag: 'https://media.api-sports.io/flags/es.svg', aliases: ['Spain'] },
            { code: 'DE', name: 'Germany', flag: 'https://media.api-sports.io/flags/de.svg', aliases: ['Germany'] },
            { code: 'FR', name: 'France', flag: 'https://media.api-sports.io/flags/fr.svg', aliases: ['France'] },
        ];
        this.INTERNATIONAL_KEYWORDS = ['World', 'UEFA', 'CONMEBOL', 'AFC', 'CAF', 'CONCACAF', 'OFC', 'International', 'Euro'];
    }
    async onModuleInit() {
        await this.loadProviderConfig();
    }
    async loadProviderConfig() {
        try {
            const provider = await this.prisma.dataProvider.findUnique({
                where: { code: PROVIDER_CODE },
            });
            if (!provider) {
                this.logger.warn(`Provider '${PROVIDER_CODE}' not found in database`);
                return;
            }
            if (provider.status !== PROVIDER_STATUS_ACTIVE) {
                this.logger.warn(`Provider '${PROVIDER_CODE}' is not active (status: ${provider.status})`);
                return;
            }
            const apiKey = this.configService.get('API_FOOTBALL_KEY') || provider.apiKey || '';
            this.providerConfig = {
                id: provider.id,
                baseUrl: provider.baseUrl,
                apiKey,
                headers: provider.headers || {},
            };
            this.logger.log(`Provider '${PROVIDER_CODE}' loaded successfully`);
        }
        catch (error) {
            this.logger.error(`Failed to load provider config: ${error}`);
        }
    }
    async refreshConfig() {
        await this.loadProviderConfig();
    }
    isConfigured() {
        return this.providerConfig !== null && !!this.providerConfig.apiKey;
    }
    async getOddsTable(query) {
        const fixtures = await this.fetchFixtures(query);
        const fixtureIds = fixtures.map((f) => f.fixture.id);
        if (fixtureIds.length === 0) {
            return { leagues: [], totalMatches: 0, lastUpdate: new Date().toISOString() };
        }
        const oddsMap = await this.fetchOddsForFixtures(fixtureIds, query.live);
        const rows = this.transformToOddsTableRows(fixtures, oddsMap);
        const leagues = this.groupByLeague(rows);
        return {
            leagues,
            totalMatches: rows.length,
            lastUpdate: new Date().toISOString(),
        };
    }
    async getFixtureOdds(fixtureId) {
        const fixturesResponse = await this.makeApiRequest('/fixtures', { id: fixtureId.toString() });
        if (fixturesResponse.response.length === 0) {
            return null;
        }
        const fixture = fixturesResponse.response[0];
        const isLive = interfaces_1.LIVE_STATUSES.includes(fixture.fixture.status.short);
        let odds = [];
        if (isLive) {
            const liveOdds = await this.fetchLiveOdds(fixtureId);
            odds = liveOdds?.odds || [];
        }
        else {
            const preMatchOdds = await this.fetchPreMatchOdds(fixtureId);
            odds = preMatchOdds;
        }
        return this.transformFixtureToRow(fixture, odds);
    }
    async getLiveOdds(fixtureIds) {
        const oddsMap = new Map();
        const promises = fixtureIds.map(async (id) => {
            try {
                const liveOdds = await this.fetchLiveOdds(id);
                if (liveOdds) {
                    oddsMap.set(id, liveOdds.odds);
                }
            }
            catch {
                this.logger.warn(`Failed to fetch live odds for fixture ${id}`);
            }
        });
        await Promise.all(promises);
        return oddsMap;
    }
    async getApiLogs(query) {
        const { endpoint, status, startDate, endDate, page = 1, limit = 50 } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (endpoint) {
            where.endpoint = { contains: endpoint };
        }
        if (status && status !== dto_1.ApiRequestStatusFilter.ALL) {
            where.status = status;
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
            }
        }
        const [logs, total] = await Promise.all([
            this.prisma.apiRequestLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
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
        const [totalRequests, successCount, errorCount, avgResponseTime, requestsByEndpoint, requestsByDay] = await Promise.all([
            this.prisma.apiRequestLog.count({
                where: { createdAt: { gte: startDate } },
            }),
            this.prisma.apiRequestLog.count({
                where: { createdAt: { gte: startDate }, status: 'success' },
            }),
            this.prisma.apiRequestLog.count({
                where: { createdAt: { gte: startDate }, status: 'error' },
            }),
            this.prisma.apiRequestLog.aggregate({
                where: { createdAt: { gte: startDate } },
                _avg: { responseTime: true },
            }),
            this.prisma.apiRequestLog.groupBy({
                by: ['endpoint'],
                where: { createdAt: { gte: startDate } },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10,
            }),
            this.prisma.$queryRaw `
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
                successRate: totalRequests > 0 ? ((successCount / totalRequests) * 100).toFixed(2) + '%' : '0%',
                avgResponseTime: Math.round(avgResponseTime._avg.responseTime || 0),
            },
            requestsByEndpoint: requestsByEndpoint.map((r) => ({
                endpoint: r.endpoint,
                count: r._count.id,
            })),
            requestsByDay,
        };
    }
    async getAccountStatus() {
        if (!this.providerConfig || !this.providerConfig.apiKey) {
            return null;
        }
        const startTime = Date.now();
        const endpoint = '/status';
        try {
            const url = new URL(`${this.providerConfig.baseUrl}${endpoint}`);
            const headers = {};
            for (const [key, value] of Object.entries(this.providerConfig.headers)) {
                headers[key] = value.replace('{{apiKey}}', this.providerConfig.apiKey);
            }
            if (Object.keys(headers).length === 0) {
                headers['x-apisports-key'] = this.providerConfig.apiKey;
            }
            const response = await fetch(url.toString(), { headers });
            const responseTime = Date.now() - startTime;
            if (!response.ok) {
                await this.logApiRequest({
                    endpoint,
                    method: 'GET',
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
                method: 'GET',
                params: {},
                responseBody: data,
                statusCode: response.status,
                responseTime,
                responseSize: responseText.length,
                resultCount: data.results,
            });
            const accountStatus = Array.isArray(data.response)
                ? data.response[0]
                : data.response;
            if (!accountStatus || !accountStatus.requests) {
                this.logger.warn(`Status API returned unexpected payload (missing requests): ${responseText.slice(0, 500)}`);
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
                    remainingToday: accountStatus.requests.limit_day - accountStatus.requests.current,
                },
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            this.logger.error(`Failed to fetch account status: ${error}`);
            await this.logApiRequest({
                endpoint,
                method: 'GET',
                params: {},
                responseTime,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                errorCode: 'FETCH_ERROR',
            });
            throw error;
        }
    }
    async fetchFixtures(query) {
        const params = {};
        if (query.live) {
            params.live = query.leagueIds?.length ? query.leagueIds.join('-') : 'all';
        }
        else if (query.date) {
            params.date = query.date;
        }
        else {
            const today = new Date().toISOString().split('T')[0];
            params.date = today;
        }
        if (query.leagueIds?.length && !query.live) {
            params.league = query.leagueIds[0].toString();
        }
        const response = await this.makeApiRequest('/fixtures', params);
        return response.response;
    }
    async fetchOddsForFixtures(fixtureIds, isLive) {
        const oddsMap = new Map();
        const batchSize = 10;
        for (let i = 0; i < fixtureIds.length; i += batchSize) {
            const batch = fixtureIds.slice(i, i + batchSize);
            const promises = batch.map(async (id) => {
                try {
                    const odds = isLive ? await this.fetchLiveOddsMarkets(id) : await this.fetchPreMatchOdds(id);
                    if (odds.length > 0) {
                        oddsMap.set(id, odds);
                    }
                }
                catch {
                    this.logger.warn(`Failed to fetch odds for fixture ${id}`);
                }
            });
            await Promise.all(promises);
        }
        return oddsMap;
    }
    async fetchPreMatchOdds(fixtureId) {
        const response = await this.makeApiRequest('/odds', {
            fixture: fixtureId.toString(),
            bookmaker: api_football_constants_1.DEFAULT_BOOKMAKER_ID.toString(),
        });
        if (response.response.length === 0) {
            return [];
        }
        const bookmakers = response.response[0].bookmakers;
        const targetBookmaker = bookmakers.find((b) => b.id === api_football_constants_1.DEFAULT_BOOKMAKER_ID) || bookmakers[0];
        if (!targetBookmaker) {
            return [];
        }
        return targetBookmaker.bets;
    }
    async fetchLiveOdds(fixtureId) {
        const response = await this.makeApiRequest('/odds/live', {
            fixture: fixtureId.toString(),
        });
        return response.response[0] || null;
    }
    async fetchLiveOddsMarkets(fixtureId) {
        const liveOdds = await this.fetchLiveOdds(fixtureId);
        return liveOdds?.odds || [];
    }
    async makeApiRequest(endpoint, params) {
        const providerConfig = this.providerConfig;
        if (!providerConfig || !providerConfig.apiKey) {
            this.logger.warn('API Football provider not configured');
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
        const cacheKey = cacheTtlSeconds > 0 ? this.buildCacheKey(endpoint, params) : null;
        if (cacheKey) {
            const cached = await this.redis.getJson(cacheKey);
            if (cached)
                return cached;
            const inFlight = this.inFlightRequests.get(cacheKey);
            if (inFlight)
                return (await inFlight);
        }
        const requestPromise = (async () => {
            const startTime = Date.now();
            const url = new URL(`${providerConfig.baseUrl}${endpoint}`);
            Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
            const headers = {};
            for (const [key, value] of Object.entries(providerConfig.headers)) {
                headers[key] = value.replace('{{apiKey}}', providerConfig.apiKey);
            }
            if (Object.keys(headers).length === 0) {
                headers['x-apisports-key'] = providerConfig.apiKey;
            }
            try {
                const response = await fetch(url.toString(), { headers });
                const responseTime = Date.now() - startTime;
                if (!response.ok) {
                    const errorMessage = `API request failed: ${response.status}`;
                    await this.logApiRequest({
                        endpoint,
                        method: 'GET',
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
                const responseData = JSON.parse(responseText);
                const apiErrors = (0, api_football_response_interceptor_1.parseApiFootballErrors)(responseData);
                if (apiErrors.hasError) {
                    await this.logApiRequest({
                        endpoint,
                        method: 'GET',
                        params,
                        responseBody: responseData,
                        statusCode: response.status,
                        responseTime,
                        responseSize: responseText.length,
                        resultCount: responseData.results,
                        errorMessage: apiErrors.errorMessage || 'API returned error in response body',
                        errorCode: apiErrors.errorCode || 'API_BODY_ERROR',
                        fixtureIds: this.extractFixtureIds(params),
                        leagueIds: this.extractLeagueIds(params),
                        apiErrors: apiErrors.errors,
                    });
                    await this.recordError(apiErrors.errorMessage || 'API error');
                    this.logger.warn(`API returned error: ${endpoint} - ${apiErrors.errorMessage}`);
                    return responseData;
                }
                await this.logApiRequest({
                    endpoint,
                    method: 'GET',
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
            catch (error) {
                const responseTime = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                const isAlreadyLoggedError = errorMessage.startsWith('API request failed:');
                if (!isAlreadyLoggedError) {
                    await this.logApiRequest({
                        endpoint,
                        method: 'GET',
                        params,
                        responseTime,
                        errorMessage,
                        errorCode: 'FETCH_ERROR',
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
            this.inFlightRequests.set(cacheKey, requestPromise);
        }
        try {
            const responseData = await requestPromise;
            if (cacheKey) {
                await this.redis.setJson(cacheKey, responseData, cacheTtlSeconds);
            }
            return responseData;
        }
        finally {
            if (cacheKey) {
                this.inFlightRequests.delete(cacheKey);
            }
        }
    }
    buildCacheKey(endpoint, params) {
        const canonicalParams = Object.entries(params)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('&');
        const hash = (0, crypto_1.createHash)('sha256').update(`${endpoint}?${canonicalParams}`).digest('hex').slice(0, 32);
        return `${this.apiCachePrefix}:${endpoint.replaceAll('/', '_')}:${hash}`;
    }
    getCacheTtlSeconds(endpoint, params) {
        if (endpoint === '/status')
            return 0;
        if (endpoint === '/fixtures') {
            if (params.live)
                return api_football_constants_1.CACHE_TTL_SECONDS.LIVE_FIXTURES;
            return api_football_constants_1.CACHE_TTL_SECONDS.FIXTURES;
        }
        if (endpoint === '/odds')
            return api_football_constants_1.CACHE_TTL_SECONDS.PRE_MATCH_ODDS;
        if (endpoint === '/odds/live')
            return api_football_constants_1.CACHE_TTL_SECONDS.LIVE_ODDS;
        return 0;
    }
    extractFixtureIds(params) {
        const fixtureIds = [];
        if (params.fixture) {
            fixtureIds.push(params.fixture);
        }
        if (params.id) {
            fixtureIds.push(params.id);
        }
        return fixtureIds;
    }
    extractLeagueIds(params) {
        const leagueIds = [];
        if (params.league) {
            const id = parseInt(params.league, 10);
            if (!isNaN(id)) {
                leagueIds.push(id);
            }
        }
        if (params.live && params.live !== 'all') {
            const ids = params.live.split('-').map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
            leagueIds.push(...ids);
        }
        return leagueIds;
    }
    async logApiRequest(data) {
        if (!this.providerConfig)
            return;
        try {
            const sanitizedHeaders = this.sanitizeHeadersForLogging(this.providerConfig.headers);
            await this.prisma.apiRequestLog.create({
                data: {
                    providerId: this.providerConfig.id,
                    endpoint: data.endpoint,
                    method: data.method,
                    params: data.params,
                    headers: sanitizedHeaders,
                    status: data.errorMessage ? 'error' : 'success',
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
        }
        catch (logError) {
            this.logger.warn(`Failed to log API request: ${logError}`);
        }
    }
    truncateResponseBodyForLogging(body) {
        if (body === undefined || body === null)
            return undefined;
        const maxChars = 20_000;
        try {
            const json = JSON.stringify(body);
            if (json.length <= maxChars) {
                return JSON.parse(json);
            }
            return { truncated: true, preview: json.slice(0, maxChars), originalLength: json.length };
        }
        catch {
            return { truncated: true, preview: String(body).slice(0, 1_000) };
        }
    }
    sanitizeHeadersForLogging(headers) {
        const sanitized = {};
        for (const key of Object.keys(headers)) {
            const isSensitiveKey = key.toLowerCase().includes('key') || key.toLowerCase().includes('secret');
            sanitized[key] = isSensitiveKey ? '[REDACTED]' : headers[key];
        }
        return sanitized;
    }
    async incrementUsage() {
        try {
            await this.prisma.dataProvider.update({
                where: { code: PROVIDER_CODE },
                data: {
                    dailyUsage: { increment: 1 },
                    monthlyUsage: { increment: 1 },
                    lastSyncAt: new Date(),
                },
            });
        }
        catch {
            this.logger.warn('Failed to increment usage counter');
        }
    }
    async recordError(errorMessage) {
        try {
            await this.prisma.dataProvider.update({
                where: { code: PROVIDER_CODE },
                data: {
                    lastErrorAt: new Date(),
                    lastError: errorMessage,
                    healthScore: { decrement: 5 },
                },
            });
        }
        catch {
            this.logger.warn('Failed to record error');
        }
    }
    transformToOddsTableRows(fixtures, oddsMap) {
        return fixtures.map((fixture) => {
            const odds = oddsMap.get(fixture.fixture.id) || [];
            return this.transformFixtureToRow(fixture, odds);
        });
    }
    transformFixtureToRow(fixture, odds) {
        const isLive = interfaces_1.LIVE_STATUSES.includes(fixture.fixture.status.short);
        const matchTime = isLive
            ? `${fixture.fixture.status.elapsed || 0}'`
            : new Date(fixture.fixture.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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
            hdp: this.extractAsianHandicap(odds, api_football_constants_1.API_FOOTBALL_BET_IDS.ASIAN_HANDICAP),
            overUnder: this.extractOverUnder(odds, api_football_constants_1.API_FOOTBALL_BET_IDS.OVER_UNDER),
            oneXTwo: this.extractMatchWinner(odds, api_football_constants_1.API_FOOTBALL_BET_IDS.MATCH_WINNER),
            homeGoalOU: this.extractTeamTotal(odds, api_football_constants_1.API_FOOTBALL_BET_IDS.HOME_TEAM_TOTAL),
            awayGoalOU: this.extractTeamTotal(odds, api_football_constants_1.API_FOOTBALL_BET_IDS.AWAY_TEAM_TOTAL),
            btts: this.extractBTTS(odds),
            htHdp: isLive ? this.extractAsianHandicap(odds, api_football_constants_1.API_FOOTBALL_BET_IDS.HT_ASIAN_HANDICAP) : undefined,
            htOverUnder: isLive ? this.extractOverUnder(odds, api_football_constants_1.API_FOOTBALL_BET_IDS.HT_OVER_UNDER) : undefined,
            htOneXTwo: isLive ? this.extractMatchWinner(odds, api_football_constants_1.API_FOOTBALL_BET_IDS.HT_MATCH_WINNER) : undefined,
            totalMarkets: odds.length,
        };
    }
    extractAsianHandicap(odds, betId) {
        const market = odds.find((o) => o.id === betId);
        if (!market)
            return undefined;
        const mainValues = market.values.filter((v) => v.main === true);
        const values = mainValues.length > 0 ? mainValues : market.values.slice(0, 2);
        const home = values.find((v) => v.value === 'Home');
        const away = values.find((v) => v.value === 'Away');
        if (!home || !away)
            return undefined;
        return {
            home: this.createOddsCell(home, home.handicap || ''),
            away: this.createOddsCell(away, away.handicap || ''),
        };
    }
    extractOverUnder(odds, betId) {
        const market = odds.find((o) => o.id === betId);
        if (!market)
            return undefined;
        const mainValues = market.values.filter((v) => v.main === true);
        const values = mainValues.length > 0 ? mainValues : market.values.slice(0, 2);
        const over = values.find((v) => v.value === 'Over');
        const under = values.find((v) => v.value === 'Under');
        if (!over || !under)
            return undefined;
        const handicap = over.handicap || '2.5';
        return {
            home: this.createOddsCell(over, `O ${handicap}`),
            away: this.createOddsCell(under, `U ${handicap}`),
        };
    }
    extractMatchWinner(odds, betId) {
        const market = odds.find((o) => o.id === betId);
        if (!market)
            return undefined;
        const home = market.values.find((v) => v.value === 'Home');
        const draw = market.values.find((v) => v.value === 'Draw');
        const away = market.values.find((v) => v.value === 'Away');
        if (!home || !away)
            return undefined;
        return {
            home: this.createOddsCell(home, 'H'),
            away: this.createOddsCell(away, 'A'),
            draw: draw ? this.createOddsCell(draw, 'D') : undefined,
        };
    }
    extractTeamTotal(odds, betId) {
        const market = odds.find((o) => o.id === betId);
        if (!market)
            return undefined;
        const over = market.values.find((v) => v.value.includes('Over'));
        const under = market.values.find((v) => v.value.includes('Under'));
        if (!over || !under)
            return undefined;
        const handicap = over.handicap || '0.5';
        return {
            home: this.createOddsCell(over, `O ${handicap}`),
            away: this.createOddsCell(under, `U ${handicap}`),
        };
    }
    extractBTTS(odds) {
        const market = odds.find((o) => o.id === api_football_constants_1.API_FOOTBALL_BET_IDS.BOTH_TEAMS_SCORE);
        if (!market)
            return undefined;
        const yes = market.values.find((v) => v.value === 'Yes');
        const no = market.values.find((v) => v.value === 'No');
        if (!yes || !no)
            return undefined;
        return {
            home: this.createOddsCell(yes, 'Yes'),
            away: this.createOddsCell(no, 'No'),
        };
    }
    createOddsCell(value, label) {
        return {
            label,
            odds: parseFloat(value.odd),
            handicap: value.handicap || undefined,
            suspended: value.suspended,
        };
    }
    groupByLeague(rows) {
        const leagueMap = new Map();
        for (const row of rows) {
            if (!leagueMap.has(row.leagueId)) {
                leagueMap.set(row.leagueId, {
                    leagueId: row.leagueId,
                    leagueName: row.leagueName,
                    country: row.country,
                    matches: [],
                });
            }
            leagueMap.get(row.leagueId).matches.push(row);
        }
        return Array.from(leagueMap.values()).sort((a, b) => a.leagueName.localeCompare(b.leagueName));
    }
    async getTopLeagues(date) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const fixtures = await this.fetchUpcomingFixtures(targetDate);
        const countryStats = this.groupFixturesByCountry(fixtures);
        const topLeagues = this.calculateTopLeaguesStats(countryStats);
        await this.applyDbLeagueOrdering(countryStats, topLeagues);
        return {
            topLeagues,
            countries: countryStats,
            totalMatches: fixtures.length,
            lastUpdate: new Date().toISOString(),
        };
    }
    async applyDbLeagueOrdering(countries, topLeagues) {
        const externalIds = new Set();
        for (const country of countries) {
            for (const league of country.leagues) {
                externalIds.add(String(league.id));
            }
        }
        for (const league of topLeagues.leagues) {
            externalIds.add(String(league.id));
        }
        if (externalIds.size === 0)
            return;
        const dbLeagues = await this.prisma.league.findMany({
            where: { externalId: { in: Array.from(externalIds) } },
            select: { externalId: true, sortOrder: true },
        });
        const sortOrderByExternalId = new Map();
        for (const league of dbLeagues) {
            if (league.externalId) {
                sortOrderByExternalId.set(league.externalId, league.sortOrder);
            }
        }
        const compare = (a, b) => {
            const aOrder = sortOrderByExternalId.get(String(a.id));
            const bOrder = sortOrderByExternalId.get(String(b.id));
            if (aOrder !== undefined && bOrder !== undefined)
                return aOrder - bOrder;
            if (aOrder !== undefined)
                return -1;
            if (bOrder !== undefined)
                return 1;
            if (a.matchCount !== b.matchCount)
                return b.matchCount - a.matchCount;
            return a.name.localeCompare(b.name);
        };
        for (const country of countries) {
            country.leagues.sort(compare);
        }
        topLeagues.leagues.sort(compare);
    }
    async fetchUpcomingFixtures(date) {
        const response = await this.makeApiRequest('/fixtures', { date });
        return response.response;
    }
    groupFixturesByCountry(fixtures) {
        const countryMap = new Map();
        for (const fixture of fixtures) {
            const country = fixture.league.country;
            const countryConfig = this.getCountryConfig(country);
            const countryKey = countryConfig?.code || country;
            if (!countryMap.has(countryKey)) {
                countryMap.set(countryKey, {
                    countryCode: countryConfig?.code || '',
                    countryName: countryConfig?.name || country,
                    countryFlag: countryConfig?.flag || fixture.league.flag,
                    matchCount: 0,
                    leagues: [],
                });
            }
            const stats = countryMap.get(countryKey);
            stats.matchCount++;
            const existingLeague = stats.leagues.find(l => l.id === fixture.league.id);
            if (existingLeague) {
                existingLeague.matchCount++;
            }
            else {
                stats.leagues.push({
                    id: fixture.league.id,
                    name: fixture.league.name,
                    logo: fixture.league.logo,
                    matchCount: 1,
                });
            }
        }
        const result = [];
        for (const config of this.TOP_COUNTRIES) {
            const countryData = countryMap.get(config.code);
            if (countryData) {
                result.push(countryData);
            }
            else {
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
    getCountryConfig(country) {
        for (const config of this.TOP_COUNTRIES) {
            if (config.aliases.includes(country)) {
                return config;
            }
        }
        return null;
    }
    getInternationalsStats(fixtures) {
        const internationalFixtures = fixtures.filter(f => this.INTERNATIONAL_KEYWORDS.some(keyword => f.league.name.includes(keyword) || f.league.country.includes(keyword) || f.league.country === 'World'));
        const leagueMap = new Map();
        for (const fixture of internationalFixtures) {
            const existing = leagueMap.get(fixture.league.id);
            if (existing) {
                existing.matchCount++;
            }
            else {
                leagueMap.set(fixture.league.id, {
                    id: fixture.league.id,
                    name: fixture.league.name,
                    logo: fixture.league.logo,
                    matchCount: 1,
                });
            }
        }
        return {
            countryCode: 'INT',
            countryName: 'Internationals',
            countryFlag: 'https://media.api-sports.io/flags/eu.svg',
            matchCount: internationalFixtures.length,
            leagues: Array.from(leagueMap.values()),
        };
    }
    calculateTopLeaguesStats(countries) {
        const totalMatches = countries.reduce((sum, c) => sum + c.matchCount, 0);
        const allLeagues = [];
        for (const country of countries) {
            allLeagues.push(...country.leagues);
        }
        allLeagues.sort((a, b) => b.matchCount - a.matchCount);
        return {
            countryCode: 'TOP',
            countryName: 'Top Leagues',
            countryFlag: null,
            matchCount: totalMatches,
            leagues: allLeagues.slice(0, 10),
        };
    }
    async fetchAllLeagues(onlyCurrentSeason = true) {
        const params = {};
        if (onlyCurrentSeason) {
            params.current = 'true';
        }
        const response = await this.makeApiRequest('/leagues', params);
        return response.response;
    }
    async fetchTeams(leagueId, season) {
        const effectiveSeason = season ?? new Date().getFullYear();
        const params = {
            league: leagueId.toString(),
            season: effectiveSeason.toString(),
        };
        const response = await this.makeApiRequest('/teams', params);
        return response.response;
    }
};
exports.ApiFootballService = ApiFootballService;
exports.ApiFootballService = ApiFootballService = ApiFootballService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        redis_service_1.RedisService])
], ApiFootballService);
//# sourceMappingURL=api-football.service.js.map