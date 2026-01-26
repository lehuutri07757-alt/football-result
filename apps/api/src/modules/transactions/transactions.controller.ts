import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryTransactionDto } from './dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators';
import { PERMISSIONS } from '../roles/constants/permissions';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions (Admin)' })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  @RequirePermissions(PERMISSIONS.REPORTS.VIEW)
  async findAll(@Query() query: QueryTransactionDto) {
    return this.transactionsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get transaction statistics (Admin)' })
  @ApiResponse({ status: 200, description: 'Transaction statistics' })
  @RequirePermissions(PERMISSIONS.REPORTS.VIEW)
  async getStats(@Query('userId') userId?: string) {
    return this.transactionsService.getStats(userId);
  }

  @Get('report')
  @ApiOperation({ summary: 'Get daily transaction report (Admin)' })
  @ApiResponse({ status: 200, description: 'Daily report' })
  @RequirePermissions(PERMISSIONS.REPORTS.EXPORT)
  async getDailyReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.transactionsService.getDailyReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my transactions' })
  @ApiResponse({ status: 200, description: 'User transactions' })
  async getMyTransactions(@Request() req: any, @Query() query: QueryTransactionDto) {
    return this.transactionsService.findByUser(req.user.sub, query);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get my transaction statistics' })
  @ApiResponse({ status: 200, description: 'User transaction statistics' })
  async getMyStats(@Request() req: any) {
    return this.transactionsService.getStats(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction details' })
  async findOne(@Param('id') id: string) {
    return this.transactionsService.findById(id);
  }
}
