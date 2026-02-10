import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { SyncJobService } from './sync-job.service';
import { SyncConfigService } from './sync-config.service';
import { SyncJobType, SyncJobPriority } from './interfaces';

@Injectable()
export class ApiFootballScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ApiFootballScheduler.name);

  private fixtureInterval: NodeJS.Timeout | null = null;
  private liveOddsInterval: NodeJS.Timeout | null = null;
  private upcomingOddsInterval: NodeJS.Timeout | null = null;
  private farOddsInterval: NodeJS.Timeout | null = null;
  private leagueInterval: NodeJS.Timeout | null = null;
  private teamInterval: NodeJS.Timeout | null = null;
  private standingsInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly syncJobService: SyncJobService,
    private readonly syncConfig: SyncConfigService,
  ) {}

  async onModuleInit() {
    setTimeout(() => this.setupSchedulers(), 5000);
  }

  onModuleDestroy() {
    this.clearAllIntervals();
  }

  private setupSchedulers(): void {
    this.clearAllIntervals();
    const config = this.syncConfig.getConfig();

    if (config.fixture.enabled) {
      const ms = config.fixture.intervalMinutes * 60 * 1000;
      this.fixtureInterval = setInterval(() => this.handleFixtureSync(), ms);
      this.logger.log(`Fixture sync scheduled every ${config.fixture.intervalMinutes} minutes`);
    }

    if (config.liveOdds.enabled) {
      const ms = config.liveOdds.intervalMinutes * 60 * 1000;
      this.liveOddsInterval = setInterval(() => this.handleLiveOddsSync(), ms);
      this.logger.log(`Live odds sync scheduled every ${config.liveOdds.intervalMinutes} minutes`);
    }

    if (config.upcomingOdds.enabled) {
      const ms = config.upcomingOdds.intervalMinutes * 60 * 1000;
      this.upcomingOddsInterval = setInterval(() => this.handleUpcomingOddsSync(), ms);
      this.logger.log(`Upcoming odds sync scheduled every ${config.upcomingOdds.intervalMinutes} minutes`);
    }

    if (config.farOdds.enabled) {
      const ms = config.farOdds.intervalMinutes * 60 * 1000;
      this.farOddsInterval = setInterval(() => this.handleFarOddsSync(), ms);
      this.logger.log(`Far odds sync scheduled every ${config.farOdds.intervalMinutes} minutes`);
    }

    if (config.league.enabled) {
      const ms = config.league.intervalMinutes * 60 * 1000;
      this.leagueInterval = setInterval(() => this.handleLeagueSync(), ms);
      this.logger.log(`League sync scheduled every ${config.league.intervalMinutes} minutes`);
    }

    if (config.team.enabled) {
      const ms = config.team.intervalMinutes * 60 * 1000;
      this.teamInterval = setInterval(() => this.handleTeamSync(), ms);
      this.logger.log(`Team sync scheduled every ${config.team.intervalMinutes} minutes`);
    }

    if (config.standings.enabled) {
      const ms = config.standings.intervalMinutes * 60 * 1000;
      this.standingsInterval = setInterval(() => this.handleStandingsSync(), ms);
      this.logger.log(`Standings sync scheduled every ${config.standings.intervalMinutes} minutes`);
    }

    const cleanupMs = 24 * 60 * 60 * 1000;
    this.cleanupInterval = setInterval(() => this.handleJobCleanup(), cleanupMs);
    this.logger.log('Job cleanup scheduled daily');
  }

  private clearAllIntervals(): void {
    const intervals = [
      this.fixtureInterval,
      this.liveOddsInterval,
      this.upcomingOddsInterval,
      this.farOddsInterval,
      this.leagueInterval,
      this.teamInterval,
      this.standingsInterval,
      this.cleanupInterval,
    ];

    intervals.forEach((interval) => {
      if (interval) clearInterval(interval);
    });

    this.fixtureInterval = null;
    this.liveOddsInterval = null;
    this.upcomingOddsInterval = null;
    this.farOddsInterval = null;
    this.leagueInterval = null;
    this.teamInterval = null;
    this.standingsInterval = null;
    this.cleanupInterval = null;
  }

  async reloadSchedulers(): Promise<void> {
    await this.syncConfig.loadConfig();
    this.setupSchedulers();
    this.logger.log('Schedulers reloaded with new config');
  }

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

  async handleFixtureSync(): Promise<void> {
    this.logger.log('Scheduling fixture sync job...');
    try {
      const config = this.syncConfig.fixtureConfig;
      const today = new Date();
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - config.pastDays);
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + config.futureDays);

      const dateFrom = pastDate.toISOString().split('T')[0];
      const dateTo = futureDate.toISOString().split('T')[0];

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

  async handleUpcomingOddsSync(): Promise<void> {
    this.logger.log('Scheduling upcoming odds sync job...');
    try {
      const config = this.syncConfig.upcomingOddsConfig;
      const jobId = await this.syncJobService.createJob({
        type: SyncJobType.odds_upcoming,
        params: { hoursAhead: config.hoursAhead },
        triggeredBy: 'scheduler',
      });
      this.logger.log(`Upcoming odds sync job scheduled: ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to schedule upcoming odds sync: ${error}`);
    }
  }

  async handleFarOddsSync(): Promise<void> {
    this.logger.log('Scheduling far odds sync job...');
    try {
      const config = this.syncConfig.farOddsConfig;
      const jobId = await this.syncJobService.createJob({
        type: SyncJobType.odds_far,
        params: { maxDaysAhead: config.maxDaysAhead },
        triggeredBy: 'scheduler',
      });
      this.logger.log(`Far odds sync job scheduled: ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to schedule far odds sync: ${error}`);
    }
  }

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

  async handleStandingsSync(): Promise<void> {
    this.logger.log('Scheduling standings sync job...');
    try {
      const jobId = await this.syncJobService.createJob({
        type: SyncJobType.standings,
        triggeredBy: 'scheduler',
      });
      this.logger.log(`Standings sync job scheduled: ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to schedule standings sync: ${error}`);
    }
  }

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
