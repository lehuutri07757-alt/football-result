import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators';
import { PERMISSIONS } from '../roles/constants/permissions';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of users with pagination' })
  @RequirePermissions(PERMISSIONS.USERS.READ)
  async findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAllPaginated(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @RequirePermissions(PERMISSIONS.USERS.CREATE)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @RequirePermissions(PERMISSIONS.USERS.READ)
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (user) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @RequirePermissions(PERMISSIONS.USERS.UPDATE)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @RequirePermissions(PERMISSIONS.USERS.DELETE)
  async delete(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Post(':id/block')
  @ApiOperation({ summary: 'Block user' })
  @ApiResponse({ status: 200, description: 'User blocked successfully' })
  @RequirePermissions(PERMISSIONS.USERS.BLOCK)
  async block(@Param('id') id: string) {
    return this.usersService.blockUser(id);
  }

  @Post(':id/unblock')
  @ApiOperation({ summary: 'Unblock user' })
  @ApiResponse({ status: 200, description: 'User unblocked successfully' })
  @RequirePermissions(PERMISSIONS.USERS.BLOCK)
  async unblock(@Param('id') id: string) {
    return this.usersService.unblockUser(id);
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend user' })
  @ApiResponse({ status: 200, description: 'User suspended successfully' })
  @RequirePermissions(PERMISSIONS.USERS.BLOCK)
  async suspend(@Param('id') id: string) {
    return this.usersService.suspendUser(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get user betting statistics' })
  @ApiResponse({ status: 200, description: 'User statistics' })
  @RequirePermissions(PERMISSIONS.USERS.READ)
  async getStats(@Param('id') id: string) {
    return this.usersService.getUserStats(id);
  }
}
