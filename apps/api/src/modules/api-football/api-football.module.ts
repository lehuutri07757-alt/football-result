import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiFootballController } from './api-football.controller';
import { ApiFootballService } from './api-football.service';
import { LeagueSyncService } from './league-sync.service';
import { TeamSyncService } from './team-sync.service';
import { FixtureSyncService } from './fixture-sync.service';
import { OddsSyncService } from './odds-sync.service';
import { ApiFootballScheduler } from './api-football.scheduler';
import { PrismaModule } from '@/prisma/prisma.module';
import { RedisModule } from '@/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule, ScheduleModule.forRoot()],
  controllers: [ApiFootballController],
  providers: [
    ApiFootballService,
    LeagueSyncService,
    TeamSyncService,
    FixtureSyncService,
    OddsSyncService,
    ApiFootballScheduler,
  ],
  exports: [
    ApiFootballService,
    LeagueSyncService,
    TeamSyncService,
    FixtureSyncService,
    OddsSyncService,
  ],
})
export class ApiFootballModule {}
