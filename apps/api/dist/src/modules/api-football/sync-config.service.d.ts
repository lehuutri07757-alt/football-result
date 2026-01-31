import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ApiFootballSyncConfig } from './constants/api-football.constants';
export declare class SyncConfigService implements OnModuleInit {
    private readonly prisma;
    private readonly logger;
    private config;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    loadConfig(): Promise<void>;
    private mergeConfig;
    private logConfig;
    getConfig(): ApiFootballSyncConfig;
    updateConfig(partial: Partial<ApiFootballSyncConfig>): Promise<ApiFootballSyncConfig>;
    get fixtureConfig(): {
        intervalMinutes: number;
        pastDays: number;
        futureDays: number;
        enabled: boolean;
    };
    get liveOddsConfig(): {
        intervalMinutes: number;
        maxMatchesPerSync: number;
        enabled: boolean;
    };
    get upcomingOddsConfig(): {
        intervalMinutes: number;
        hoursAhead: number;
        maxMatchesPerSync: number;
        enabled: boolean;
    };
    get leagueConfig(): {
        intervalMinutes: number;
        enabled: boolean;
    };
    get teamConfig(): {
        intervalMinutes: number;
        enabled: boolean;
    };
    get rateLimitConfig(): {
        requestsPerMinute: number;
        dailyLimit: number;
        delayBetweenRequests: number;
    };
}
