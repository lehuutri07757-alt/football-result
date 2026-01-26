import { Module } from '@nestjs/common';
import { BettingLimitsController } from './betting-limits.controller';
import { BettingLimitsService } from './betting-limits.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BettingLimitsController],
  providers: [BettingLimitsService],
  exports: [BettingLimitsService],
})
export class BettingLimitsModule {}
