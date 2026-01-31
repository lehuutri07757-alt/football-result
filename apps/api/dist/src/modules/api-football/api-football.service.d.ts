import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { OddsMarket, TopLeaguesResponse, ApiLeagueInfo, ApiTeamInfo } from './interfaces';
import { OddsTableRow, OddsTableResponse } from './interfaces/odds-table.interface';
import { QueryOddsDto, QueryApiLogsDto } from './dto';
export declare class ApiFootballService implements OnModuleInit {
    private readonly prisma;
    private readonly configService;
    private readonly redis;
    private readonly logger;
    private providerConfig;
    private readonly apiCachePrefix;
    private readonly inFlightRequests;
    constructor(prisma: PrismaService, configService: ConfigService, redis: RedisService);
    onModuleInit(): Promise<void>;
    private loadProviderConfig;
    refreshConfig(): Promise<void>;
    isConfigured(): boolean;
    getOddsTable(query: QueryOddsDto): Promise<OddsTableResponse>;
    getFixtureOdds(fixtureId: number): Promise<OddsTableRow | null>;
    getLiveOdds(fixtureIds: number[]): Promise<Map<number, OddsMarket[]>>;
    getApiLogs(query: QueryApiLogsDto): Promise<{
        data: ({
            provider: {
                name: string;
                code: string;
            };
        } & {
            params: import("@prisma/client/runtime/library").JsonValue;
            status: import("@prisma/client").$Enums.ApiRequestStatus;
            createdAt: Date;
            id: string;
            headers: import("@prisma/client/runtime/library").JsonValue;
            leagueIds: number[];
            endpoint: string;
            providerId: string;
            method: string;
            statusCode: number | null;
            responseTime: number | null;
            responseSize: number | null;
            resultCount: number | null;
            responseBody: import("@prisma/client/runtime/library").JsonValue | null;
            errorMessage: string | null;
            errorCode: string | null;
            apiErrors: import("@prisma/client/runtime/library").JsonValue | null;
            fixtureIds: string[];
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getApiLogsStats(days?: number): Promise<{
        period: {
            days: number;
            startDate: string;
        };
        summary: {
            totalRequests: number;
            successCount: number;
            errorCount: number;
            successRate: string;
            avgResponseTime: number;
        };
        requestsByEndpoint: {
            endpoint: string;
            count: number;
        }[];
        requestsByDay: unknown;
    }>;
    getAccountStatus(): Promise<{
        account: {
            firstname: string;
            lastname: string;
            email: string;
        };
        subscription: {
            plan: string;
            end: string;
            active: boolean;
        };
        requests: {
            current: number;
            limit_day: number;
        };
        provider: {
            dailyUsage: number;
            dailyLimit: number;
            remainingToday: number;
        };
    } | null>;
    private fetchFixtures;
    private fetchOddsForFixtures;
    private fetchPreMatchOdds;
    private fetchLiveOdds;
    private fetchLiveOddsMarkets;
    private makeApiRequest;
    private buildCacheKey;
    private getCacheTtlSeconds;
    private extractFixtureIds;
    private extractLeagueIds;
    private logApiRequest;
    private truncateResponseBodyForLogging;
    private sanitizeHeadersForLogging;
    private incrementUsage;
    private recordError;
    private transformToOddsTableRows;
    private transformFixtureToRow;
    private extractAsianHandicap;
    private extractOverUnder;
    private extractMatchWinner;
    private extractTeamTotal;
    private extractBTTS;
    private createOddsCell;
    private groupByLeague;
    private readonly TOP_COUNTRIES;
    private readonly INTERNATIONAL_KEYWORDS;
    getTopLeagues(date?: string): Promise<TopLeaguesResponse>;
    private applyDbLeagueOrdering;
    private fetchUpcomingFixtures;
    private groupFixturesByCountry;
    private getCountryConfig;
    private getInternationalsStats;
    private calculateTopLeaguesStats;
    fetchAllLeagues(onlyCurrentSeason?: boolean): Promise<ApiLeagueInfo[]>;
    fetchTeams(leagueId: number, season?: number): Promise<ApiTeamInfo[]>;
}
