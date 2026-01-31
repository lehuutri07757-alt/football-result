"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiFootballModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const bull_1 = require("@nestjs/bull");
const api_football_controller_1 = require("./api-football.controller");
const api_football_service_1 = require("./api-football.service");
const league_sync_service_1 = require("./league-sync.service");
const team_sync_service_1 = require("./team-sync.service");
const fixture_sync_service_1 = require("./fixture-sync.service");
const odds_sync_service_1 = require("./odds-sync.service");
const sync_config_service_1 = require("./sync-config.service");
const sync_job_service_1 = require("./sync-job.service");
const sync_job_processor_1 = require("./sync-job.processor");
const sync_job_controller_1 = require("./sync-job.controller");
const api_football_scheduler_1 = require("./api-football.scheduler");
const prisma_module_1 = require("../../prisma/prisma.module");
const redis_module_1 = require("../../redis/redis.module");
const interfaces_1 = require("./interfaces");
let ApiFootballModule = class ApiFootballModule {
};
exports.ApiFootballModule = ApiFootballModule;
exports.ApiFootballModule = ApiFootballModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            schedule_1.ScheduleModule.forRoot(),
            bull_1.BullModule.registerQueue({
                name: interfaces_1.SYNC_QUEUE_NAME,
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
        controllers: [api_football_controller_1.ApiFootballController, sync_job_controller_1.SyncJobController],
        providers: [
            api_football_service_1.ApiFootballService,
            league_sync_service_1.LeagueSyncService,
            team_sync_service_1.TeamSyncService,
            fixture_sync_service_1.FixtureSyncService,
            odds_sync_service_1.OddsSyncService,
            sync_config_service_1.SyncConfigService,
            sync_job_service_1.SyncJobService,
            sync_job_processor_1.SyncJobProcessor,
            api_football_scheduler_1.ApiFootballScheduler,
        ],
        exports: [
            api_football_service_1.ApiFootballService,
            league_sync_service_1.LeagueSyncService,
            team_sync_service_1.TeamSyncService,
            fixture_sync_service_1.FixtureSyncService,
            odds_sync_service_1.OddsSyncService,
            sync_config_service_1.SyncConfigService,
            sync_job_service_1.SyncJobService,
        ],
    })
], ApiFootballModule);
//# sourceMappingURL=api-football.module.js.map