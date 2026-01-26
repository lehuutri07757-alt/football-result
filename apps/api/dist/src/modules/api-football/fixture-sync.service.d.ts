import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { ApiFootballService } from './api-football.service';
import { ApiFixture, FixtureSyncResult } from './interfaces';
export declare class FixtureSyncService {
    private readonly prisma;
    private readonly redis;
    private readonly apiFootballService;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, apiFootballService: ApiFootballService);
    syncFixturesByDate(dateFrom: string, dateTo: string): Promise<FixtureSyncResult>;
    syncFixturesForLeague(leagueExternalId: number, dateFrom: string, dateTo: string): Promise<FixtureSyncResult>;
    syncSingleFixture(apiFixture: ApiFixture): Promise<{
        created?: boolean;
        updated?: boolean;
        skipped?: boolean;
    }>;
    private fetchFixturesForLeagueAndDate;
    private fetchFixturesForDate;
    private findTeamByExternalId;
    private mapFixtureStatus;
    getFixturesCount(): Promise<{
        total: number;
        byStatus: Record<string, number>;
    }>;
    invalidateCache(): Promise<void>;
}
