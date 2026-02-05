import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { ApiFootballController } from './api-football.controller';
import { ApiFootballService } from './api-football.service';
import { LeagueSyncService } from './league-sync.service';
import { TeamSyncService } from './team-sync.service';
import { TeamStatisticsSyncService } from './team-statistics-sync.service';
import { FixtureSyncService } from './fixture-sync.service';
import { OddsSyncService } from './odds-sync.service';
import { StandingsSyncService } from './standings-sync.service';
import { SyncConfigService } from './sync-config.service';
import { SyncJobService } from './sync-job.service';
import { SyncJobProcessor } from './sync-job.processor';
import { SyncJobController } from './sync-job.controller';
import { StandingsController } from './standings.controller';
import { ApiFootballScheduler } from './api-football.scheduler';
import { PrismaModule } from '@/prisma/prisma.module';
import { RedisModule } from '@/redis/redis.module';
import { SYNC_QUEUE_NAME } from './interfaces';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: SYNC_QUEUE_NAME,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
      },
      settings: {
        lockDuration: 300000,
        lockRenewTime: 150000,
        stalledInterval: 300000,
        maxStalledCount: 3,
      },
    }),
  ],
  controllers: [ApiFootballController, SyncJobController, StandingsController],
  providers: [
    ApiFootballService,
    LeagueSyncService,
    TeamSyncService,
    TeamStatisticsSyncService,
    FixtureSyncService,
    OddsSyncService,
    StandingsSyncService,
    SyncConfigService,
    SyncJobService,
    SyncJobProcessor,
    ApiFootballScheduler,
  ],
  exports: [
    ApiFootballService,
    LeagueSyncService,
    TeamSyncService,
    TeamStatisticsSyncService,
    FixtureSyncService,
    OddsSyncService,
    StandingsSyncService,
    SyncConfigService,
    SyncJobService,
  ],
})
export class ApiFootballModule {}
