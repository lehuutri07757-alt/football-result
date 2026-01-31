import { Processor, Process, OnQueueFailed, OnQueueCompleted, OnQueueStalled } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { LeagueSyncService } from './league-sync.service';
import { TeamSyncService } from './team-sync.service';
import { FixtureSyncService } from './fixture-sync.service';
import { OddsSyncService } from './odds-sync.service';
import { SyncJobService } from './sync-job.service';
import {
  SyncJobType,
  SYNC_QUEUE_NAME,
  TeamSyncParams,
  FixtureSyncParams,
  OddsSyncParams,
  FullSyncParams,
  SyncJobResult,
} from './interfaces';

interface SyncJobData {
  syncJobId: string;
  type: SyncJobType;
  params: Record<string, unknown>;
}

@Processor(SYNC_QUEUE_NAME)
export class SyncJobProcessor {
  private readonly logger = new Logger(SyncJobProcessor.name);

  constructor(
    private readonly syncJobService: SyncJobService,
    private readonly leagueSyncService: LeagueSyncService,
    private readonly teamSyncService: TeamSyncService,
    private readonly fixtureSyncService: FixtureSyncService,
    private readonly oddsSyncService: OddsSyncService,
  ) {}

  @Process(SyncJobType.league)
  async processLeagueSync(job: Job<SyncJobData>): Promise<SyncJobResult> {
    const { syncJobId } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing league sync job: ${syncJobId}`);
    await this.syncJobService.markAsProcessing(syncJobId);

    const result = await this.leagueSyncService.syncLeagues();

    return {
      success: result.errors.length === 0,
      syncedAt: result.syncedAt,
      durationMs: Date.now() - startTime,
      errors: result.errors,
      totalFetched: result.totalFetched,
      created: result.created,
      updated: result.updated,
    };
  }

  @Process(SyncJobType.team)
  async processTeamSync(job: Job<SyncJobData>): Promise<SyncJobResult> {
    const { syncJobId, params } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing team sync job: ${syncJobId}`);
    await this.syncJobService.markAsProcessing(syncJobId);

    const teamParams = params as TeamSyncParams;
    
    const updateProgress = async (progress: number, processedItems: number, totalItems: number) => {
      await this.syncJobService.updateJob(syncJobId, {
        progress,
        totalItems,
        processedItems,
      });
      await job.progress(progress);
    };

    let result;
    if (teamParams.leagueExternalId) {
      result = await this.teamSyncService.syncTeamsByLeague(
        teamParams.leagueExternalId,
        teamParams.season,
      );
    } else {
      result = await this.teamSyncService.syncAllActiveLeagues(updateProgress);
    }

    return {
      success: result.errors.length === 0,
      syncedAt: result.syncedAt,
      durationMs: Date.now() - startTime,
      errors: result.errors,
      totalFetched: result.totalFetched,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
    };
  }

  @Process(SyncJobType.fixture)
  async processFixtureSync(job: Job<SyncJobData>): Promise<SyncJobResult> {
    const { syncJobId, params } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing fixture sync job: ${syncJobId}`);
    await this.syncJobService.markAsProcessing(syncJobId);

    const fixtureParams = params as unknown as FixtureSyncParams;
    const today = new Date();
    const dateFrom = fixtureParams.dateFrom || 
      new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0];
    const dateTo = fixtureParams.dateTo || 
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const updateProgress = async (progress: number, processedItems: number, totalItems: number) => {
      await this.syncJobService.updateJob(syncJobId, {
        progress,
        totalItems,
        processedItems,
      });
      await job.progress(progress);
    };

    let result;
    if (fixtureParams.leagueExternalId) {
      result = await this.fixtureSyncService.syncFixturesForLeague(
        fixtureParams.leagueExternalId,
        dateFrom,
        dateTo,
      );
    } else {
      result = await this.fixtureSyncService.syncFixturesByDate(dateFrom, dateTo, updateProgress);
    }

    return {
      success: result.errors.length === 0,
      syncedAt: result.syncedAt,
      durationMs: Date.now() - startTime,
      errors: result.errors,
      totalFetched: result.totalFetched,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
    };
  }

  @Process(SyncJobType.odds_upcoming)
  async processUpcomingOddsSync(job: Job<SyncJobData>): Promise<SyncJobResult> {
    const { syncJobId, params } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing upcoming odds sync job: ${syncJobId}`);
    await this.syncJobService.markAsProcessing(syncJobId);

    const oddsParams = params as OddsSyncParams;
    
    const updateProgress = async (progress: number, processedItems: number, totalItems: number) => {
      await this.syncJobService.updateJob(syncJobId, {
        progress,
        totalItems,
        processedItems,
      });
      await job.progress(progress);
    };

    const result = await this.oddsSyncService.syncOddsForUpcomingMatches(
      oddsParams.hoursAhead || 48,
      updateProgress,
    );

    return {
      success: result.errors.length === 0,
      syncedAt: result.syncedAt,
      durationMs: Date.now() - startTime,
      errors: result.errors,
      totalMatches: result.totalMatches,
      totalOdds: result.totalOdds,
      created: result.created,
      updated: result.updated,
    };
  }

  @Process(SyncJobType.odds_live)
  async processLiveOddsSync(job: Job<SyncJobData>): Promise<SyncJobResult> {
    const { syncJobId } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing live odds sync job: ${syncJobId}`);
    await this.syncJobService.markAsProcessing(syncJobId);

    const updateProgress = async (progress: number, processedItems: number, totalItems: number) => {
      await this.syncJobService.updateJob(syncJobId, {
        progress,
        totalItems,
        processedItems,
      });
      await job.progress(progress);
    };

    const result = await this.oddsSyncService.syncOddsForLiveMatches(updateProgress);

    return {
      success: result.errors.length === 0,
      syncedAt: result.syncedAt,
      durationMs: Date.now() - startTime,
      errors: result.errors,
      totalMatches: result.totalMatches,
      totalOdds: result.totalOdds,
      created: result.created,
      updated: result.updated,
    };
  }

  @Process(SyncJobType.full_sync)
  async processFullSync(job: Job<SyncJobData>): Promise<SyncJobResult> {
    const { syncJobId, params } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing full sync job: ${syncJobId}`);
    await this.syncJobService.markAsProcessing(syncJobId);

    const fullParams = params as FullSyncParams;
    const result: any = {
      success: true,
      syncedAt: new Date().toISOString(),
      durationMs: 0,
      errors: [] as string[],
    };

    if (fullParams.syncLeagues !== false) {
      const leagueResult = await this.leagueSyncService.syncLeagues();
      result.leagues = leagueResult;
      result.errors.push(...leagueResult.errors);
    }

    if (fullParams.syncTeams !== false) {
      const teamResult = await this.teamSyncService.syncAllActiveLeagues();
      result.teams = teamResult;
      result.errors.push(...teamResult.errors);
    }

    if (fullParams.syncFixtures !== false) {
      const today = new Date();
      const dateFrom = fullParams.dateFrom || 
        new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0];
      const dateTo = fullParams.dateTo || 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const fixtureResult = await this.fixtureSyncService.syncFixturesByDate(dateFrom, dateTo);
      result.fixtures = fixtureResult;
      result.errors.push(...fixtureResult.errors);
    }

    if (fullParams.syncOdds !== false) {
      const oddsResult = await this.oddsSyncService.syncOddsForUpcomingMatches(48);
      result.odds = oddsResult;
      result.errors.push(...oddsResult.errors);
    }

    result.success = result.errors.length === 0;
    result.durationMs = Date.now() - startTime;

    return result;
  }

  @OnQueueCompleted()
  async onCompleted(job: Job<SyncJobData>, result: SyncJobResult): Promise<void> {
    this.logger.log(`Job ${job.data.syncJobId} completed successfully`);
    await this.syncJobService.markAsCompleted(job.data.syncJobId, result);
  }

  @OnQueueFailed()
  async onFailed(job: Job<SyncJobData>, error: Error): Promise<void> {
    this.logger.error(`Job ${job.data.syncJobId} failed: ${error.message}`);
    await this.syncJobService.markAsFailed(job.data.syncJobId, error);
  }

  @OnQueueStalled()
  async onStalled(job: Job<SyncJobData>): Promise<void> {
    this.logger.warn(`Job ${job.data.syncJobId} stalled - will be reprocessed`);
  }
}
