export const API_FOOTBALL_BET_IDS = {
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
} as const;

export type BetTypeId = (typeof API_FOOTBALL_BET_IDS)[keyof typeof API_FOOTBALL_BET_IDS];

export const BOOKMAKER_IDS = {
  BET365: 8,
  BWIN: 6,
  UNIBET: 16,
  WILLIAM_HILL: 5,
  PINNACLE: 3,
} as const;

export const DEFAULT_BOOKMAKER_ID = BOOKMAKER_IDS.BET365;

export enum BetTypeCode {
  MATCH_WINNER = 'match_winner',
  ASIAN_HANDICAP = 'asian_handicap',
  OVER_UNDER = 'over_under',
  BTTS = 'btts',
  DOUBLE_CHANCE = 'double_chance',
  HOME_TOTAL = 'home_total',
  AWAY_TOTAL = 'away_total',
  HT_MATCH_WINNER = 'ht_match_winner',
  HT_ASIAN_HANDICAP = 'ht_asian_handicap',
  HT_OVER_UNDER = 'ht_over_under',
}

export const BET_TYPE_MAPPING: Record<BetTypeCode, number> = {
  [BetTypeCode.MATCH_WINNER]: API_FOOTBALL_BET_IDS.MATCH_WINNER,
  [BetTypeCode.ASIAN_HANDICAP]: API_FOOTBALL_BET_IDS.ASIAN_HANDICAP,
  [BetTypeCode.OVER_UNDER]: API_FOOTBALL_BET_IDS.OVER_UNDER,
  [BetTypeCode.BTTS]: API_FOOTBALL_BET_IDS.BOTH_TEAMS_SCORE,
  [BetTypeCode.DOUBLE_CHANCE]: API_FOOTBALL_BET_IDS.DOUBLE_CHANCE,
  [BetTypeCode.HOME_TOTAL]: API_FOOTBALL_BET_IDS.HOME_TEAM_TOTAL,
  [BetTypeCode.AWAY_TOTAL]: API_FOOTBALL_BET_IDS.AWAY_TEAM_TOTAL,
  [BetTypeCode.HT_MATCH_WINNER]: API_FOOTBALL_BET_IDS.HT_MATCH_WINNER,
  [BetTypeCode.HT_ASIAN_HANDICAP]: API_FOOTBALL_BET_IDS.HT_ASIAN_HANDICAP,
  [BetTypeCode.HT_OVER_UNDER]: API_FOOTBALL_BET_IDS.HT_OVER_UNDER,
};

export const CACHE_TTL_SECONDS = {
  FIXTURES: 300,
  LIVE_FIXTURES: 30,
  PRE_MATCH_ODDS: 180,
  LIVE_ODDS: 10,
} as const;

export const CACHE_KEYS = {
  FIXTURES_BY_DATE: (date: string) => `odds:fixtures:${date}`,
  LIVE_FIXTURES: 'odds:fixtures:live',
  ODDS_BY_FIXTURE: (fixtureId: number) => `odds:fixture:${fixtureId}`,
  LIVE_ODDS: (fixtureId: number) => `odds:live:${fixtureId}`,
} as const;
