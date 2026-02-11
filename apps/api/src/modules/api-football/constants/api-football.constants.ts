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

/**
 * Football seasons run Aug-May. API-Football uses the starting year (e.g., 2025 for 2025-2026).
 * Jan-Jul → previous year's season | Aug-Dec → current year's season
 */
export function getCurrentFootballSeason(): number {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const SEASON_START_MONTH = 7; // August (0-indexed)
  
  return month < SEASON_START_MONTH ? year - 1 : year;
}

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

// ============================================================
// SYNC CONFIGURATION - Configurable via Settings
// ============================================================

export const SETTING_KEYS = {
  SYNC_CONFIG: 'api_football.sync_config',
  LEAGUE_SYNC_CONFIG: 'league_sync_config', // backward compatible
} as const;

/**
 * Sync configuration interface for all API-Football sync jobs
 * All intervals are in MINUTES
 */
export interface ApiFootballSyncConfig {
  // Fixture sync settings
  fixture: {
    intervalMinutes: number;      // How often to sync fixtures (default: 120)
    pastDays: number;             // Days in the past to sync (default: 1)
    futureDays: number;           // Days in the future to sync (default: 1)
    enabled: boolean;
  };

  // Live odds sync settings
  liveOdds: {
    intervalMinutes: number;      // How often to sync live odds (default: 15)
    maxMatchesPerSync: number;    // Max live matches to sync at once (default: 15)
    enabled: boolean;
  };

  // Upcoming/pre-match odds sync settings (near: within threshold)
  upcomingOdds: {
    intervalMinutes: number;      // How often to sync near upcoming odds (default: 120)
    hoursAhead: number;           // Near threshold in hours (default: 24)
    maxMatchesPerSync: number;    // Max matches to sync at once (default: 20)
    enabled: boolean;
  };

  // Far upcoming odds sync settings (beyond near threshold, up to maxDaysAhead)
  farOdds: {
    intervalMinutes: number;      // How often to sync far odds (default: 270 = 4.5 hours)
    maxDaysAhead: number;         // Max days ahead to look for matches (default: 14)
    maxMatchesPerSync: number;    // Max matches to sync at once (default: 30)
    enabled: boolean;
  };

  // League sync settings
  league: {
    intervalMinutes: number;      // Auto sync interval (default: 1440 = once per day)
    enabled: boolean;
  };

  // Team sync settings  
  team: {
    intervalMinutes: number;      // Auto sync interval (default: 1440 = once per day)
    enabled: boolean;
  };

  // Standings sync settings
  standings: {
    intervalMinutes: number;      // Auto sync interval (default: 720 = twice per day)
    enabled: boolean;
  };

  // Rate limiting
  rateLimit: {
    requestsPerMinute: number;    // Max requests per minute (default: 300)
    dailyLimit: number;           // Daily quota (default: 7500)
    delayBetweenRequests: number; // Delay in ms between sequential requests (default: 200)
  };
}

/**
 * Default sync configuration - optimized for 7500 requests/day quota
 * Estimated daily usage: ~1,845 requests (25% of quota)
 */
export const DEFAULT_SYNC_CONFIG: ApiFootballSyncConfig = {
  fixture: {
    intervalMinutes: 120,         // Every 2 hours (was 60)
    pastDays: 1,
    futureDays: 1,
    enabled: true,
  },
  liveOdds: {
    intervalMinutes: 15,          // Every 15 minutes (was 5)
    maxMatchesPerSync: 15,        // Max 15 matches (reduced from 30 to conserve quota)
    enabled: true,
  },
  upcomingOdds: {
    intervalMinutes: 120,         // Every 2 hours (was 30 min)
    hoursAhead: 24,               // Near matches: within 24 hours
    maxMatchesPerSync: 50,        // Max 50 matches (reduced from 150 to conserve quota)
    enabled: true,
  },
  farOdds: {
    intervalMinutes: 270,         // Every 4.5 hours
    maxDaysAhead: 14,
    maxMatchesPerSync: 30,        // Max 30 matches (reduced from 100 to conserve quota)
    enabled: true,
  },
  league: {
    intervalMinutes: 1440,        // Once per day
    enabled: true,
  },
  team: {
    intervalMinutes: 1440,        // Once per day
    enabled: true,
  },
  standings: {
    intervalMinutes: 720,
    enabled: true,
  },
  rateLimit: {
    requestsPerMinute: 300,
    dailyLimit: 7500,
    delayBetweenRequests: 200,    // 200ms delay = max 300/min
  },
};
