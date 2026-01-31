"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SYNC_CONFIG = exports.SETTING_KEYS = exports.CACHE_KEYS = exports.CACHE_TTL_SECONDS = exports.BET_TYPE_MAPPING = exports.BetTypeCode = exports.DEFAULT_BOOKMAKER_ID = exports.BOOKMAKER_IDS = exports.API_FOOTBALL_BET_IDS = void 0;
exports.API_FOOTBALL_BET_IDS = {
    MATCH_WINNER: 1,
    OVER_UNDER: 2,
    ASIAN_HANDICAP: 3,
    GOALS_OVER_UNDER: 5,
    DOUBLE_CHANCE: 12,
    BOTH_TEAMS_SCORE: 8,
    HOME_TEAM_TOTAL: 16,
    AWAY_TEAM_TOTAL: 17,
    HT_MATCH_WINNER: 13,
    HT_OVER_UNDER: 6,
    HT_ASIAN_HANDICAP: 14,
    HT_DOUBLE_CHANCE: 21,
    HT_BOTH_TEAMS_SCORE: 34,
    SH_MATCH_WINNER: 15,
    SH_OVER_UNDER: 26,
    DRAW_NO_BET: 48,
    RESULT_BTTS: 29,
};
exports.BOOKMAKER_IDS = {
    BET365: 8,
    BWIN: 6,
    UNIBET: 16,
    WILLIAM_HILL: 5,
    PINNACLE: 3,
};
exports.DEFAULT_BOOKMAKER_ID = exports.BOOKMAKER_IDS.BET365;
var BetTypeCode;
(function (BetTypeCode) {
    BetTypeCode["MATCH_WINNER"] = "match_winner";
    BetTypeCode["ASIAN_HANDICAP"] = "asian_handicap";
    BetTypeCode["OVER_UNDER"] = "over_under";
    BetTypeCode["BTTS"] = "btts";
    BetTypeCode["DOUBLE_CHANCE"] = "double_chance";
    BetTypeCode["HOME_TOTAL"] = "home_total";
    BetTypeCode["AWAY_TOTAL"] = "away_total";
    BetTypeCode["HT_MATCH_WINNER"] = "ht_match_winner";
    BetTypeCode["HT_ASIAN_HANDICAP"] = "ht_asian_handicap";
    BetTypeCode["HT_OVER_UNDER"] = "ht_over_under";
})(BetTypeCode || (exports.BetTypeCode = BetTypeCode = {}));
exports.BET_TYPE_MAPPING = {
    [BetTypeCode.MATCH_WINNER]: exports.API_FOOTBALL_BET_IDS.MATCH_WINNER,
    [BetTypeCode.ASIAN_HANDICAP]: exports.API_FOOTBALL_BET_IDS.ASIAN_HANDICAP,
    [BetTypeCode.OVER_UNDER]: exports.API_FOOTBALL_BET_IDS.OVER_UNDER,
    [BetTypeCode.BTTS]: exports.API_FOOTBALL_BET_IDS.BOTH_TEAMS_SCORE,
    [BetTypeCode.DOUBLE_CHANCE]: exports.API_FOOTBALL_BET_IDS.DOUBLE_CHANCE,
    [BetTypeCode.HOME_TOTAL]: exports.API_FOOTBALL_BET_IDS.HOME_TEAM_TOTAL,
    [BetTypeCode.AWAY_TOTAL]: exports.API_FOOTBALL_BET_IDS.AWAY_TEAM_TOTAL,
    [BetTypeCode.HT_MATCH_WINNER]: exports.API_FOOTBALL_BET_IDS.HT_MATCH_WINNER,
    [BetTypeCode.HT_ASIAN_HANDICAP]: exports.API_FOOTBALL_BET_IDS.HT_ASIAN_HANDICAP,
    [BetTypeCode.HT_OVER_UNDER]: exports.API_FOOTBALL_BET_IDS.HT_OVER_UNDER,
};
exports.CACHE_TTL_SECONDS = {
    FIXTURES: 300,
    LIVE_FIXTURES: 30,
    PRE_MATCH_ODDS: 180,
    LIVE_ODDS: 10,
};
exports.CACHE_KEYS = {
    FIXTURES_BY_DATE: (date) => `odds:fixtures:${date}`,
    LIVE_FIXTURES: 'odds:fixtures:live',
    ODDS_BY_FIXTURE: (fixtureId) => `odds:fixture:${fixtureId}`,
    LIVE_ODDS: (fixtureId) => `odds:live:${fixtureId}`,
};
exports.SETTING_KEYS = {
    SYNC_CONFIG: 'api_football.sync_config',
    LEAGUE_SYNC_CONFIG: 'league_sync_config',
};
exports.DEFAULT_SYNC_CONFIG = {
    fixture: {
        intervalMinutes: 120,
        pastDays: 1,
        futureDays: 1,
        enabled: true,
    },
    liveOdds: {
        intervalMinutes: 15,
        maxMatchesPerSync: 15,
        enabled: true,
    },
    upcomingOdds: {
        intervalMinutes: 120,
        hoursAhead: 48,
        maxMatchesPerSync: 20,
        enabled: true,
    },
    league: {
        intervalMinutes: 1440,
        enabled: true,
    },
    team: {
        intervalMinutes: 1440,
        enabled: true,
    },
    rateLimit: {
        requestsPerMinute: 300,
        dailyLimit: 7500,
        delayBetweenRequests: 200,
    },
};
//# sourceMappingURL=api-football.constants.js.map