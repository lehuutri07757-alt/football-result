import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { WithdrawalsService } from './withdrawals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWithdrawalDto, ProcessWithdrawalDto, QueryWithdrawalDto } from './dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators';
import { PERMISSIONS } from '../roles/constants/permissions';

@ApiTags('Withdrawals')
@Controller('withdrawals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class WithdrawalsController {
  constructor(private withdrawalsService: WithdrawalsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all withdrawal requests (Admin)' })
  @ApiResponse({ status: 200, description: 'List of withdrawal requests' })
  @RequirePermissions(PERMISSIONS.WITHDRAWALS.READ)
  async findAll(@Query() query: QueryWithdrawalDto) {
    return this.withdrawalsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get withdrawal statistics (Admin)' })
  @ApiResponse({ status: 200, description: 'Withdrawal statistics' })
  @RequirePermissions(PERMISSIONS.WITHDRAWALS.READ)
  async getStats() {
    return this.withdrawalsService.getStats();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my withdrawal requests' })
  @ApiResponse({ status: 200, description: 'User withdrawal requests' })
  async getMyWithdrawals(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.withdrawalsService.findByUser(
      req.user.sub,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create withdrawal request' })
  @ApiResponse({ status: 201, description: 'Withdrawal request created' })
  async create(@Request() req: any, @Body() createDto: CreateWithdrawalDto) {
    return this.withdrawalsService.create(req.user.sub, createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get withdrawal request by ID' })
  @ApiResponse({ status: 200, description: 'Withdrawal request details' })
  @RequirePermissions(PERMISSIONS.WITHDRAWALS.READ)
  async findOne(@Param('id') id: string) {
    return this.withdrawalsService.findById(id);
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Process withdrawal request (Admin)' })
  @ApiResponse({ status: 200, description: 'Withdrawal processed' })
  @RequirePermissions(PERMISSIONS.WITHDRAWALS.APPROVE, PERMISSIONS.WITHDRAWALS.REJECT)
  async process(
    @Request() req: any,
    @Param('id') id: string,
    @Body() processDto: ProcessWithdrawalDto,
  ) {
    return this.withdrawalsService.process(id, processDto, req.user.sub);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel withdrawal request' })
  @ApiResponse({ status: 200, description: 'Withdrawal cancelled' })
  async cancel(@Request() req: any, @Param('id') id: string) {
    return this.withdrawalsService.cancel(id, req.user.sub);
  }
}
