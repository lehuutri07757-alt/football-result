import { MatchStatus } from '@prisma/client';
export declare class QueryMatchDto {
    page?: number;
    limit?: number;
    search?: string;
    leagueId?: string;
    sportId?: string;
    teamId?: string;
    status?: MatchStatus;
    isLive?: boolean;
    isFeatured?: boolean;
    bettingEnabled?: boolean;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
