import { Controller, Get, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BettingLimitsService } from './betting-limits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateBettingLimitsDto } from './dto';

@ApiTags('Betting Limits')
@Controller('betting-limits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BettingLimitsController {
  constructor(private bettingLimitsService: BettingLimitsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user betting limits' })
  @ApiResponse({ status: 200, description: 'User betting limits' })
  async getMyLimits(@Request() req: any) {
    return this.bettingLimitsService.getUserBettingLimits(req.user.sub);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get current user betting stats and remaining limits' })
  @ApiResponse({ status: 200, description: 'User betting stats' })
  async getMyStats(@Request() req: any) {
    return this.bettingLimitsService.getUserBettingStats(req.user.sub);
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validate a bet amount for current user' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validateBet(@Request() req: any, @Query('amount') amount: string) {
    return this.bettingLimitsService.validateBetAmount(req.user.sub, parseFloat(amount));
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user betting limits (Admin)' })
  @ApiResponse({ status: 200, description: 'User betting limits' })
  async getUserLimits(@Param('userId') userId: string) {
    return this.bettingLimitsService.getUserBettingLimits(userId);
  }

  @Put('users/:userId')
  @ApiOperation({ summary: 'Update user betting limits (Admin)' })
  @ApiResponse({ status: 200, description: 'Updated betting limits' })
  async updateUserLimits(
    @Param('userId') userId: string,
    @Body() updateDto: UpdateBettingLimitsDto,
  ) {
    return this.bettingLimitsService.updateUserBettingLimits(userId, updateDto);
  }

  @Get('users/:userId/stats')
  @ApiOperation({ summary: 'Get user betting stats (Admin)' })
  @ApiResponse({ status: 200, description: 'User betting stats' })
  async getUserStats(@Param('userId') userId: string) {
    return this.bettingLimitsService.getUserBettingStats(userId);
  }

  @Get('agents/:agentId')
  @ApiOperation({ summary: 'Get agent betting limits' })
  @ApiResponse({ status: 200, description: 'Agent betting limits' })
  async getAgentLimits(@Param('agentId') agentId: string) {
    return this.bettingLimitsService.getAgentBettingLimits(agentId);
  }

  @Put('agents/:agentId')
  @ApiOperation({ summary: 'Update agent betting limits' })
  @ApiResponse({ status: 200, description: 'Updated betting limits' })
  async updateAgentLimits(
    @Param('agentId') agentId: string,
    @Body() updateDto: UpdateBettingLimitsDto,
  ) {
    return this.bettingLimitsService.updateAgentBettingLimits(agentId, updateDto);
  }
}
