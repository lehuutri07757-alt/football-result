import { MatchStatus } from '@prisma/client';
declare class HomeTeamEntity {
    id: string;
    name: string;
    logoUrl?: string | null;
}
export declare class HomeLeagueEntity {
    id: string;
    name: string;
    slug: string;
    country?: string | null;
    countryCode?: string | null;
    logoUrl?: string | null;
    liveMatchCount: number;
}
export declare class OddsSnapshotEntity {
    betTypeId: string;
    betTypeCode: string;
    selection: string;
    handicap?: string | null;
    oddsValue: string;
}
export declare class HomeMatchEntity {
    id: string;
    leagueId: string;
    leagueName: string;
    startTime: string;
    status: MatchStatus;
    isLive: boolean;
    liveMinute?: number | null;
    period?: string | null;
    homeScore?: number | null;
    awayScore?: number | null;
    homeTeam: HomeTeamEntity;
    awayTeam: HomeTeamEntity;
}
export declare class HomeFeedEntity {
    hotLeagues: HomeLeagueEntity[];
    topLiveMatches: HomeMatchEntity[];
    oddsSnapshotByMatchId: Record<string, OddsSnapshotEntity[]>;
    lastUpdate: string;
}
export {};
