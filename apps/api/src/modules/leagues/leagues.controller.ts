import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { LeaguesService } from './leagues.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateLeagueDto, UpdateLeagueDto, QueryLeagueDto, ReorderLeaguesDto } from './dto';

@ApiTags('Leagues')
@Controller('leagues')
export class LeaguesController {
  constructor(private leaguesService: LeaguesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all leagues with pagination' })
  @ApiResponse({ status: 200, description: 'List of leagues' })
  async findAll(@Query() query: QueryLeagueDto) {
    return this.leaguesService.findAll(query);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured leagues' })
  @ApiResponse({ status: 200, description: 'List of featured leagues' })
  async findFeatured() {
    return this.leaguesService.findFeatured();
  }

  @Get('sport/:sportId')
  @ApiOperation({ summary: 'Get leagues by sport' })
  @ApiResponse({ status: 200, description: 'List of leagues for a sport' })
  async findBySport(@Param('sportId') sportId: string) {
    return this.leaguesService.findBySport(sportId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get league by ID' })
  @ApiResponse({ status: 200, description: 'League details' })
  async findOne(@Param('id') id: string) {
    return this.leaguesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new league (Admin only)' })
  @ApiResponse({ status: 201, description: 'League created successfully' })
  async create(@Body() createLeagueDto: CreateLeagueDto) {
    return this.leaguesService.create(createLeagueDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update league' })
  @ApiResponse({ status: 200, description: 'League updated successfully' })
  async update(@Param('id') id: string, @Body() updateLeagueDto: UpdateLeagueDto) {
    return this.leaguesService.update(id, updateLeagueDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete league' })
  @ApiResponse({ status: 200, description: 'League deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.leaguesService.remove(id);
  }

  @Post(':id/toggle-active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle league active status' })
  @ApiResponse({ status: 200, description: 'League status toggled' })
  async toggleActive(@Param('id') id: string) {
    return this.leaguesService.toggleActive(id);
  }

  @Post(':id/toggle-featured')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle league featured status' })
  @ApiResponse({ status: 200, description: 'League featured status toggled' })
  async toggleFeatured(@Param('id') id: string) {
    return this.leaguesService.toggleFeatured(id);
  }

  @Post('inactive-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set all leagues to inactive (Admin only)' })
  @ApiResponse({ status: 200, description: 'All leagues set to inactive' })
  async inactiveAll() {
    return this.leaguesService.inactiveAll();
  }

  @Post('reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder leagues' })
  @ApiResponse({ status: 200, description: 'Leagues reordered successfully' })
  async reorder(@Body() reorderDto: ReorderLeaguesDto) {
    return this.leaguesService.reorder(reorderDto);
  }
}
