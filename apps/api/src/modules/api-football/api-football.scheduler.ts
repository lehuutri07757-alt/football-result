import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncJobService } from './sync-job.service';
import { SyncJobType, SyncJobPriority } from './interfaces';

@Injectable()
export class ApiFootballScheduler {
  private readonly logger = new Logger(ApiFootballScheduler.name);

  constructor(private readonly syncJobService: SyncJobService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleLeagueSync(): Promise<void> {
    this.logger.log('Scheduling league sync job...');
    try {
      const jobId = await this.syncJobService.createJob({
        type: SyncJobType.league,
        triggeredBy: 'scheduler',
      });
      this.logger.log(`League sync job scheduled: ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to schedule league sync: ${error}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async handleTeamSync(): Promise<void> {
    this.logger.log('Scheduling team sync job...');
    try {
      const jobId = await this.syncJobService.createJob({
        type: SyncJobType.team,
        params: { syncAllActive: true },
        triggeredBy: 'scheduler',
      });
      this.logger.log(`Team sync job scheduled: ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to schedule team sync: ${error}`);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleFixtureSync(): Promise<void> {
    this.logger.log('Scheduling fixture sync job...');
    try {
      const today = new Date();
      const dateFrom = new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0];
      const dateTo = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const jobId = await this.syncJobService.createJob({
        type: SyncJobType.fixture,
        params: { dateFrom, dateTo },
        triggeredBy: 'scheduler',
      });
      this.logger.log(`Fixture sync job scheduled: ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to schedule fixture sync: ${error}`);
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleUpcomingOddsSync(): Promise<void> {
    this.logger.log('Scheduling upcoming odds sync job...');
    try {
      const jobId = await this.syncJobService.createJob({
        type: SyncJobType.odds_upcoming,
        params: { hoursAhead: 48 },
        triggeredBy: 'scheduler',
      });
      this.logger.log(`Upcoming odds sync job scheduled: ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to schedule upcoming odds sync: ${error}`);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleLiveOddsSync(): Promise<void> {
    this.logger.log('Scheduling live odds sync job...');
    try {
      const jobId = await this.syncJobService.createJob({
        type: SyncJobType.odds_live,
        priority: SyncJobPriority.high,
        triggeredBy: 'scheduler',
      });
      this.logger.log(`Live odds sync job scheduled: ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to schedule live odds sync: ${error}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleJobCleanup(): Promise<void> {
    this.logger.log('Cleaning up old sync jobs...');
    try {
      const deleted = await this.syncJobService.cleanupOldJobs(7);
      this.logger.log(`Cleaned up ${deleted} old sync jobs`);
    } catch (error) {
      this.logger.error(`Failed to cleanup old jobs: ${error}`);
    }
  }
}
