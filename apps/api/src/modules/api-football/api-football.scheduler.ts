import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LeagueSyncService } from './league-sync.service';
import { TeamSyncService } from './team-sync.service';
import { FixtureSyncService } from './fixture-sync.service';
import { OddsSyncService } from './odds-sync.service';

@Injectable()
export class ApiFootballScheduler {
  private readonly logger = new Logger(ApiFootballScheduler.name);

  constructor(
    private readonly leagueSyncService: LeagueSyncService,
    private readonly teamSyncService: TeamSyncService,
    private readonly fixtureSyncService: FixtureSyncService,
    private readonly oddsSyncService: OddsSyncService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleLeagueSync() {
    this.logger.log('Running scheduled league sync...');
    try {
      const result = await this.leagueSyncService.syncLeagues();
      this.logger.log(`League sync completed: ${result.created} created, ${result.updated} updated`);
    } catch (error) {
      this.logger.error(`League sync failed: ${error}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async handleTeamSync() {
    this.logger.log('Running scheduled team sync...');
    try {
      const result = await this.teamSyncService.syncAllActiveLeagues();
      this.logger.log(`Team sync completed: ${result.created} created, ${result.updated} updated`);
    } catch (error) {
      this.logger.error(`Team sync failed: ${error}`);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleFixtureSync() {
    this.logger.log('Running scheduled fixture sync...');
    try {
      const today = new Date();
      const dateFrom = new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0];
      const dateTo = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const result = await this.fixtureSyncService.syncFixturesByDate(dateFrom, dateTo);
      this.logger.log(`Fixture sync completed: ${result.created} created, ${result.updated} updated`);
    } catch (error) {
      this.logger.error(`Fixture sync failed: ${error}`);
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleUpcomingOddsSync() {
    this.logger.log('Running scheduled upcoming odds sync...');
    try {
      const result = await this.oddsSyncService.syncOddsForUpcomingMatches(48);
      this.logger.log(`Upcoming odds sync completed: ${result.totalOdds} odds for ${result.totalMatches} matches`);
    } catch (error) {
      this.logger.error(`Upcoming odds sync failed: ${error}`);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleLiveOddsSync() {
    this.logger.log('Running scheduled live odds sync...');
    try {
      const result = await this.oddsSyncService.syncOddsForLiveMatches();
      this.logger.log(`Live odds sync completed: ${result.totalOdds} odds for ${result.totalMatches} matches`);
    } catch (error) {
      this.logger.error(`Live odds sync failed: ${error}`);
    }
  }
}
