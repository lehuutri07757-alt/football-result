export declare const API_FOOTBALL_BET_IDS: {
    readonly MATCH_WINNER: 1;
    readonly OVER_UNDER: 2;
    readonly ASIAN_HANDICAP: 3;
    readonly GOALS_OVER_UNDER: 5;
    readonly DOUBLE_CHANCE: 12;
    readonly BOTH_TEAMS_SCORE: 8;
    readonly HOME_TEAM_TOTAL: 16;
    readonly AWAY_TEAM_TOTAL: 17;
    readonly HT_MATCH_WINNER: 13;
    readonly HT_OVER_UNDER: 6;
    readonly HT_ASIAN_HANDICAP: 14;
    readonly HT_DOUBLE_CHANCE: 21;
    readonly HT_BOTH_TEAMS_SCORE: 34;
    readonly SH_MATCH_WINNER: 15;
    readonly SH_OVER_UNDER: 26;
    readonly DRAW_NO_BET: 48;
    readonly RESULT_BTTS: 29;
};
export type BetTypeId = (typeof API_FOOTBALL_BET_IDS)[keyof typeof API_FOOTBALL_BET_IDS];
export declare const BOOKMAKER_IDS: {
    readonly BET365: 8;
    readonly BWIN: 6;
    readonly UNIBET: 16;
    readonly WILLIAM_HILL: 5;
    readonly PINNACLE: 3;
};
export declare const DEFAULT_BOOKMAKER_ID: 8;
export declare enum BetTypeCode {
    MATCH_WINNER = "match_winner",
    ASIAN_HANDICAP = "asian_handicap",
    OVER_UNDER = "over_under",
    BTTS = "btts",
    DOUBLE_CHANCE = "double_chance",
    HOME_TOTAL = "home_total",
    AWAY_TOTAL = "away_total",
    HT_MATCH_WINNER = "ht_match_winner",
    HT_ASIAN_HANDICAP = "ht_asian_handicap",
    HT_OVER_UNDER = "ht_over_under"
}
export declare const BET_TYPE_MAPPING: Record<BetTypeCode, number>;
export declare const CACHE_TTL_SECONDS: {
    readonly FIXTURES: 300;
    readonly LIVE_FIXTURES: 30;
    readonly PRE_MATCH_ODDS: 180;
    readonly LIVE_ODDS: 10;
};
export declare const CACHE_KEYS: {
    readonly FIXTURES_BY_DATE: (date: string) => string;
    readonly LIVE_FIXTURES: "odds:fixtures:live";
    readonly ODDS_BY_FIXTURE: (fixtureId: number) => string;
    readonly LIVE_ODDS: (fixtureId: number) => string;
};
