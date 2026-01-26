import { Controller, Get, Query, UseGuards, Param, Patch, Body, Put, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { QueryUserDto, UpdateUserDto } from '../users/dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators';
import { PERMISSIONS } from '../roles/constants/permissions';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private adminService: AdminService,
    private usersService: UsersService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Admin statistics' })
  @RequirePermissions(PERMISSIONS.REPORTS.VIEW)
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination and filters (Admin)' })
  @ApiResponse({ status: 200, description: 'List of users with pagination' })
  @RequirePermissions(PERMISSIONS.USERS.READ)
  async getUsers(@Query() query: QueryUserDto) {
    return this.usersService.findAllPaginated(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details by ID (Admin)' })
  @ApiResponse({ status: 200, description: 'User details' })
  @RequirePermissions(PERMISSIONS.USERS.READ)
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (user) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user (Admin)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @RequirePermissions(PERMISSIONS.USERS.UPDATE)
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Update user status (Admin)' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  @RequirePermissions(PERMISSIONS.USERS.UPDATE)
  async updateUserStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.usersService.updateUser(id, { status: body.status as any });
  }

  @Post('users/:id/adjust-balance')
  @ApiOperation({ summary: 'Adjust user balance (Admin)' })
  @ApiResponse({ status: 200, description: 'Balance adjusted successfully' })
  @RequirePermissions(PERMISSIONS.USERS.UPDATE)
  async adjustBalance(
    @Param('id') id: string,
    @Body() body: { amount: number; type: 'add' | 'subtract'; balanceType: 'real' | 'bonus'; reason: string }
  ) {
    return this.adminService.adjustUserBalance(id, body.amount, body.type, body.balanceType, body.reason);
  }
}
