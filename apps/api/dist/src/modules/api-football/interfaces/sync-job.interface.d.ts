export declare enum SyncJobType {
    league = "league",
    team = "team",
    fixture = "fixture",
    odds_upcoming = "odds_upcoming",
    odds_live = "odds_live",
    full_sync = "full_sync"
}
export declare enum SyncJobStatus {
    pending = "pending",
    processing = "processing",
    completed = "completed",
    failed = "failed",
    cancelled = "cancelled"
}
export declare enum SyncJobPriority {
    low = "low",
    normal = "normal",
    high = "high",
    critical = "critical"
}
export interface LeagueSyncParams {
    onlyCurrentSeason?: boolean;
    forceRefresh?: boolean;
}
export interface TeamSyncParams {
    leagueExternalId?: string;
    season?: string;
    syncAllActive?: boolean;
}
export interface FixtureSyncParams {
    dateFrom: string;
    dateTo: string;
    leagueExternalId?: number;
}
export interface OddsSyncParams {
    hoursAhead?: number;
    matchIds?: string[];
}
export interface LiveOddsSyncParams {
}
export interface FullSyncParams {
    syncLeagues?: boolean;
    syncTeams?: boolean;
    syncFixtures?: boolean;
    syncOdds?: boolean;
    dateFrom?: string;
    dateTo?: string;
}
export type SyncJobParams = LeagueSyncParams | TeamSyncParams | FixtureSyncParams | OddsSyncParams | LiveOddsSyncParams | FullSyncParams;
export interface BaseSyncResult {
    success: boolean;
    syncedAt: string;
    durationMs: number;
    errors: string[];
}
export interface LeagueSyncJobResult extends BaseSyncResult {
    totalFetched: number;
    created: number;
    updated: number;
}
export interface TeamSyncJobResult extends BaseSyncResult {
    totalFetched: number;
    created: number;
    updated: number;
    skipped: number;
}
export interface FixtureSyncJobResult extends BaseSyncResult {
    totalFetched: number;
    created: number;
    updated: number;
    skipped: number;
}
export interface OddsSyncJobResult extends BaseSyncResult {
    totalMatches: number;
    totalOdds: number;
    created: number;
    updated: number;
}
export interface FullSyncJobResult extends BaseSyncResult {
    leagues?: LeagueSyncJobResult;
    teams?: TeamSyncJobResult;
    fixtures?: FixtureSyncJobResult;
    odds?: OddsSyncJobResult;
}
export type SyncJobResult = LeagueSyncJobResult | TeamSyncJobResult | FixtureSyncJobResult | OddsSyncJobResult | FullSyncJobResult;
export interface CreateSyncJobDto {
    type: SyncJobType;
    params?: SyncJobParams;
    priority?: SyncJobPriority;
    scheduledAt?: Date;
    parentJobId?: string;
    triggeredBy?: 'scheduler' | 'manual' | 'api';
}
export interface UpdateSyncJobDto {
    status?: SyncJobStatus;
    progress?: number;
    totalItems?: number;
    processedItems?: number;
    result?: SyncJobResult;
    errorMessage?: string;
    errorStack?: string;
    startedAt?: Date;
    completedAt?: Date;
    bullJobId?: string;
}
export interface SyncJobFilter {
    type?: SyncJobType;
    status?: SyncJobStatus | SyncJobStatus[];
    priority?: SyncJobPriority;
    triggeredBy?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
}
export interface SyncJobStats {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    avgDurationMs: number;
    successRate: number;
    recentErrors: Array<{
        id: string;
        type: SyncJobType;
        errorMessage: string;
        createdAt: Date;
    }>;
}
export declare const SYNC_QUEUE_NAME = "sync-jobs";
export declare const SYNC_JOB_OPTIONS: Record<SyncJobType, {
    attempts: number;
    backoff?: {
        type: string;
        delay: number;
    };
    removeOnComplete: number;
    removeOnFail: number;
    priority?: number;
}>;
