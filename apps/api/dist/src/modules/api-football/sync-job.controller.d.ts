import { SyncJobService } from './sync-job.service';
import { SyncJobType, SyncJobStatus, CreateSyncJobDto } from './interfaces';
export declare class SyncJobController {
    private readonly syncJobService;
    constructor(syncJobService: SyncJobService);
    createJob(dto: CreateSyncJobDto): Promise<{
        jobId: string;
    }>;
    triggerLeagueSync(): Promise<{
        jobId: string;
    }>;
    triggerTeamSync(): Promise<{
        jobId: string;
    }>;
    triggerTeamSyncForLeague(leagueExternalId: string, season?: string): Promise<{
        jobId: string;
    }>;
    triggerFixtureSync(dateFrom?: string, dateTo?: string, leagueExternalId?: string): Promise<{
        jobId: string;
    }>;
    triggerUpcomingOddsSync(hoursAhead?: string): Promise<{
        jobId: string;
    }>;
    triggerLiveOddsSync(): Promise<{
        jobId: string;
    }>;
    triggerFullSync(params?: {
        syncLeagues?: boolean;
        syncTeams?: boolean;
        syncFixtures?: boolean;
        syncOdds?: boolean;
    }): Promise<{
        jobId: string;
    }>;
    getJobs(type?: SyncJobType, status?: SyncJobStatus, limit?: string, offset?: string): Promise<{
        params: import("@prisma/client/runtime/library").JsonValue;
        type: import("@prisma/client").$Enums.SyncJobType;
        status: import("@prisma/client").$Enums.SyncJobStatus;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        result: import("@prisma/client/runtime/library").JsonValue | null;
        priority: import("@prisma/client").$Enums.SyncJobPriority;
        errorMessage: string | null;
        progress: number;
        totalItems: number | null;
        processedItems: number;
        errorStack: string | null;
        retryCount: number;
        maxRetries: number;
        scheduledAt: Date | null;
        startedAt: Date | null;
        completedAt: Date | null;
        parentJobId: string | null;
        triggeredBy: string | null;
        bullJobId: string | null;
    }[]>;
    getStats(): Promise<import("./interfaces").SyncJobStats>;
    getQueueStatus(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
    }>;
    getJob(id: string): Promise<{
        params: import("@prisma/client/runtime/library").JsonValue;
        type: import("@prisma/client").$Enums.SyncJobType;
        status: import("@prisma/client").$Enums.SyncJobStatus;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        result: import("@prisma/client/runtime/library").JsonValue | null;
        priority: import("@prisma/client").$Enums.SyncJobPriority;
        errorMessage: string | null;
        progress: number;
        totalItems: number | null;
        processedItems: number;
        errorStack: string | null;
        retryCount: number;
        maxRetries: number;
        scheduledAt: Date | null;
        startedAt: Date | null;
        completedAt: Date | null;
        parentJobId: string | null;
        triggeredBy: string | null;
        bullJobId: string | null;
    } | null>;
    cancelJob(id: string): Promise<void>;
    forceReleaseJob(id: string): Promise<{
        success: boolean;
    }>;
    forceReleaseByType(type: SyncJobType): Promise<{
        released: number;
    }>;
    retryJob(id: string): Promise<{
        jobId: string | null;
    }>;
    cleanupOldJobs(olderThanDays?: string): Promise<{
        deleted: number;
    }>;
}
