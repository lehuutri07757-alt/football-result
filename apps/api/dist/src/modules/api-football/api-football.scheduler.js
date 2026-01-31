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
const sync_job_service_1 = require("./sync-job.service");
const interfaces_1 = require("./interfaces");
let ApiFootballScheduler = ApiFootballScheduler_1 = class ApiFootballScheduler {
    constructor(syncJobService) {
        this.syncJobService = syncJobService;
        this.logger = new common_1.Logger(ApiFootballScheduler_1.name);
    }
    async handleLeagueSync() {
        this.logger.log('Scheduling league sync job...');
        try {
            const jobId = await this.syncJobService.createJob({
                type: interfaces_1.SyncJobType.league,
                triggeredBy: 'scheduler',
            });
            this.logger.log(`League sync job scheduled: ${jobId}`);
        }
        catch (error) {
            this.logger.error(`Failed to schedule league sync: ${error}`);
        }
    }
    async handleTeamSync() {
        this.logger.log('Scheduling team sync job...');
        try {
            const jobId = await this.syncJobService.createJob({
                type: interfaces_1.SyncJobType.team,
                params: { syncAllActive: true },
                triggeredBy: 'scheduler',
            });
            this.logger.log(`Team sync job scheduled: ${jobId}`);
        }
        catch (error) {
            this.logger.error(`Failed to schedule team sync: ${error}`);
        }
    }
    async handleFixtureSync() {
        this.logger.log('Scheduling fixture sync job...');
        try {
            const today = new Date();
            const dateFrom = new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0];
            const dateTo = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const jobId = await this.syncJobService.createJob({
                type: interfaces_1.SyncJobType.fixture,
                params: { dateFrom, dateTo },
                triggeredBy: 'scheduler',
            });
            this.logger.log(`Fixture sync job scheduled: ${jobId}`);
        }
        catch (error) {
            this.logger.error(`Failed to schedule fixture sync: ${error}`);
        }
    }
    async handleUpcomingOddsSync() {
        this.logger.log('Scheduling upcoming odds sync job...');
        try {
            const jobId = await this.syncJobService.createJob({
                type: interfaces_1.SyncJobType.odds_upcoming,
                params: { hoursAhead: 48 },
                triggeredBy: 'scheduler',
            });
            this.logger.log(`Upcoming odds sync job scheduled: ${jobId}`);
        }
        catch (error) {
            this.logger.error(`Failed to schedule upcoming odds sync: ${error}`);
        }
    }
    async handleLiveOddsSync() {
        this.logger.log('Scheduling live odds sync job...');
        try {
            const jobId = await this.syncJobService.createJob({
                type: interfaces_1.SyncJobType.odds_live,
                priority: interfaces_1.SyncJobPriority.high,
                triggeredBy: 'scheduler',
            });
            this.logger.log(`Live odds sync job scheduled: ${jobId}`);
        }
        catch (error) {
            this.logger.error(`Failed to schedule live odds sync: ${error}`);
        }
    }
    async handleJobCleanup() {
        this.logger.log('Cleaning up old sync jobs...');
        try {
            const deleted = await this.syncJobService.cleanupOldJobs(7);
            this.logger.log(`Cleaned up ${deleted} old sync jobs`);
        }
        catch (error) {
            this.logger.error(`Failed to cleanup old jobs: ${error}`);
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
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballScheduler.prototype, "handleJobCleanup", null);
exports.ApiFootballScheduler = ApiFootballScheduler = ApiFootballScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sync_job_service_1.SyncJobService])
], ApiFootballScheduler);
//# sourceMappingURL=api-football.scheduler.js.map