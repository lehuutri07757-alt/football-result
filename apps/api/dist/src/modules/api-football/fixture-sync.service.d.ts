import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { ApiFootballService } from './api-football.service';
import { ApiFixture, FixtureSyncResult } from './interfaces';
export declare class FixtureSyncService {
    private readonly prisma;
    private readonly redis;
    private readonly apiFootballService;
    private readonly logger;
    private static readonly MAX_PAST_DAYS;
    private static readonly MAX_FUTURE_DAYS;
    private footballSportId;
    constructor(prisma: PrismaService, redis: RedisService, apiFootballService: ApiFootballService);
    private getOrCreateFootballSport;
    private getOrCreateLeague;
    private getOrCreateTeam;
    private generateSlug;
    private extractCountryCodeFromFlag;
    syncFixturesByDate(dateFrom: string, dateTo: string, onProgress?: (progress: number, processedItems: number, totalItems: number) => Promise<void>): Promise<FixtureSyncResult>;
    syncFixturesForLeague(leagueExternalId: number, dateFrom: string, dateTo: string): Promise<FixtureSyncResult>;
    private syncFixturesBatch;
    syncSingleFixture(apiFixture: ApiFixture): Promise<{
        created?: boolean;
        updated?: boolean;
        skipped?: boolean;
    }>;
    private fetchFixturesForLeagueAndDate;
    private fetchFixturesForDate;
    private mapFixtureStatus;
    getFixturesCount(): Promise<{
        total: number;
        byStatus: Record<string, number>;
    }>;
    invalidateCache(): Promise<void>;
}
