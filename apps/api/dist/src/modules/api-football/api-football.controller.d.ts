import { ApiFootballService } from './api-football.service';
import { LeagueSyncService } from './league-sync.service';
import { TeamSyncService } from './team-sync.service';
import { FixtureSyncService } from './fixture-sync.service';
import { OddsSyncService } from './odds-sync.service';
import { SyncConfigService } from './sync-config.service';
import { QueryOddsDto, QueryApiLogsDto } from './dto';
import { LeagueSyncConfig } from './interfaces';
import { ApiFootballSyncConfig } from './constants/api-football.constants';
export declare class ApiFootballController {
    private readonly apiFootballService;
    private readonly leagueSyncService;
    private readonly teamSyncService;
    private readonly fixtureSyncService;
    private readonly oddsSyncService;
    private readonly syncConfigService;
    constructor(apiFootballService: ApiFootballService, leagueSyncService: LeagueSyncService, teamSyncService: TeamSyncService, fixtureSyncService: FixtureSyncService, oddsSyncService: OddsSyncService, syncConfigService: SyncConfigService);
    getTopLeagues(date?: string): Promise<import("./interfaces").TopLeaguesResponse>;
    getGlobalSyncConfig(): Promise<ApiFootballSyncConfig>;
    updateGlobalSyncConfig(config: Partial<ApiFootballSyncConfig>): Promise<ApiFootballSyncConfig>;
    updateGlobalSyncConfigPut(config: Partial<ApiFootballSyncConfig>): Promise<ApiFootballSyncConfig>;
    getLeagues(refresh?: string): Promise<import("./interfaces").ApiLeagueInfo[]>;
    getSyncConfig(): Promise<LeagueSyncConfig>;
    updateSyncConfig(config: Partial<LeagueSyncConfig>): Promise<LeagueSyncConfig>;
    triggerSync(): Promise<import("./interfaces").LeagueSyncResult>;
    getSyncStatus(): Promise<{
        nextRun: Date | null;
        isEnabled: boolean;
        intervalMinutes: number;
    }>;
    invalidateCache(): Promise<{
        success: boolean;
        message: string;
    }>;
    syncTeams(): Promise<import("./interfaces").TeamSyncResult>;
    syncTeamsByLeague(leagueExternalId: string, season?: string): Promise<import("./interfaces").TeamSyncResult>;
    getTeamsStats(): Promise<{
        total: number;
        byLeague: Record<string, number>;
    }>;
    invalidateTeamsCache(): Promise<{
        success: boolean;
        message: string;
    }>;
    syncFixtures(from?: string, to?: string): Promise<import("./interfaces").FixtureSyncResult>;
    syncFixturesByLeague(leagueExternalId: number, from?: string, to?: string): Promise<import("./interfaces").FixtureSyncResult>;
    getFixturesStats(): Promise<{
        total: number;
        byStatus: Record<string, number>;
    }>;
    invalidateFixturesCache(): Promise<{
        success: boolean;
        message: string;
    }>;
    syncUpcomingOdds(hours?: number): Promise<import("./interfaces").OddsSyncResult>;
    syncLiveOdds(): Promise<import("./interfaces").OddsSyncResult>;
    getOddsStats(): Promise<{
        total: number;
        byBetType: Record<string, number>;
    }>;
    invalidateOddsCache(): Promise<{
        success: boolean;
        message: string;
    }>;
    getOddsTable(query: QueryOddsDto): Promise<import("./interfaces").OddsTableResponse>;
    getLiveOddsTable(): Promise<import("./interfaces").OddsTableResponse>;
    getTodayOddsTable(): Promise<import("./interfaces").OddsTableResponse>;
    getFixtureOdds(id: number): Promise<import("./interfaces").OddsTableRow | null>;
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
}
