import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { ApiFootballService } from './api-football.service';
import { OddsSyncResult } from './interfaces';
export declare class OddsSyncService {
    private readonly prisma;
    private readonly redis;
    private readonly apiFootballService;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, apiFootballService: ApiFootballService);
    syncOddsForUpcomingMatches(hoursAhead?: number, onProgress?: (progress: number, processedItems: number, totalItems: number) => Promise<void>): Promise<OddsSyncResult>;
    syncOddsForLiveMatches(onProgress?: (progress: number, processedItems: number, totalItems: number) => Promise<void>): Promise<OddsSyncResult>;
    syncOddsForMatch(matchId: string, fixtureExternalId: string): Promise<OddsSyncResult>;
    syncLiveOddsForMatch(matchId: string, fixtureExternalId: string): Promise<OddsSyncResult>;
    private upsertOdds;
    private getBetTypeMap;
    private mapApiBetIdToBetTypeCode;
    getOddsStats(): Promise<{
        total: number;
        byBetType: Record<string, number>;
    }>;
    invalidateCache(): Promise<void>;
}
