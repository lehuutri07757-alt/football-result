import { SyncJobService } from './sync-job.service';
export declare class ApiFootballScheduler {
    private readonly syncJobService;
    private readonly logger;
    constructor(syncJobService: SyncJobService);
    handleLeagueSync(): Promise<void>;
    handleTeamSync(): Promise<void>;
    handleFixtureSync(): Promise<void>;
    handleUpcomingOddsSync(): Promise<void>;
    handleLiveOddsSync(): Promise<void>;
    handleJobCleanup(): Promise<void>;
}
