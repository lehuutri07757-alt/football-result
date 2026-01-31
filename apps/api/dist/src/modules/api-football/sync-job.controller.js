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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncJobController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const sync_job_service_1 = require("./sync-job.service");
const interfaces_1 = require("./interfaces");
let SyncJobController = class SyncJobController {
    constructor(syncJobService) {
        this.syncJobService = syncJobService;
    }
    async createJob(dto) {
        const jobId = await this.syncJobService.createJob(dto);
        return { jobId };
    }
    async triggerLeagueSync() {
        const jobId = await this.syncJobService.createJob({
            type: interfaces_1.SyncJobType.league,
            triggeredBy: 'api',
        });
        return { jobId };
    }
    async triggerTeamSync() {
        const jobId = await this.syncJobService.createJob({
            type: interfaces_1.SyncJobType.team,
            params: { syncAllActive: true },
            triggeredBy: 'api',
        });
        return { jobId };
    }
    async triggerTeamSyncForLeague(leagueExternalId, season) {
        const jobId = await this.syncJobService.createJob({
            type: interfaces_1.SyncJobType.team,
            params: { leagueExternalId, season },
            triggeredBy: 'api',
        });
        return { jobId };
    }
    async triggerFixtureSync(dateFrom, dateTo, leagueExternalId) {
        const jobId = await this.syncJobService.createJob({
            type: interfaces_1.SyncJobType.fixture,
            params: {
                dateFrom,
                dateTo,
                leagueExternalId: leagueExternalId ? parseInt(leagueExternalId, 10) : undefined,
            },
            triggeredBy: 'api',
        });
        return { jobId };
    }
    async triggerUpcomingOddsSync(hoursAhead) {
        const jobId = await this.syncJobService.createJob({
            type: interfaces_1.SyncJobType.odds_upcoming,
            params: { hoursAhead: hoursAhead ? parseInt(hoursAhead, 10) : 48 },
            triggeredBy: 'api',
        });
        return { jobId };
    }
    async triggerLiveOddsSync() {
        const jobId = await this.syncJobService.createJob({
            type: interfaces_1.SyncJobType.odds_live,
            priority: interfaces_1.SyncJobPriority.high,
            triggeredBy: 'api',
        });
        return { jobId };
    }
    async triggerFullSync(params) {
        const jobId = await this.syncJobService.createJob({
            type: interfaces_1.SyncJobType.full_sync,
            params: params || {},
            priority: interfaces_1.SyncJobPriority.low,
            triggeredBy: 'api',
        });
        return { jobId };
    }
    async getJobs(type, status, limit, offset) {
        return this.syncJobService.getJobs({
            type,
            status,
            limit: limit ? parseInt(limit, 10) : 50,
            offset: offset ? parseInt(offset, 10) : 0,
        });
    }
    async getStats() {
        return this.syncJobService.getStats();
    }
    async getQueueStatus() {
        return this.syncJobService.getQueueStatus();
    }
    async getJob(id) {
        return this.syncJobService.getJob(id);
    }
    async cancelJob(id) {
        await this.syncJobService.cancelJob(id);
    }
    async forceReleaseJob(id) {
        const success = await this.syncJobService.forceReleaseJob(id);
        return { success };
    }
    async forceReleaseByType(type) {
        const released = await this.syncJobService.forceReleaseByType(type);
        return { released };
    }
    async retryJob(id) {
        const jobId = await this.syncJobService.retryJob(id);
        return { jobId };
    }
    async cleanupOldJobs(olderThanDays) {
        const deleted = await this.syncJobService.cleanupOldJobs(olderThanDays ? parseInt(olderThanDays, 10) : 7);
        return { deleted };
    }
};
exports.SyncJobController = SyncJobController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new sync job' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Job created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncJobController.prototype, "createJob", null);
__decorate([
    (0, common_1.Post)('league'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger league sync' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncJobController.prototype, "triggerLeagueSync", null);
__decorate([
    (0, common_1.Post)('team'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger team sync for all active leagues' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncJobController.prototype, "triggerTeamSync", null);
__decorate([
    (0, common_1.Post)('team/:leagueExternalId'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger team sync for specific league' }),
    __param(0, (0, common_1.Param)('leagueExternalId')),
    __param(1, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SyncJobController.prototype, "triggerTeamSyncForLeague", null);
__decorate([
    (0, common_1.Post)('fixture'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger fixture sync' }),
    (0, swagger_1.ApiQuery)({ name: 'dateFrom', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'dateTo', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'leagueExternalId', required: false }),
    __param(0, (0, common_1.Query)('dateFrom')),
    __param(1, (0, common_1.Query)('dateTo')),
    __param(2, (0, common_1.Query)('leagueExternalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SyncJobController.prototype, "triggerFixtureSync", null);
__decorate([
    (0, common_1.Post)('odds/upcoming'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger upcoming odds sync' }),
    (0, swagger_1.ApiQuery)({ name: 'hoursAhead', required: false, type: Number }),
    __param(0, (0, common_1.Query)('hoursAhead')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SyncJobController.prototype, "triggerUpcomingOddsSync", null);
__decorate([
    (0, common_1.Post)('odds/live'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger live odds sync' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncJobController.prototype, "triggerLiveOddsSync", null);
__decorate([
    (0, common_1.Post)('full'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger full sync (leagues, teams, fixtures, odds)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncJobController.prototype, "triggerFullSync", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all sync jobs' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, enum: interfaces_1.SyncJobType }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: interfaces_1.SyncJobStatus }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, type: Number }),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], SyncJobController.prototype, "getJobs", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get sync job statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncJobController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('queue-status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Bull queue status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncJobController.prototype, "getQueueStatus", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get sync job by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SyncJobController.prototype, "getJob", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a pending sync job' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SyncJobController.prototype, "cancelJob", null);
__decorate([
    (0, common_1.Post)(':id/force-release'),
    (0, swagger_1.ApiOperation)({ summary: 'Force release a stuck pending/processing job' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Job released successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SyncJobController.prototype, "forceReleaseJob", null);
__decorate([
    (0, common_1.Post)('force-release/type/:type'),
    (0, swagger_1.ApiOperation)({ summary: 'Force release all stuck jobs of a specific type' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Jobs released successfully' }),
    __param(0, (0, common_1.Param)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SyncJobController.prototype, "forceReleaseByType", null);
__decorate([
    (0, common_1.Post)(':id/retry'),
    (0, swagger_1.ApiOperation)({ summary: 'Retry a failed sync job' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SyncJobController.prototype, "retryJob", null);
__decorate([
    (0, common_1.Delete)('cleanup/old'),
    (0, swagger_1.ApiOperation)({ summary: 'Cleanup old completed/failed jobs' }),
    (0, swagger_1.ApiQuery)({ name: 'olderThanDays', required: false, type: Number }),
    __param(0, (0, common_1.Query)('olderThanDays')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SyncJobController.prototype, "cleanupOldJobs", null);
exports.SyncJobController = SyncJobController = __decorate([
    (0, swagger_1.ApiTags)('Sync Jobs'),
    (0, common_1.Controller)('sync-jobs'),
    __metadata("design:paramtypes", [sync_job_service_1.SyncJobService])
], SyncJobController);
//# sourceMappingURL=sync-job.controller.js.map