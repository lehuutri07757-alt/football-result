import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAgentDto, UpdateAgentDto, QueryAgentDto } from './dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators';
import { PERMISSIONS } from '../roles/constants/permissions';

@ApiTags('Agents')
@Controller('agents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all agents with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of agents' })
  @RequirePermissions(PERMISSIONS.AGENTS.READ)
  async findAll(@Query() query: QueryAgentDto) {
    return this.agentsService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create new agent' })
  @ApiResponse({ status: 201, description: 'Agent created successfully' })
  @RequirePermissions(PERMISSIONS.AGENTS.CREATE)
  async create(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.create(createAgentDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID' })
  @ApiResponse({ status: 200, description: 'Agent details' })
  @RequirePermissions(PERMISSIONS.AGENTS.READ)
  async findOne(@Param('id') id: string) {
    return this.agentsService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update agent' })
  @ApiResponse({ status: 200, description: 'Agent updated successfully' })
  @RequirePermissions(PERMISSIONS.AGENTS.UPDATE)
  async update(@Param('id') id: string, @Body() updateAgentDto: UpdateAgentDto) {
    return this.agentsService.update(id, updateAgentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete agent' })
  @ApiResponse({ status: 200, description: 'Agent deleted successfully' })
  @RequirePermissions(PERMISSIONS.AGENTS.DELETE)
  async delete(@Param('id') id: string) {
    return this.agentsService.delete(id);
  }

  @Get(':id/tree')
  @ApiOperation({ summary: 'Get agent hierarchy tree' })
  @ApiResponse({ status: 200, description: 'Agent tree structure' })
  @RequirePermissions(PERMISSIONS.AGENTS.READ)
  async getTree(@Param('id') id: string) {
    return this.agentsService.getAgentTree(id);
  }

  @Get(':id/downline')
  @ApiOperation({ summary: 'Get agent downline users' })
  @ApiResponse({ status: 200, description: 'List of downline users' })
  @RequirePermissions(PERMISSIONS.AGENTS.MANAGE_DOWNLINE)
  async getDownline(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.agentsService.getDownlineUsers(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get agent statistics' })
  @ApiResponse({ status: 200, description: 'Agent statistics' })
  @RequirePermissions(PERMISSIONS.AGENTS.READ)
  async getStats(@Param('id') id: string) {
    return this.agentsService.getAgentStats(id);
  }
}
