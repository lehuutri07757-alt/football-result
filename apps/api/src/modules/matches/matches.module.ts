import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchesSchedulerService } from './matches-scheduler.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '@/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [MatchesController],
  providers: [MatchesService, MatchesSchedulerService],
  exports: [MatchesService],
})
export class MatchesModule {}
