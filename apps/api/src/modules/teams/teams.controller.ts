import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTeamDto, UpdateTeamDto, QueryTeamDto } from './dto';

@ApiTags('Teams')
@Controller('teams')
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all teams with pagination' })
  @ApiResponse({ status: 200, description: 'List of teams' })
  async findAll(@Query() query: QueryTeamDto) {
    return this.teamsService.findAll(query);
  }

  @Get('sport/:sportId')
  @ApiOperation({ summary: 'Get teams by sport' })
  @ApiResponse({ status: 200, description: 'List of teams for a sport' })
  async findBySport(@Param('sportId') sportId: string) {
    return this.teamsService.findBySport(sportId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID' })
  @ApiResponse({ status: 200, description: 'Team details' })
  async findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new team (Admin only)' })
  @ApiResponse({ status: 201, description: 'Team created successfully' })
  async create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(createTeamDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update team' })
  @ApiResponse({ status: 200, description: 'Team updated successfully' })
  async update(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto) {
    return this.teamsService.update(id, updateTeamDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete team' })
  @ApiResponse({ status: 200, description: 'Team deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.teamsService.remove(id);
  }

  @Post(':id/toggle-active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle team active status' })
  @ApiResponse({ status: 200, description: 'Team status toggled' })
  async toggleActive(@Param('id') id: string) {
    return this.teamsService.toggleActive(id);
  }
}
