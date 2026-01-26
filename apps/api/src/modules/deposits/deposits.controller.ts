import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DepositsService } from './deposits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDepositDto, ProcessDepositDto, QueryDepositDto } from './dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators';
import { PERMISSIONS } from '../roles/constants/permissions';

@ApiTags('Deposits')
@Controller('deposits')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class DepositsController {
  constructor(private depositsService: DepositsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all deposit requests (Admin)' })
  @ApiResponse({ status: 200, description: 'List of deposit requests' })
  @RequirePermissions(PERMISSIONS.DEPOSITS.READ)
  async findAll(@Query() query: QueryDepositDto) {
    return this.depositsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get deposit statistics (Admin)' })
  @ApiResponse({ status: 200, description: 'Deposit statistics' })
  @RequirePermissions(PERMISSIONS.DEPOSITS.READ)
  async getStats() {
    return this.depositsService.getStats();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my deposit requests' })
  @ApiResponse({ status: 200, description: 'User deposit requests' })
  async getMyDeposits(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.depositsService.findByUser(
      req.user.sub,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create deposit request' })
  @ApiResponse({ status: 201, description: 'Deposit request created' })
  async create(@Request() req: any, @Body() createDto: CreateDepositDto) {
    return this.depositsService.create(req.user.sub, createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deposit request by ID' })
  @ApiResponse({ status: 200, description: 'Deposit request details' })
  @RequirePermissions(PERMISSIONS.DEPOSITS.READ)
  async findOne(@Param('id') id: string) {
    return this.depositsService.findById(id);
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Process deposit request (Admin)' })
  @ApiResponse({ status: 200, description: 'Deposit processed' })
  @RequirePermissions(PERMISSIONS.DEPOSITS.APPROVE, PERMISSIONS.DEPOSITS.REJECT)
  async process(
    @Request() req: any,
    @Param('id') id: string,
    @Body() processDto: ProcessDepositDto,
  ) {
    return this.depositsService.process(id, processDto, req.user.sub);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel deposit request' })
  @ApiResponse({ status: 200, description: 'Deposit cancelled' })
  async cancel(@Request() req: any, @Param('id') id: string) {
    return this.depositsService.cancel(id, req.user.sub);
  }
}
