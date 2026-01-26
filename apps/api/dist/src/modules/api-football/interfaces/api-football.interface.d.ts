export interface ApiFootballResponse<T> {
    get: string;
    parameters: Record<string, string>;
    errors: string[] | Record<string, string>;
    results: number;
    paging: {
        current: number;
        total: number;
    };
    response: T[];
}
export interface FixtureStatus {
    long: string;
    short: string;
    elapsed: number | null;
    extra?: number | null;
}
export interface Venue {
    id: number | null;
    name: string | null;
    city: string | null;
}
export interface ApiLeague {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round?: string;
}
export interface ApiTeam {
    id: number;
    name: string;
    logo: string;
    winner: boolean | null;
}
export interface Score {
    halftime: {
        home: number | null;
        away: number | null;
    };
    fulltime: {
        home: number | null;
        away: number | null;
    };
    extratime: {
        home: number | null;
        away: number | null;
    };
    penalty: {
        home: number | null;
        away: number | null;
    };
}
export interface Goals {
    home: number | null;
    away: number | null;
}
export interface ApiFixture {
    fixture: {
        id: number;
        referee: string | null;
        timezone: string;
        date: string;
        timestamp: number;
        periods: {
            first: number | null;
            second: number | null;
        };
        venue: Venue;
        status: FixtureStatus;
    };
    league: ApiLeague;
    teams: {
        home: ApiTeam;
        away: ApiTeam;
    };
    goals: Goals;
    score: Score;
}
export interface OddsValue {
    value: string;
    odd: string;
    handicap: string | null;
    main: boolean | null;
    suspended: boolean;
}
export interface OddsMarket {
    id: number;
    name: string;
    values: OddsValue[];
}
export interface BookmakerBets {
    id: number;
    name: string;
    bets: OddsMarket[];
}
export interface ApiOddsResponse {
    league: ApiLeague;
    fixture: {
        id: number;
        timezone: string;
        date: string;
        timestamp: number;
    };
    update: string;
    bookmakers: BookmakerBets[];
}
export interface ApiLiveOddsResponse {
    fixture: {
        id: number;
        status: {
            long: string;
            elapsed: number;
            seconds: string;
        };
    };
    league: {
        id: number;
        season: number;
    };
    teams: {
        home: {
            id: number;
            goals: number;
        };
        away: {
            id: number;
            goals: number;
        };
    };
    status: {
        stopped: boolean;
        blocked: boolean;
        finished: boolean;
    };
    update: string;
    odds: OddsMarket[];
}
export type FixtureStatusShort = 'TBD' | 'NS' | '1H' | 'HT' | '2H' | 'ET' | 'BT' | 'P' | 'SUSP' | 'INT' | 'FT' | 'AET' | 'PEN' | 'PST' | 'CANC' | 'ABD' | 'AWD' | 'WO' | 'LIVE';
export declare const LIVE_STATUSES: FixtureStatusShort[];
export declare const FINISHED_STATUSES: FixtureStatusShort[];
export declare const SCHEDULED_STATUSES: FixtureStatusShort[];
export interface ApiAccountStatus {
    account: {
        firstname: string;
        lastname: string;
        email: string;
    };
    subscription: {
        plan: string;
        end: string;
        active: boolean;
    };
    requests: {
        current: number;
        limit_day: number;
    };
}
export interface ApiLeagueInfo {
    league: {
        id: number;
        name: string;
        type: string;
        logo: string;
    };
    country: {
        name: string;
        code: string | null;
        flag: string | null;
    };
    seasons: Array<{
        year: number;
        start: string;
        end: string;
        current: boolean;
    }>;
}
export interface CountryLeagueStats {
    countryCode: string;
    countryName: string;
    countryFlag: string | null;
    matchCount: number;
    leagues: Array<{
        id: number;
        name: string;
        logo: string;
        matchCount: number;
    }>;
}
export interface TopLeaguesResponse {
    topLeagues: CountryLeagueStats;
    countries: CountryLeagueStats[];
    totalMatches: number;
    lastUpdate: string;
}
export interface ApiTeamInfo {
    team: {
        id: number;
        name: string;
        code: string | null;
        country: string;
        founded: number | null;
        national: boolean;
        logo: string;
    };
    venue: {
        id: number | null;
        name: string | null;
        address: string | null;
        city: string | null;
        capacity: number | null;
        surface: string | null;
        image: string | null;
    };
}
export interface TeamSyncResult {
    totalFetched: number;
    created: number;
    updated: number;
    skipped: number;
    errors: string[];
    syncedAt: string;
}
export interface FixtureSyncResult {
    totalFetched: number;
    created: number;
    updated: number;
    skipped: number;
    errors: string[];
    syncedAt: string;
}
export interface OddsSyncResult {
    totalMatches: number;
    totalOdds: number;
    created: number;
    updated: number;
    errors: string[];
    syncedAt: string;
}
export interface LeagueSyncResult {
    totalFetched: number;
    created: number;
    updated: number;
    errors: string[];
    syncedAt: string;
}
export interface LeagueSyncConfig {
    cacheTtlSeconds: number;
    syncIntervalMinutes: number;
    enableAutoSync: boolean;
    onlyCurrentSeason: boolean;
}
