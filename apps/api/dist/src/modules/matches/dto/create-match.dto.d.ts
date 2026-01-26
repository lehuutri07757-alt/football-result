import { MatchStatus } from '@prisma/client';
export declare class CreateMatchDto {
    leagueId: string;
    homeTeamId: string;
    awayTeamId: string;
    startTime: string;
    status?: MatchStatus;
    homeScore?: number;
    awayScore?: number;
    isLive?: boolean;
    isFeatured?: boolean;
    bettingEnabled?: boolean;
    liveMinute?: number;
    period?: string;
    externalId?: string;
}
