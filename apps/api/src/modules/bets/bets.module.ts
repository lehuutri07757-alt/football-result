import { Module } from '@nestjs/common';
import { BetsController } from './bets.controller';
import { BetsService } from './bets.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { BettingLimitsModule } from '../betting-limits/betting-limits.module';

@Module({
  imports: [PrismaModule, BettingLimitsModule],
  controllers: [BetsController],
  providers: [BetsService],
  exports: [BetsService],
})
export class BetsModule {}
