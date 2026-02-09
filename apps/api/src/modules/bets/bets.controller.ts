import { Controller, Post, Get, Body, Param, Query, UseGuards, Request, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BetsService } from './bets.service';
import { PlaceBetDto, QueryMyBetsDto } from './dto';

@ApiTags('Bets')
@Controller('bets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BetsController {
  constructor(private betsService: BetsService) {}

  @Post('place')
  @ApiOperation({ summary: 'Place a new bet' })
  @ApiResponse({ status: 201, description: 'Bet placed successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async placeBet(
    @Request() req: any,
    @Body() dto: PlaceBetDto,
    @Headers('x-forwarded-for') ip?: string,
  ) {
    return this.betsService.placeBet(req.user.sub, dto, ip);
  }

  @Get()
  @ApiOperation({ summary: 'Get my bet history' })
  @ApiResponse({ status: 200, description: 'Paginated bet list' })
  async getMyBets(
    @Request() req: any,
    @Query() query: QueryMyBetsDto,
  ) {
    return this.betsService.getUserBets(req.user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bet details' })
  @ApiResponse({ status: 200, description: 'Bet details' })
  @ApiResponse({ status: 404, description: 'Bet not found' })
  async getBetById(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    return this.betsService.getBetById(req.user.sub, id);
  }
}
