import { Job } from 'bull';
import { LeagueSyncService } from './league-sync.service';
import { TeamSyncService } from './team-sync.service';
import { FixtureSyncService } from './fixture-sync.service';
import { OddsSyncService } from './odds-sync.service';
import { SyncJobService } from './sync-job.service';
import { SyncJobType, SyncJobResult } from './interfaces';
interface SyncJobData {
    syncJobId: string;
    type: SyncJobType;
    params: Record<string, unknown>;
}
export declare class SyncJobProcessor {
    private readonly syncJobService;
    private readonly leagueSyncService;
    private readonly teamSyncService;
    private readonly fixtureSyncService;
    private readonly oddsSyncService;
    private readonly logger;
    constructor(syncJobService: SyncJobService, leagueSyncService: LeagueSyncService, teamSyncService: TeamSyncService, fixtureSyncService: FixtureSyncService, oddsSyncService: OddsSyncService);
    processLeagueSync(job: Job<SyncJobData>): Promise<SyncJobResult>;
    processTeamSync(job: Job<SyncJobData>): Promise<SyncJobResult>;
    processFixtureSync(job: Job<SyncJobData>): Promise<SyncJobResult>;
    processUpcomingOddsSync(job: Job<SyncJobData>): Promise<SyncJobResult>;
    processLiveOddsSync(job: Job<SyncJobData>): Promise<SyncJobResult>;
    processFullSync(job: Job<SyncJobData>): Promise<SyncJobResult>;
    onCompleted(job: Job<SyncJobData>, result: SyncJobResult): Promise<void>;
    onFailed(job: Job<SyncJobData>, error: Error): Promise<void>;
    onStalled(job: Job<SyncJobData>): Promise<void>;
}
export {};
