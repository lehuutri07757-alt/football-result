import { MatchStatus } from '@prisma/client';
export declare class UpdateScoreDto {
    homeScore: number;
    awayScore: number;
    liveMinute?: number;
    period?: string;
    status?: MatchStatus;
}
