import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SyncJobService } from './sync-job.service';
import {
  SyncJobType,
  SyncJobStatus,
  SyncJobPriority,
  CreateSyncJobDto,
} from './interfaces';

@ApiTags('Sync Jobs')
@Controller('sync-jobs')
export class SyncJobController {
  constructor(private readonly syncJobService: SyncJobService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sync job' })
  @ApiResponse({ status: 201, description: 'Job created successfully' })
  async createJob(@Body() dto: CreateSyncJobDto): Promise<{ jobId: string }> {
    const jobId = await this.syncJobService.createJob(dto);
    return { jobId };
  }

  @Post('league')
  @ApiOperation({ summary: 'Trigger league sync' })
  async triggerLeagueSync(): Promise<{ jobId: string }> {
    const jobId = await this.syncJobService.createJob({
      type: SyncJobType.league,
      triggeredBy: 'api',
    });
    return { jobId };
  }

  @Post('team')
  @ApiOperation({ summary: 'Trigger team sync for all active leagues' })
  async triggerTeamSync(): Promise<{ jobId: string }> {
    const jobId = await this.syncJobService.createJob({
      type: SyncJobType.team,
      params: { syncAllActive: true },
      triggeredBy: 'api',
    });
    return { jobId };
  }

  @Post('team/:leagueExternalId')
  @ApiOperation({ summary: 'Trigger team sync for specific league' })
  async triggerTeamSyncForLeague(
    @Param('leagueExternalId') leagueExternalId: string,
    @Query('season') season?: string,
  ): Promise<{ jobId: string }> {
    const jobId = await this.syncJobService.createJob({
      type: SyncJobType.team,
      params: { leagueExternalId, season },
      triggeredBy: 'api',
    });
    return { jobId };
  }

  @Post('fixture')
  @ApiOperation({ summary: 'Trigger fixture sync' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'leagueExternalId', required: false })
  async triggerFixtureSync(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('leagueExternalId') leagueExternalId?: string,
  ): Promise<{ jobId: string }> {
    const jobId = await this.syncJobService.createJob({
      type: SyncJobType.fixture,
      params: {
        dateFrom,
        dateTo,
        leagueExternalId: leagueExternalId ? parseInt(leagueExternalId, 10) : undefined,
      },
      triggeredBy: 'api',
    });
    return { jobId };
  }

  @Post('odds/upcoming')
  @ApiOperation({ summary: 'Trigger upcoming odds sync' })
  @ApiQuery({ name: 'hoursAhead', required: false, type: Number })
  async triggerUpcomingOddsSync(
    @Query('hoursAhead') hoursAhead?: string,
  ): Promise<{ jobId: string }> {
    const jobId = await this.syncJobService.createJob({
      type: SyncJobType.odds_upcoming,
      params: { hoursAhead: hoursAhead ? parseInt(hoursAhead, 10) : 48 },
      triggeredBy: 'api',
    });
    return { jobId };
  }

  @Post('odds/live')
  @ApiOperation({ summary: 'Trigger live odds sync' })
  async triggerLiveOddsSync(): Promise<{ jobId: string }> {
    const jobId = await this.syncJobService.createJob({
      type: SyncJobType.odds_live,
      priority: SyncJobPriority.high,
      triggeredBy: 'api',
    });
    return { jobId };
  }

  @Post('full')
  @ApiOperation({ summary: 'Trigger full sync (leagues, teams, fixtures, odds)' })
  async triggerFullSync(
    @Body() params?: { 
      syncLeagues?: boolean;
      syncTeams?: boolean;
      syncFixtures?: boolean;
      syncOdds?: boolean;
    },
  ): Promise<{ jobId: string }> {
    const jobId = await this.syncJobService.createJob({
      type: SyncJobType.full_sync,
      params: params || {},
      priority: SyncJobPriority.low,
      triggeredBy: 'api',
    });
    return { jobId };
  }

  @Get()
  @ApiOperation({ summary: 'Get all sync jobs' })
  @ApiQuery({ name: 'type', required: false, enum: SyncJobType })
  @ApiQuery({ name: 'status', required: false, enum: SyncJobStatus })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getJobs(
    @Query('type') type?: SyncJobType,
    @Query('status') status?: SyncJobStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.syncJobService.getJobs({
      type,
      status,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get sync job statistics' })
  async getStats() {
    return this.syncJobService.getStats();
  }

  @Get('queue-status')
  @ApiOperation({ summary: 'Get Bull queue status' })
  async getQueueStatus() {
    return this.syncJobService.getQueueStatus();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sync job by ID' })
  async getJob(@Param('id') id: string) {
    return this.syncJobService.getJob(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a pending sync job' })
  async cancelJob(@Param('id') id: string): Promise<void> {
    await this.syncJobService.cancelJob(id);
  }

  @Post(':id/force-release')
  @ApiOperation({ summary: 'Force release a stuck pending/processing job' })
  @ApiResponse({ status: 200, description: 'Job released successfully' })
  async forceReleaseJob(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.syncJobService.forceReleaseJob(id);
    return { success };
  }

  @Post('force-release/type/:type')
  @ApiOperation({ summary: 'Force release all stuck jobs of a specific type' })
  @ApiResponse({ status: 200, description: 'Jobs released successfully' })
  async forceReleaseByType(
    @Param('type') type: SyncJobType,
  ): Promise<{ released: number }> {
    const released = await this.syncJobService.forceReleaseByType(type);
    return { released };
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry a failed sync job' })
  async retryJob(@Param('id') id: string): Promise<{ jobId: string | null }> {
    const jobId = await this.syncJobService.retryJob(id);
    return { jobId };
  }

  @Delete('cleanup/old')
  @ApiOperation({ summary: 'Cleanup old completed/failed jobs' })
  @ApiQuery({ name: 'olderThanDays', required: false, type: Number })
  async cleanupOldJobs(
    @Query('olderThanDays') olderThanDays?: string,
  ): Promise<{ deleted: number }> {
    const deleted = await this.syncJobService.cleanupOldJobs(
      olderThanDays ? parseInt(olderThanDays, 10) : 7,
    );
    return { deleted };
  }
}
