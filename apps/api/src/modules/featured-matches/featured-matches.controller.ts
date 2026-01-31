import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { FeaturedMatchesService, FeaturedMatchesSettings } from './featured-matches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Featured Matches')
@Controller('featured-matches')
export class FeaturedMatchesController {
  constructor(private featuredMatchesService: FeaturedMatchesService) {}

  @Get()
  @ApiOperation({ summary: 'Get featured matches based on settings criteria' })
  @ApiResponse({ status: 200, description: 'List of featured matches' })
  async getFeaturedMatches() {
    return this.featuredMatchesService.getFeaturedMatches();
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get featured matches settings' })
  @ApiResponse({ status: 200, description: 'Current settings' })
  async getSettings() {
    return this.featuredMatchesService.getSettings();
  }

  @Put('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update featured matches settings' })
  @ApiResponse({ status: 200, description: 'Updated settings' })
  async updateSettings(@Body() settings: Partial<FeaturedMatchesSettings>) {
    return this.featuredMatchesService.updateSettings(settings);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get featured matches statistics' })
  @ApiResponse({ status: 200, description: 'Statistics' })
  async getStats() {
    return this.featuredMatchesService.getStats();
  }

  @Post('auto-select')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Auto-select featured matches based on criteria' })
  @ApiResponse({ status: 200, description: 'Number of matches updated' })
  async autoSelect() {
    return this.featuredMatchesService.autoSelectFeaturedMatches();
  }

  @Post('toggle/:matchId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle featured status for a match' })
  @ApiResponse({ status: 200, description: 'Updated match' })
  async toggleFeatured(@Param('matchId') matchId: string) {
    return this.featuredMatchesService.toggleMatchFeatured(matchId);
  }

  @Post('batch-update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Batch update featured status for multiple matches' })
  @ApiResponse({ status: 200, description: 'Number of matches updated' })
  async batchUpdate(
    @Body() body: { matchIds: string[]; featured: boolean },
  ) {
    return this.featuredMatchesService.batchUpdateFeatured(body.matchIds, body.featured);
  }

  @Get('available-leagues')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available leagues for featured selection' })
  @ApiResponse({ status: 200, description: 'List of leagues' })
  async getAvailableLeagues() {
    return this.featuredMatchesService.getAvailableLeagues();
  }

  @Get('available-teams')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available teams for top teams selection' })
  @ApiResponse({ status: 200, description: 'List of teams' })
  async getAvailableTeams(@Query('leagueId') leagueId?: string) {
    return this.featuredMatchesService.getAvailableTeams(leagueId);
  }
}
