import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMatchDto, UpdateMatchDto, QueryMatchDto, UpdateScoreDto } from './dto';

@ApiTags('Matches')
@Controller('matches')
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all matches with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of matches' })
  async findAll(@Query() query: QueryMatchDto) {
    return this.matchesService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get matches statistics' })
  @ApiResponse({ status: 200, description: 'Matches statistics' })
  async getStatistics() {
    return this.matchesService.getStatistics();
  }

  @Get('live')
  @ApiOperation({ summary: 'Get live matches' })
  @ApiResponse({ status: 200, description: 'List of live matches' })
  async findLive() {
    return this.matchesService.findLive();
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming matches' })
  @ApiResponse({ status: 200, description: 'List of upcoming matches' })
  async findUpcoming(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.matchesService.findUpcoming(limit);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today matches' })
  @ApiResponse({ status: 200, description: 'List of today matches' })
  async findToday() {
    return this.matchesService.findToday();
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured matches' })
  @ApiResponse({ status: 200, description: 'List of featured matches' })
  async findFeatured() {
    return this.matchesService.findFeatured();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get match by ID' })
  @ApiResponse({ status: 200, description: 'Match details' })
  async findOne(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get match betting statistics' })
  @ApiResponse({ status: 200, description: 'Match statistics' })
  async getStats(@Param('id') id: string) {
    return this.matchesService.getMatchStats(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new match (Admin only)' })
  @ApiResponse({ status: 201, description: 'Match created successfully' })
  async create(@Body() createMatchDto: CreateMatchDto) {
    return this.matchesService.create(createMatchDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update match' })
  @ApiResponse({ status: 200, description: 'Match updated successfully' })
  async update(@Param('id') id: string, @Body() updateMatchDto: UpdateMatchDto) {
    return this.matchesService.update(id, updateMatchDto);
  }

  @Put(':id/score')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update match score' })
  @ApiResponse({ status: 200, description: 'Score updated successfully' })
  async updateScore(@Param('id') id: string, @Body() updateScoreDto: UpdateScoreDto) {
    return this.matchesService.updateScore(id, updateScoreDto);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start match (set to live)' })
  @ApiResponse({ status: 200, description: 'Match started' })
  async startMatch(@Param('id') id: string) {
    return this.matchesService.startMatch(id);
  }

  @Post(':id/end')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'End match' })
  @ApiResponse({ status: 200, description: 'Match ended' })
  async endMatch(@Param('id') id: string) {
    return this.matchesService.endMatch(id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel match' })
  @ApiResponse({ status: 200, description: 'Match cancelled' })
  async cancelMatch(@Param('id') id: string) {
    return this.matchesService.cancelMatch(id);
  }

  @Post(':id/postpone')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Postpone match' })
  @ApiResponse({ status: 200, description: 'Match postponed' })
  async postponeMatch(@Param('id') id: string) {
    return this.matchesService.postponeMatch(id);
  }

  @Post(':id/toggle-betting')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle betting enabled/disabled' })
  @ApiResponse({ status: 200, description: 'Betting status toggled' })
  async toggleBetting(@Param('id') id: string) {
    return this.matchesService.toggleBetting(id);
  }

  @Post(':id/toggle-featured')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle featured status' })
  @ApiResponse({ status: 200, description: 'Featured status toggled' })
  async toggleFeatured(@Param('id') id: string) {
    return this.matchesService.toggleFeatured(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete match' })
  @ApiResponse({ status: 200, description: 'Match deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.matchesService.remove(id);
  }
}
