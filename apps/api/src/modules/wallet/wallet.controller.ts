import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdjustBalanceDto, TransferDto } from './dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators';
import { PERMISSIONS } from '../roles/constants/permissions';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user wallet' })
  @ApiResponse({ status: 200, description: 'User wallet details' })
  async getMyWallet(@Request() req: any) {
    return this.walletService.getWalletByUserId(req.user.sub);
  }

  @Get('me/balance')
  @ApiOperation({ summary: 'Get current user balance' })
  @ApiResponse({ status: 200, description: 'User balance' })
  async getMyBalance(@Request() req: any) {
    return this.walletService.getBalance(req.user.sub);
  }

  @Get('me/history')
  @ApiOperation({ summary: 'Get current user balance history' })
  @ApiResponse({ status: 200, description: 'Balance history' })
  async getMyHistory(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.getBalanceHistory(
      req.user.sub,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post('me/transfer')
  @ApiOperation({ summary: 'Transfer balance to another user' })
  @ApiResponse({ status: 200, description: 'Transfer successful' })
  async transfer(@Request() req: any, @Body() transferDto: TransferDto) {
    return this.walletService.transfer(req.user.sub, transferDto);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user wallet (Admin)' })
  @ApiResponse({ status: 200, description: 'User wallet details' })
  @RequirePermissions(PERMISSIONS.WALLET.READ)
  async getUserWallet(@Param('userId') userId: string) {
    return this.walletService.getWalletByUserId(userId);
  }

  @Get('users/:userId/balance')
  @ApiOperation({ summary: 'Get user balance (Admin)' })
  @ApiResponse({ status: 200, description: 'User balance' })
  @RequirePermissions(PERMISSIONS.WALLET.READ)
  async getUserBalance(@Param('userId') userId: string) {
    return this.walletService.getBalance(userId);
  }

  @Post('users/:userId/adjust')
  @ApiOperation({ summary: 'Adjust user balance (Admin)' })
  @ApiResponse({ status: 200, description: 'Balance adjusted' })
  @RequirePermissions(PERMISSIONS.WALLET.ADJUST)
  async adjustBalance(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body() adjustDto: AdjustBalanceDto,
  ) {
    return this.walletService.adjustBalance(userId, adjustDto, req.user.sub);
  }

  @Post('users/:userId/bonus')
  @ApiOperation({ summary: 'Add bonus to user (Admin)' })
  @ApiResponse({ status: 200, description: 'Bonus added' })
  @RequirePermissions(PERMISSIONS.WALLET.ADJUST)
  async addBonus(
    @Param('userId') userId: string,
    @Body() body: { amount: number; description?: string },
  ) {
    return this.walletService.addBonus(userId, body.amount, body.description);
  }

  @Get('users/:userId/history')
  @ApiOperation({ summary: 'Get user balance history (Admin)' })
  @ApiResponse({ status: 200, description: 'Balance history' })
  @RequirePermissions(PERMISSIONS.WALLET.READ)
  async getUserHistory(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.getBalanceHistory(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
}
