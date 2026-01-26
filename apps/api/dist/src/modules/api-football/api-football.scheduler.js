"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ApiFootballScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiFootballScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const league_sync_service_1 = require("./league-sync.service");
const team_sync_service_1 = require("./team-sync.service");
const fixture_sync_service_1 = require("./fixture-sync.service");
const odds_sync_service_1 = require("./odds-sync.service");
let ApiFootballScheduler = ApiFootballScheduler_1 = class ApiFootballScheduler {
    constructor(leagueSyncService, teamSyncService, fixtureSyncService, oddsSyncService) {
        this.leagueSyncService = leagueSyncService;
        this.teamSyncService = teamSyncService;
        this.fixtureSyncService = fixtureSyncService;
        this.oddsSyncService = oddsSyncService;
        this.logger = new common_1.Logger(ApiFootballScheduler_1.name);
    }
    async handleLeagueSync() {
        this.logger.log('Running scheduled league sync...');
        try {
            const result = await this.leagueSyncService.syncLeagues();
            this.logger.log(`League sync completed: ${result.created} created, ${result.updated} updated`);
        }
        catch (error) {
            this.logger.error(`League sync failed: ${error}`);
        }
    }
    async handleTeamSync() {
        this.logger.log('Running scheduled team sync...');
        try {
            const result = await this.teamSyncService.syncAllActiveLeagues();
            this.logger.log(`Team sync completed: ${result.created} created, ${result.updated} updated`);
        }
        catch (error) {
            this.logger.error(`Team sync failed: ${error}`);
        }
    }
    async handleFixtureSync() {
        this.logger.log('Running scheduled fixture sync...');
        try {
            const today = new Date();
            const dateFrom = new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0];
            const dateTo = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const result = await this.fixtureSyncService.syncFixturesByDate(dateFrom, dateTo);
            this.logger.log(`Fixture sync completed: ${result.created} created, ${result.updated} updated`);
        }
        catch (error) {
            this.logger.error(`Fixture sync failed: ${error}`);
        }
    }
    async handleUpcomingOddsSync() {
        this.logger.log('Running scheduled upcoming odds sync...');
        try {
            const result = await this.oddsSyncService.syncOddsForUpcomingMatches(48);
            this.logger.log(`Upcoming odds sync completed: ${result.totalOdds} odds for ${result.totalMatches} matches`);
        }
        catch (error) {
            this.logger.error(`Upcoming odds sync failed: ${error}`);
        }
    }
    async handleLiveOddsSync() {
        this.logger.log('Running scheduled live odds sync...');
        try {
            const result = await this.oddsSyncService.syncOddsForLiveMatches();
            this.logger.log(`Live odds sync completed: ${result.totalOdds} odds for ${result.totalMatches} matches`);
        }
        catch (error) {
            this.logger.error(`Live odds sync failed: ${error}`);
        }
    }
};
exports.ApiFootballScheduler = ApiFootballScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_3AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballScheduler.prototype, "handleLeagueSync", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_4AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballScheduler.prototype, "handleTeamSync", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballScheduler.prototype, "handleFixtureSync", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballScheduler.prototype, "handleUpcomingOddsSync", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballScheduler.prototype, "handleLiveOddsSync", null);
exports.ApiFootballScheduler = ApiFootballScheduler = ApiFootballScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [league_sync_service_1.LeagueSyncService,
        team_sync_service_1.TeamSyncService,
        fixture_sync_service_1.FixtureSyncService,
        odds_sync_service_1.OddsSyncService])
], ApiFootballScheduler);
//# sourceMappingURL=api-football.scheduler.js.map