import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { ApiFootballService } from './api-football.service';
import { ApiLeagueInfo, LeagueSyncResult, LeagueSyncConfig } from './interfaces';
export declare class LeagueSyncService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly redis;
    private readonly apiFootballService;
    private readonly logger;
    private config;
    private syncInterval;
    constructor(prisma: PrismaService, redis: RedisService, apiFootballService: ApiFootballService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    private loadConfig;
    private setupAutoSync;
    private clearAutoSync;
    getConfig(): Promise<LeagueSyncConfig>;
    updateConfig(newConfig: Partial<LeagueSyncConfig>): Promise<LeagueSyncConfig>;
    getCachedLeagues(): Promise<ApiLeagueInfo[] | null>;
    getLeagues(forceRefresh?: boolean): Promise<ApiLeagueInfo[]>;
    syncLeagues(): Promise<LeagueSyncResult>;
    invalidateCache(): Promise<void>;
    private invalidateTopLeaguesCache;
    private fetchLeaguesFromApi;
    private getOrCreateFootballSport;
    private generateSlug;
    triggerManualSync(): Promise<LeagueSyncResult>;
    getSyncStatus(): {
        nextRun: Date | null;
        isEnabled: boolean;
        intervalMinutes: number;
    };
}
