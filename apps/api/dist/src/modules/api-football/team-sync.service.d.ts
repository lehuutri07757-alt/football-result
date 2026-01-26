import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { ApiFootballService } from './api-football.service';
import { TeamSyncResult } from './interfaces';
export declare class TeamSyncService {
    private readonly prisma;
    private readonly redis;
    private readonly apiFootballService;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, apiFootballService: ApiFootballService);
    syncAllActiveLeagues(): Promise<TeamSyncResult>;
    syncTeamsByLeague(leagueExternalId: string, season?: string): Promise<TeamSyncResult>;
    getTeamsCount(): Promise<{
        total: number;
        byLeague: Record<string, number>;
    }>;
    invalidateCache(): Promise<void>;
    private getOrCreateFootballSport;
    private generateSlug;
}
