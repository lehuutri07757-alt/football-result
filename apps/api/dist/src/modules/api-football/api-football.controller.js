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
exports.ApiFootballController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_football_service_1 = require("./api-football.service");
const league_sync_service_1 = require("./league-sync.service");
const team_sync_service_1 = require("./team-sync.service");
const fixture_sync_service_1 = require("./fixture-sync.service");
const odds_sync_service_1 = require("./odds-sync.service");
const dto_1 = require("./dto");
let ApiFootballController = class ApiFootballController {
    constructor(apiFootballService, leagueSyncService, teamSyncService, fixtureSyncService, oddsSyncService) {
        this.apiFootballService = apiFootballService;
        this.leagueSyncService = leagueSyncService;
        this.teamSyncService = teamSyncService;
        this.fixtureSyncService = fixtureSyncService;
        this.oddsSyncService = oddsSyncService;
    }
    async getTopLeagues(date) {
        return this.apiFootballService.getTopLeagues(date);
    }
    async getLeagues(refresh) {
        const forceRefresh = refresh === 'true';
        return this.leagueSyncService.getLeagues(forceRefresh);
    }
    async getSyncConfig() {
        return this.leagueSyncService.getConfig();
    }
    async updateSyncConfig(config) {
        return this.leagueSyncService.updateConfig(config);
    }
    async triggerSync() {
        return this.leagueSyncService.triggerManualSync();
    }
    async getSyncStatus() {
        return this.leagueSyncService.getSyncStatus();
    }
    async invalidateCache() {
        await this.leagueSyncService.invalidateCache();
        return { success: true, message: 'League cache invalidated' };
    }
    async syncTeams() {
        return this.teamSyncService.syncAllActiveLeagues();
    }
    async syncTeamsByLeague(leagueExternalId, season) {
        return this.teamSyncService.syncTeamsByLeague(leagueExternalId, season);
    }
    async getTeamsStats() {
        return this.teamSyncService.getTeamsCount();
    }
    async invalidateTeamsCache() {
        await this.teamSyncService.invalidateCache();
        return { success: true, message: 'Teams cache invalidated' };
    }
    async syncFixtures(from, to) {
        const today = new Date();
        const dateFrom = from || new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0];
        const dateTo = to || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return this.fixtureSyncService.syncFixturesByDate(dateFrom, dateTo);
    }
    async syncFixturesByLeague(leagueExternalId, from, to) {
        const today = new Date();
        const dateFrom = from || new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0];
        const dateTo = to || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return this.fixtureSyncService.syncFixturesForLeague(leagueExternalId, dateFrom, dateTo);
    }
    async getFixturesStats() {
        return this.fixtureSyncService.getFixturesCount();
    }
    async invalidateFixturesCache() {
        await this.fixtureSyncService.invalidateCache();
        return { success: true, message: 'Fixtures cache invalidated' };
    }
    async syncUpcomingOdds(hours) {
        return this.oddsSyncService.syncOddsForUpcomingMatches(hours || 48);
    }
    async syncLiveOdds() {
        return this.oddsSyncService.syncOddsForLiveMatches();
    }
    async getOddsStats() {
        return this.oddsSyncService.getOddsStats();
    }
    async invalidateOddsCache() {
        await this.oddsSyncService.invalidateCache();
        return { success: true, message: 'Odds cache invalidated' };
    }
    async getOddsTable(query) {
        return this.apiFootballService.getOddsTable(query);
    }
    async getLiveOddsTable() {
        return this.apiFootballService.getOddsTable({ live: true });
    }
    async getTodayOddsTable() {
        const today = new Date().toISOString().split('T')[0];
        return this.apiFootballService.getOddsTable({ date: today });
    }
    async getFixtureOdds(id) {
        return this.apiFootballService.getFixtureOdds(id);
    }
    async getApiLogs(query) {
        return this.apiFootballService.getApiLogs(query);
    }
    async getApiLogsStats(days) {
        return this.apiFootballService.getApiLogsStats(days || 7);
    }
    async getAccountStatus() {
        return this.apiFootballService.getAccountStatus();
    }
};
exports.ApiFootballController = ApiFootballController;
__decorate([
    (0, common_1.Get)('top-leagues'),
    (0, swagger_1.ApiOperation)({ summary: 'Get top leagues with match counts grouped by country' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Top leagues data with match counts' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format (defaults to today)' }),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "getTopLeagues", null);
__decorate([
    (0, common_1.Get)('leagues'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all leagues (cached)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'All leagues from API-Football' }),
    (0, swagger_1.ApiQuery)({ name: 'refresh', required: false, description: 'Force refresh from API' }),
    __param(0, (0, common_1.Query)('refresh')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "getLeagues", null);
__decorate([
    (0, common_1.Get)('leagues/sync/config'),
    (0, swagger_1.ApiOperation)({ summary: 'Get league sync configuration' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current sync configuration' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "getSyncConfig", null);
__decorate([
    (0, common_1.Post)('leagues/sync/config'),
    (0, swagger_1.ApiOperation)({ summary: 'Update league sync configuration' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated sync configuration' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                cacheTtlSeconds: { type: 'number', description: 'Cache TTL in seconds', example: 3600 },
                syncIntervalMinutes: { type: 'number', description: 'Auto sync interval in minutes', example: 60 },
                enableAutoSync: { type: 'boolean', description: 'Enable/disable auto sync', example: true },
                onlyCurrentSeason: { type: 'boolean', description: 'Only sync current season leagues', example: true },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "updateSyncConfig", null);
__decorate([
    (0, common_1.Post)('leagues/sync'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger manual league sync' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sync result with created/updated counts' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "triggerSync", null);
__decorate([
    (0, common_1.Get)('leagues/sync/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get league sync status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sync status with next run time' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "getSyncStatus", null);
__decorate([
    (0, common_1.Post)('leagues/cache/invalidate'),
    (0, swagger_1.ApiOperation)({ summary: 'Invalidate league cache' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cache invalidated' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "invalidateCache", null);
__decorate([
    (0, common_1.Post)('teams/sync'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger manual team sync for all active leagues' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team sync result' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "syncTeams", null);
__decorate([
    (0, common_1.Post)('teams/sync/:leagueExternalId'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync teams for a specific league' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team sync result for league' }),
    (0, swagger_1.ApiQuery)({ name: 'season', required: false, description: 'Season year (e.g., 2025)' }),
    __param(0, (0, common_1.Param)('leagueExternalId')),
    __param(1, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "syncTeamsByLeague", null);
__decorate([
    (0, common_1.Get)('teams/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get teams count statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Teams statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "getTeamsStats", null);
__decorate([
    (0, common_1.Post)('teams/cache/invalidate'),
    (0, swagger_1.ApiOperation)({ summary: 'Invalidate teams cache' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Teams cache invalidated' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "invalidateTeamsCache", null);
__decorate([
    (0, common_1.Post)('fixtures/sync'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync fixtures by date range for active leagues' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Fixture sync result' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, description: 'Start date YYYY-MM-DD (default: today -1)' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, description: 'End date YYYY-MM-DD (default: today +7)' }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "syncFixtures", null);
__decorate([
    (0, common_1.Post)('fixtures/sync/:leagueExternalId'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync fixtures for a specific league' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Fixture sync result for league' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, description: 'Start date YYYY-MM-DD' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, description: 'End date YYYY-MM-DD' }),
    __param(0, (0, common_1.Param)('leagueExternalId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "syncFixturesByLeague", null);
__decorate([
    (0, common_1.Get)('fixtures/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get fixtures count statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Fixtures statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "getFixturesStats", null);
__decorate([
    (0, common_1.Post)('fixtures/cache/invalidate'),
    (0, swagger_1.ApiOperation)({ summary: 'Invalidate fixtures cache' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Fixtures cache invalidated' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "invalidateFixturesCache", null);
__decorate([
    (0, common_1.Post)('odds/sync/upcoming'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync odds for upcoming matches' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Odds sync result' }),
    (0, swagger_1.ApiQuery)({ name: 'hours', required: false, description: 'Hours ahead to sync (default: 48)' }),
    __param(0, (0, common_1.Query)('hours', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "syncUpcomingOdds", null);
__decorate([
    (0, common_1.Post)('odds/sync/live'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync live odds for live matches' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Live odds sync result' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "syncLiveOdds", null);
__decorate([
    (0, common_1.Get)('odds/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get odds statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Odds statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "getOddsStats", null);
__decorate([
    (0, common_1.Post)('odds/cache/invalidate'),
    (0, swagger_1.ApiOperation)({ summary: 'Invalidate odds cache' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Odds cache invalidated' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "invalidateOddsCache", null);
__decorate([
    (0, common_1.Get)('odds'),
    (0, swagger_1.ApiOperation)({ summary: 'Get odds table with matches grouped by league' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Odds table data' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format' }),
    (0, swagger_1.ApiQuery)({ name: 'live', required: false, description: 'Get live matches only' }),
    (0, swagger_1.ApiQuery)({ name: 'leagueIds', required: false, type: [Number], description: 'Filter by league IDs' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryOddsDto]),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "getOddsTable", null);
__decorate([
    (0, common_1.Get)('odds/live'),
    (0, swagger_1.ApiOperation)({ summary: 'Get live odds table' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Live odds table data' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "getLiveOddsTable", null);
__decorate([
    (0, common_1.Get)('odds/today'),
    (0, swagger_1.ApiOperation)({ summary: 'Get today odds table' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Today odds table data' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "getTodayOddsTable", null);
__decorate([
    (0, common_1.Get)('fixtures/:id/odds'),
    (0, swagger_1.ApiOperation)({ summary: 'Get odds for a specific fixture' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Fixture odds data' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "getFixtureOdds", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get API request logs (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'API request logs with pagination' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryApiLogsDto]),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "getApiLogs", null);
__decorate([
    (0, common_1.Get)('logs/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get API request statistics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'API usage statistics' }),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, description: 'Number of days to analyze', example: 7 }),
    __param(0, (0, common_1.Query)('days', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "getApiLogsStats", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get API-Football account status and quota (does not count against quota)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Account status with subscription and request limits' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiFootballController.prototype, "getAccountStatus", null);
exports.ApiFootballController = ApiFootballController = __decorate([
    (0, swagger_1.ApiTags)('API Football'),
    (0, common_1.Controller)('api-football'),
    __metadata("design:paramtypes", [api_football_service_1.ApiFootballService,
        league_sync_service_1.LeagueSyncService,
        team_sync_service_1.TeamSyncService,
        fixture_sync_service_1.FixtureSyncService,
        odds_sync_service_1.OddsSyncService])
], ApiFootballController);
//# sourceMappingURL=api-football.controller.js.map