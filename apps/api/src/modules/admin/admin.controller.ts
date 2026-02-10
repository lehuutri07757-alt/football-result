import { Controller, Get, Query, UseGuards, Param, Patch, Body, Put, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { WithdrawalsService } from '../withdrawals/withdrawals.service';
import { DepositsService } from '../deposits/deposits.service';
import { BetsService } from '../bets/bets.service';
import { QueryUserDto, UpdateUserDto } from '../users/dto';
import { QueryWithdrawalDto, WithdrawalAction } from '../withdrawals/dto';
import { QueryDepositDto, DepositAction } from '../deposits/dto';
import { QueryAdminBetsDto } from '../bets/dto';
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
    private withdrawalsService: WithdrawalsService,
    private depositsService: DepositsService,
    private betsService: BetsService,
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

  @Get('withdrawals')
  @ApiOperation({ summary: 'Get all withdrawal requests (Admin)' })
  @ApiResponse({ status: 200, description: 'List of withdrawal requests' })
  @RequirePermissions(PERMISSIONS.WITHDRAWALS.READ)
  async getWithdrawals(@Query() query: QueryWithdrawalDto) {
    return this.withdrawalsService.findAll(query);
  }

  @Get('withdrawals/stats')
  @ApiOperation({ summary: 'Get withdrawal statistics (Admin)' })
  @ApiResponse({ status: 200, description: 'Withdrawal statistics' })
  @RequirePermissions(PERMISSIONS.WITHDRAWALS.READ)
  async getWithdrawalStats() {
    return this.withdrawalsService.getStats();
  }

  @Get('withdrawals/:id')
  @ApiOperation({ summary: 'Get withdrawal request by ID (Admin)' })
  @ApiResponse({ status: 200, description: 'Withdrawal request details' })
  @RequirePermissions(PERMISSIONS.WITHDRAWALS.READ)
  async getWithdrawal(@Param('id') id: string) {
    return this.withdrawalsService.findById(id);
  }

  @Post('withdrawals/:id/approve')
  @ApiOperation({ summary: 'Approve withdrawal request (Admin)' })
  @ApiResponse({ status: 200, description: 'Withdrawal approved' })
  @RequirePermissions(PERMISSIONS.WITHDRAWALS.APPROVE)
  async approveWithdrawal(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { transactionRef?: string; notes?: string }
  ) {
    return this.withdrawalsService.process(id, {
      action: WithdrawalAction.APPROVE,
      transactionRef: body.transactionRef,
      notes: body.notes,
    }, req.user.sub);
  }

  @Post('withdrawals/:id/reject')
  @ApiOperation({ summary: 'Reject withdrawal request (Admin)' })
  @ApiResponse({ status: 200, description: 'Withdrawal rejected' })
  @RequirePermissions(PERMISSIONS.WITHDRAWALS.REJECT)
  async rejectWithdrawal(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { reason: string }
  ) {
    return this.withdrawalsService.process(id, {
      action: WithdrawalAction.REJECT,
      rejectReason: body.reason,
    }, req.user.sub);
  }

  @Get('deposits')
  @ApiOperation({ summary: 'Get all deposit requests (Admin)' })
  @ApiResponse({ status: 200, description: 'List of deposit requests' })
  @RequirePermissions(PERMISSIONS.DEPOSITS.READ)
  async getDeposits(@Query() query: QueryDepositDto) {
    return this.depositsService.findAll(query);
  }

  @Get('deposits/stats')
  @ApiOperation({ summary: 'Get deposit statistics (Admin)' })
  @ApiResponse({ status: 200, description: 'Deposit statistics' })
  @RequirePermissions(PERMISSIONS.DEPOSITS.READ)
  async getDepositStats() {
    return this.depositsService.getStats();
  }

  @Get('deposits/:id')
  @ApiOperation({ summary: 'Get deposit request by ID (Admin)' })
  @ApiResponse({ status: 200, description: 'Deposit request details' })
  @RequirePermissions(PERMISSIONS.DEPOSITS.READ)
  async getDeposit(@Param('id') id: string) {
    return this.depositsService.findById(id);
  }

  @Post('deposits/:id/approve')
  @ApiOperation({ summary: 'Approve deposit request (Admin)' })
  @ApiResponse({ status: 200, description: 'Deposit approved' })
  @RequirePermissions(PERMISSIONS.DEPOSITS.APPROVE)
  async approveDeposit(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { notes?: string }
  ) {
    return this.depositsService.process(id, {
      action: DepositAction.APPROVE,
      notes: body.notes,
    }, req.user.sub);
  }

  @Post('deposits/:id/reject')
  @ApiOperation({ summary: 'Reject deposit request (Admin)' })
  @ApiResponse({ status: 200, description: 'Deposit rejected' })
  @RequirePermissions(PERMISSIONS.DEPOSITS.REJECT)
  async rejectDeposit(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { reason: string }
  ) {
    return this.depositsService.process(id, {
      action: DepositAction.REJECT,
      rejectReason: body.reason,
    }, req.user.sub);
  }

  @Get('bets')
  @ApiOperation({ summary: 'Get all bets with pagination and filters (Admin)' })
  @ApiResponse({ status: 200, description: 'List of bets with pagination' })
  @RequirePermissions(PERMISSIONS.BETS.READ)
  async getBets(@Query() query: QueryAdminBetsDto) {
    return this.betsService.getAdminBets(query);
  }

  @Get('bets/:id')
  @ApiOperation({ summary: 'Get bet details by ID (Admin)' })
  @ApiResponse({ status: 200, description: 'Bet details' })
  @RequirePermissions(PERMISSIONS.BETS.READ)
  async getBet(@Param('id') id: string) {
    return this.betsService.getAdminBetById(id);
  }

  @Post('bets/:id/void')
  @ApiOperation({ summary: 'Void a pending bet and refund user (Admin)' })
  @ApiResponse({ status: 200, description: 'Bet voided and refunded' })
  @RequirePermissions(PERMISSIONS.BETS.VOID)
  async voidBet(@Param('id') id: string) {
    return this.betsService.voidBet(id);
  }
}
