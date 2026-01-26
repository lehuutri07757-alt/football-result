import { Controller, Get, Post, Body, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ApiFootballService } from './api-football.service';
import { LeagueSyncService } from './league-sync.service';
import { TeamSyncService } from './team-sync.service';
import { FixtureSyncService } from './fixture-sync.service';
import { OddsSyncService } from './odds-sync.service';
import { QueryOddsDto, QueryApiLogsDto } from './dto';
import { LeagueSyncConfig } from './interfaces';

@ApiTags('API Football')
@Controller('api-football')
export class ApiFootballController {
  constructor(
    private readonly apiFootballService: ApiFootballService,
    private readonly leagueSyncService: LeagueSyncService,
    private readonly teamSyncService: TeamSyncService,
    private readonly fixtureSyncService: FixtureSyncService,
    private readonly oddsSyncService: OddsSyncService,
  ) {}

  @Get('top-leagues')
  @ApiOperation({ summary: 'Get top leagues with match counts grouped by country' })
  @ApiResponse({ status: 200, description: 'Top leagues data with match counts' })
  @ApiQuery({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format (defaults to today)' })
  async getTopLeagues(@Query('date') date?: string) {
    return this.apiFootballService.getTopLeagues(date);
  }

  @Get('leagues')
  @ApiOperation({ summary: 'Get all leagues (cached)' })
  @ApiResponse({ status: 200, description: 'All leagues from API-Football' })
  @ApiQuery({ name: 'refresh', required: false, description: 'Force refresh from API' })
  async getLeagues(@Query('refresh') refresh?: string) {
    const forceRefresh = refresh === 'true';
    return this.leagueSyncService.getLeagues(forceRefresh);
  }

  @Get('leagues/sync/config')
  @ApiOperation({ summary: 'Get league sync configuration' })
  @ApiResponse({ status: 200, description: 'Current sync configuration' })
  async getSyncConfig() {
    return this.leagueSyncService.getConfig();
  }

  @Post('leagues/sync/config')
  @ApiOperation({ summary: 'Update league sync configuration' })
  @ApiResponse({ status: 200, description: 'Updated sync configuration' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cacheTtlSeconds: { type: 'number', description: 'Cache TTL in seconds', example: 3600 },
        syncIntervalMinutes: { type: 'number', description: 'Auto sync interval in minutes', example: 60 },
        enableAutoSync: { type: 'boolean', description: 'Enable/disable auto sync', example: true },
        onlyCurrentSeason: { type: 'boolean', description: 'Only sync current season leagues', example: true },
      },
    },
  })
  async updateSyncConfig(@Body() config: Partial<LeagueSyncConfig>) {
    return this.leagueSyncService.updateConfig(config);
  }

  @Post('leagues/sync')
  @ApiOperation({ summary: 'Trigger manual league sync' })
  @ApiResponse({ status: 200, description: 'Sync result with created/updated counts' })
  async triggerSync() {
    return this.leagueSyncService.triggerManualSync();
  }

  @Get('leagues/sync/status')
  @ApiOperation({ summary: 'Get league sync status' })
  @ApiResponse({ status: 200, description: 'Sync status with next run time' })
  async getSyncStatus() {
    return this.leagueSyncService.getSyncStatus();
  }

  @Post('leagues/cache/invalidate')
  @ApiOperation({ summary: 'Invalidate league cache' })
  @ApiResponse({ status: 200, description: 'Cache invalidated' })
  async invalidateCache() {
    await this.leagueSyncService.invalidateCache();
    return { success: true, message: 'League cache invalidated' };
  }

  @Post('teams/sync')
  @ApiOperation({ summary: 'Trigger manual team sync for all active leagues' })
  @ApiResponse({ status: 200, description: 'Team sync result' })
  async syncTeams() {
    return this.teamSyncService.syncAllActiveLeagues();
  }

  @Post('teams/sync/:leagueExternalId')
  @ApiOperation({ summary: 'Sync teams for a specific league' })
  @ApiResponse({ status: 200, description: 'Team sync result for league' })
  @ApiQuery({ name: 'season', required: false, description: 'Season year (e.g., 2025)' })
  async syncTeamsByLeague(
    @Param('leagueExternalId') leagueExternalId: string,
    @Query('season') season?: string,
  ) {
    return this.teamSyncService.syncTeamsByLeague(leagueExternalId, season);
  }

  @Get('teams/stats')
  @ApiOperation({ summary: 'Get teams count statistics' })
  @ApiResponse({ status: 200, description: 'Teams statistics' })
  async getTeamsStats() {
    return this.teamSyncService.getTeamsCount();
  }

  @Post('teams/cache/invalidate')
  @ApiOperation({ summary: 'Invalidate teams cache' })
  @ApiResponse({ status: 200, description: 'Teams cache invalidated' })
  async invalidateTeamsCache() {
    await this.teamSyncService.invalidateCache();
    return { success: true, message: 'Teams cache invalidated' };
  }

  @Post('fixtures/sync')
  @ApiOperation({ summary: 'Sync fixtures by date range for active leagues' })
  @ApiResponse({ status: 200, description: 'Fixture sync result' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date YYYY-MM-DD (default: today -1)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date YYYY-MM-DD (default: today +7)' })
  async syncFixtures(@Query('from') from?: string, @Query('to') to?: string) {
    const today = new Date();
    const dateFrom = from || new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0];
    const dateTo = to || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return this.fixtureSyncService.syncFixturesByDate(dateFrom, dateTo);
  }

  @Post('fixtures/sync/:leagueExternalId')
  @ApiOperation({ summary: 'Sync fixtures for a specific league' })
  @ApiResponse({ status: 200, description: 'Fixture sync result for league' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, description: 'End date YYYY-MM-DD' })
  async syncFixturesByLeague(
    @Param('leagueExternalId', ParseIntPipe) leagueExternalId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const today = new Date();
    const dateFrom = from || new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0];
    const dateTo = to || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return this.fixtureSyncService.syncFixturesForLeague(leagueExternalId, dateFrom, dateTo);
  }

  @Get('fixtures/stats')
  @ApiOperation({ summary: 'Get fixtures count statistics' })
  @ApiResponse({ status: 200, description: 'Fixtures statistics' })
  async getFixturesStats() {
    return this.fixtureSyncService.getFixturesCount();
  }

  @Post('fixtures/cache/invalidate')
  @ApiOperation({ summary: 'Invalidate fixtures cache' })
  @ApiResponse({ status: 200, description: 'Fixtures cache invalidated' })
  async invalidateFixturesCache() {
    await this.fixtureSyncService.invalidateCache();
    return { success: true, message: 'Fixtures cache invalidated' };
  }

  @Post('odds/sync/upcoming')
  @ApiOperation({ summary: 'Sync odds for upcoming matches' })
  @ApiResponse({ status: 200, description: 'Odds sync result' })
  @ApiQuery({ name: 'hours', required: false, description: 'Hours ahead to sync (default: 48)' })
  async syncUpcomingOdds(@Query('hours', new ParseIntPipe({ optional: true })) hours?: number) {
    return this.oddsSyncService.syncOddsForUpcomingMatches(hours || 48);
  }

  @Post('odds/sync/live')
  @ApiOperation({ summary: 'Sync live odds for live matches' })
  @ApiResponse({ status: 200, description: 'Live odds sync result' })
  async syncLiveOdds() {
    return this.oddsSyncService.syncOddsForLiveMatches();
  }

  @Get('odds/stats')
  @ApiOperation({ summary: 'Get odds statistics' })
  @ApiResponse({ status: 200, description: 'Odds statistics' })
  async getOddsStats() {
    return this.oddsSyncService.getOddsStats();
  }

  @Post('odds/cache/invalidate')
  @ApiOperation({ summary: 'Invalidate odds cache' })
  @ApiResponse({ status: 200, description: 'Odds cache invalidated' })
  async invalidateOddsCache() {
    await this.oddsSyncService.invalidateCache();
    return { success: true, message: 'Odds cache invalidated' };
  }

  @Get('odds')
  @ApiOperation({ summary: 'Get odds table with matches grouped by league' })
  @ApiResponse({ status: 200, description: 'Odds table data' })
  @ApiQuery({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'live', required: false, description: 'Get live matches only' })
  @ApiQuery({ name: 'leagueIds', required: false, type: [Number], description: 'Filter by league IDs' })
  async getOddsTable(@Query() query: QueryOddsDto) {
    return this.apiFootballService.getOddsTable(query);
  }

  @Get('odds/live')
  @ApiOperation({ summary: 'Get live odds table' })
  @ApiResponse({ status: 200, description: 'Live odds table data' })
  async getLiveOddsTable() {
    return this.apiFootballService.getOddsTable({ live: true });
  }

  @Get('odds/today')
  @ApiOperation({ summary: 'Get today odds table' })
  @ApiResponse({ status: 200, description: 'Today odds table data' })
  async getTodayOddsTable() {
    const today = new Date().toISOString().split('T')[0];
    return this.apiFootballService.getOddsTable({ date: today });
  }

  @Get('fixtures/:id/odds')
  @ApiOperation({ summary: 'Get odds for a specific fixture' })
  @ApiResponse({ status: 200, description: 'Fixture odds data' })
  async getFixtureOdds(@Param('id', ParseIntPipe) id: number) {
    return this.apiFootballService.getFixtureOdds(id);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get API request logs (Admin only)' })
  @ApiResponse({ status: 200, description: 'API request logs with pagination' })
  async getApiLogs(@Query() query: QueryApiLogsDto) {
    return this.apiFootballService.getApiLogs(query);
  }

  @Get('logs/stats')
  @ApiOperation({ summary: 'Get API request statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'API usage statistics' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to analyze', example: 7 })
  async getApiLogsStats(@Query('days', new ParseIntPipe({ optional: true })) days?: number) {
    return this.apiFootballService.getApiLogsStats(days || 7);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get API-Football account status and quota (does not count against quota)' })
  @ApiResponse({ status: 200, description: 'Account status with subscription and request limits' })
  async getAccountStatus() {
    return this.apiFootballService.getAccountStatus();
  }
}
