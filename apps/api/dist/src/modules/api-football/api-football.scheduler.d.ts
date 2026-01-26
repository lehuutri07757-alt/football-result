import { LeagueSyncService } from './league-sync.service';
import { TeamSyncService } from './team-sync.service';
import { FixtureSyncService } from './fixture-sync.service';
import { OddsSyncService } from './odds-sync.service';
export declare class ApiFootballScheduler {
    private readonly leagueSyncService;
    private readonly teamSyncService;
    private readonly fixtureSyncService;
    private readonly oddsSyncService;
    private readonly logger;
    constructor(leagueSyncService: LeagueSyncService, teamSyncService: TeamSyncService, fixtureSyncService: FixtureSyncService, oddsSyncService: OddsSyncService);
    handleLeagueSync(): Promise<void>;
    handleTeamSync(): Promise<void>;
    handleFixtureSync(): Promise<void>;
    handleUpcomingOddsSync(): Promise<void>;
    handleLiveOddsSync(): Promise<void>;
}
