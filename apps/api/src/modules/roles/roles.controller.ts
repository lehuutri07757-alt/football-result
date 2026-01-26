import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import { ALL_PERMISSIONS, PERMISSIONS } from './constants/permissions';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'List of roles' })
  @RequirePermissions(PERMISSIONS.ROLES.READ)
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Get all available permissions' })
  @ApiResponse({ status: 200, description: 'List of all permissions' })
  @RequirePermissions(PERMISSIONS.ROLES.READ)
  async getPermissions() {
    return {
      permissions: PERMISSIONS,
      allPermissions: ALL_PERMISSIONS,
    };
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed default roles' })
  @ApiResponse({ status: 201, description: 'Default roles created' })
  @RequirePermissions(PERMISSIONS.ROLES.CREATE)
  async seedRoles() {
    return this.rolesService.seedDefaultRoles();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Role details' })
  @RequirePermissions(PERMISSIONS.ROLES.READ)
  async findOne(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @RequirePermissions(PERMISSIONS.ROLES.CREATE)
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @RequirePermissions(PERMISSIONS.ROLES.UPDATE)
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @RequirePermissions(PERMISSIONS.ROLES.DELETE)
  async delete(@Param('id') id: string) {
    return this.rolesService.delete(id);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Get users with this role' })
  @ApiResponse({ status: 200, description: 'List of users with role' })
  @RequirePermissions(PERMISSIONS.ROLES.READ)
  async getRoleUsers(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.rolesService.getRoleUsers(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }
}
