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
var SyncJobProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncJobProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const league_sync_service_1 = require("./league-sync.service");
const team_sync_service_1 = require("./team-sync.service");
const fixture_sync_service_1 = require("./fixture-sync.service");
const odds_sync_service_1 = require("./odds-sync.service");
const sync_job_service_1 = require("./sync-job.service");
const interfaces_1 = require("./interfaces");
let SyncJobProcessor = SyncJobProcessor_1 = class SyncJobProcessor {
    constructor(syncJobService, leagueSyncService, teamSyncService, fixtureSyncService, oddsSyncService) {
        this.syncJobService = syncJobService;
        this.leagueSyncService = leagueSyncService;
        this.teamSyncService = teamSyncService;
        this.fixtureSyncService = fixtureSyncService;
        this.oddsSyncService = oddsSyncService;
        this.logger = new common_1.Logger(SyncJobProcessor_1.name);
    }
    async processLeagueSync(job) {
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
    async processTeamSync(job) {
        const { syncJobId, params } = job.data;
        const startTime = Date.now();
        this.logger.log(`Processing team sync job: ${syncJobId}`);
        await this.syncJobService.markAsProcessing(syncJobId);
        const teamParams = params;
        const updateProgress = async (progress, processedItems, totalItems) => {
            await this.syncJobService.updateJob(syncJobId, {
                progress,
                totalItems,
                processedItems,
            });
            await job.progress(progress);
        };
        let result;
        if (teamParams.leagueExternalId) {
            result = await this.teamSyncService.syncTeamsByLeague(teamParams.leagueExternalId, teamParams.season);
        }
        else {
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
    async processFixtureSync(job) {
        const { syncJobId, params } = job.data;
        const startTime = Date.now();
        this.logger.log(`Processing fixture sync job: ${syncJobId}`);
        await this.syncJobService.markAsProcessing(syncJobId);
        const fixtureParams = params;
        const today = new Date();
        const dateFrom = fixtureParams.dateFrom ||
            new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0];
        const dateTo = fixtureParams.dateTo ||
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const updateProgress = async (progress, processedItems, totalItems) => {
            await this.syncJobService.updateJob(syncJobId, {
                progress,
                totalItems,
                processedItems,
            });
            await job.progress(progress);
        };
        let result;
        if (fixtureParams.leagueExternalId) {
            result = await this.fixtureSyncService.syncFixturesForLeague(fixtureParams.leagueExternalId, dateFrom, dateTo);
        }
        else {
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
    async processUpcomingOddsSync(job) {
        const { syncJobId, params } = job.data;
        const startTime = Date.now();
        this.logger.log(`Processing upcoming odds sync job: ${syncJobId}`);
        await this.syncJobService.markAsProcessing(syncJobId);
        const oddsParams = params;
        const updateProgress = async (progress, processedItems, totalItems) => {
            await this.syncJobService.updateJob(syncJobId, {
                progress,
                totalItems,
                processedItems,
            });
            await job.progress(progress);
        };
        const result = await this.oddsSyncService.syncOddsForUpcomingMatches(oddsParams.hoursAhead || 48, updateProgress);
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
    async processLiveOddsSync(job) {
        const { syncJobId } = job.data;
        const startTime = Date.now();
        this.logger.log(`Processing live odds sync job: ${syncJobId}`);
        await this.syncJobService.markAsProcessing(syncJobId);
        const updateProgress = async (progress, processedItems, totalItems) => {
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
    async processFullSync(job) {
        const { syncJobId, params } = job.data;
        const startTime = Date.now();
        this.logger.log(`Processing full sync job: ${syncJobId}`);
        await this.syncJobService.markAsProcessing(syncJobId);
        const fullParams = params;
        const result = {
            success: true,
            syncedAt: new Date().toISOString(),
            durationMs: 0,
            errors: [],
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
    async onCompleted(job, result) {
        this.logger.log(`Job ${job.data.syncJobId} completed successfully`);
        await this.syncJobService.markAsCompleted(job.data.syncJobId, result);
    }
    async onFailed(job, error) {
        this.logger.error(`Job ${job.data.syncJobId} failed: ${error.message}`);
        await this.syncJobService.markAsFailed(job.data.syncJobId, error);
    }
    async onStalled(job) {
        this.logger.warn(`Job ${job.data.syncJobId} stalled - will be reprocessed`);
    }
};
exports.SyncJobProcessor = SyncJobProcessor;
__decorate([
    (0, bull_1.Process)(interfaces_1.SyncJobType.league),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncJobProcessor.prototype, "processLeagueSync", null);
__decorate([
    (0, bull_1.Process)(interfaces_1.SyncJobType.team),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncJobProcessor.prototype, "processTeamSync", null);
__decorate([
    (0, bull_1.Process)(interfaces_1.SyncJobType.fixture),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncJobProcessor.prototype, "processFixtureSync", null);
__decorate([
    (0, bull_1.Process)(interfaces_1.SyncJobType.odds_upcoming),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncJobProcessor.prototype, "processUpcomingOddsSync", null);
__decorate([
    (0, bull_1.Process)(interfaces_1.SyncJobType.odds_live),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncJobProcessor.prototype, "processLiveOddsSync", null);
__decorate([
    (0, bull_1.Process)(interfaces_1.SyncJobType.full_sync),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncJobProcessor.prototype, "processFullSync", null);
__decorate([
    (0, bull_1.OnQueueCompleted)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SyncJobProcessor.prototype, "onCompleted", null);
__decorate([
    (0, bull_1.OnQueueFailed)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Error]),
    __metadata("design:returntype", Promise)
], SyncJobProcessor.prototype, "onFailed", null);
__decorate([
    (0, bull_1.OnQueueStalled)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncJobProcessor.prototype, "onStalled", null);
exports.SyncJobProcessor = SyncJobProcessor = SyncJobProcessor_1 = __decorate([
    (0, bull_1.Processor)(interfaces_1.SYNC_QUEUE_NAME),
    __metadata("design:paramtypes", [sync_job_service_1.SyncJobService,
        league_sync_service_1.LeagueSyncService,
        team_sync_service_1.TeamSyncService,
        fixture_sync_service_1.FixtureSyncService,
        odds_sync_service_1.OddsSyncService])
], SyncJobProcessor);
//# sourceMappingURL=sync-job.processor.js.map