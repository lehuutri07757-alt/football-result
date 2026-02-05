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
  halftime: { home: number | null; away: number | null };
  fulltime: { home: number | null; away: number | null };
  extratime: { home: number | null; away: number | null };
  penalty: { home: number | null; away: number | null };
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
    periods: { first: number | null; second: number | null };
    venue: Venue;
    status: FixtureStatus;
  };
  league: ApiLeague;
  teams: { home: ApiTeam; away: ApiTeam };
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
    status: { long: string; elapsed: number; seconds: string };
  };
  league: { id: number; season: number };
  teams: {
    home: { id: number; goals: number };
    away: { id: number; goals: number };
  };
  status: { stopped: boolean; blocked: boolean; finished: boolean };
  update: string;
  odds: OddsMarket[];
}

export type FixtureStatusShort =
  | 'TBD'
  | 'NS'
  | '1H'
  | 'HT'
  | '2H'
  | 'ET'
  | 'BT'
  | 'P'
  | 'SUSP'
  | 'INT'
  | 'FT'
  | 'AET'
  | 'PEN'
  | 'PST'
  | 'CANC'
  | 'ABD'
  | 'AWD'
  | 'WO'
  | 'LIVE';

export const LIVE_STATUSES: FixtureStatusShort[] = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'];
export const FINISHED_STATUSES: FixtureStatusShort[] = ['FT', 'AET', 'PEN'];
export const SCHEDULED_STATUSES: FixtureStatusShort[] = ['TBD', 'NS'];

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

export interface ApiTeamStatistics {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  form: string;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
    };
    against: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
    };
  };
  biggest: {
    streak: { wins: number | null; draws: number | null; loses: number | null };
    wins: { home: string | null; away: string | null };
    loses: { home: string | null; away: string | null };
    goals: { for: { home: number | null; away: number | null }; against: { home: number | null; away: number | null } };
  };
  clean_sheet: { home: number; away: number; total: number };
  failed_to_score: { home: number; away: number; total: number };
}

export interface TeamStatisticsSyncResult {
  totalFetched: number;
  updated: number;
  skipped: number;
  errors: string[];
  syncedAt: string;
}

export interface ApiStandingTeam {
  id: number;
  name: string;
  logo: string;
}

export interface ApiStandingStats {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals: {
    for: number;
    against: number;
  };
}

export interface ApiStandingEntry {
  rank: number;
  team: ApiStandingTeam;
  points: number;
  goalsDiff: number;
  group: string;
  form: string | null;
  status: string;
  description: string | null;
  all: ApiStandingStats;
  home: ApiStandingStats;
  away: ApiStandingStats;
  update: string;
}

export interface ApiStandingsResponse {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number | null;
    standings: ApiStandingEntry[][];
  };
}

export interface StandingsSyncResult {
  totalFetched: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  syncedAt: string;
}
