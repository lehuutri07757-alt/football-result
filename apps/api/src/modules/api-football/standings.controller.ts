import {
  Controller,
  Get,
  Post,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { StandingsSyncService } from './standings-sync.service';

@ApiTags('Standings')
@Controller('standings')
export class StandingsController {
  constructor(private readonly standingsSyncService: StandingsSyncService) {}

  @Get('league/:leagueId')
  @ApiOperation({ summary: 'Get standings by league ID (internal DB ID)' })
  @ApiQuery({ name: 'season', required: false })
  @ApiResponse({ status: 200, description: 'Returns standings for the league' })
  async getByLeague(
    @Param('leagueId') leagueId: string,
    @Query('season') season?: string,
  ) {
    return this.standingsSyncService.getStandingsByLeague(leagueId, season);
  }

  @Get('external/:externalLeagueId')
  @ApiOperation({ summary: 'Get standings by external league ID (API-Football ID)' })
  @ApiQuery({ name: 'season', required: false })
  @ApiResponse({ status: 200, description: 'Returns standings for the league' })
  async getByExternalLeagueId(
    @Param('externalLeagueId') externalLeagueId: string,
    @Query('season') season?: string,
  ) {
    return this.standingsSyncService.getStandingsByExternalLeagueId(externalLeagueId, season);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync standings for all active leagues' })
  @ApiResponse({ status: 200, description: 'Sync completed' })
  async syncAll() {
    return this.standingsSyncService.syncAllActiveLeagues();
  }

  @Post('sync/:externalLeagueId')
  @ApiOperation({ summary: 'Sync standings for a specific league' })
  @ApiQuery({ name: 'season', required: false })
  @ApiResponse({ status: 200, description: 'Sync completed for specific league' })
  async syncByLeague(
    @Param('externalLeagueId') externalLeagueId: string,
    @Query('season') season?: string,
  ) {
    const league = await this.getLeagueByExternalId(externalLeagueId);
    if (!league) {
      return { error: 'League not found', externalLeagueId };
    }
    
    return this.standingsSyncService.syncStandingsByLeague(
      league.id,
      externalLeagueId,
      season,
    );
  }

  @Post('cache/invalidate')
  @ApiOperation({ summary: 'Invalidate standings cache' })
  @ApiResponse({ status: 200, description: 'Cache invalidated' })
  async invalidateCache() {
    await this.standingsSyncService.invalidateCache();
    return { success: true, message: 'Standings cache invalidated' };
  }

  private async getLeagueByExternalId(externalLeagueId: string): Promise<{ id: string } | null> {
    const result = await this.standingsSyncService.getStandingsByExternalLeagueId(externalLeagueId);
    return result.league ? { id: result.league.id } : null;
  }
}
