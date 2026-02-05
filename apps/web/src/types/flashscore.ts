export interface FlashscoreOddsValue {
  value: number;
  suspended?: boolean;
}

export interface FlashscoreDoubleChanceOdds {
  homeOrDraw: FlashscoreOddsValue;
  homeOrAway: FlashscoreOddsValue;
  awayOrDraw: FlashscoreOddsValue;
}

export interface Flashscore1X2Odds {
  home: FlashscoreOddsValue;
  draw: FlashscoreOddsValue;
  away: FlashscoreOddsValue;
}

export interface FlashscoreTeam {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  score: number | null;
  halfTimeScore?: number | null;
}

export interface FlashscoreMatch {
  id: string;
  externalId?: number;
  startTime: string;
  matchMinute?: number;
  period?: string;
  round?: string;
  status: FlashscoreMatchStatus;
  homeTeam: FlashscoreTeam;
  awayTeam: FlashscoreTeam;
  oneXTwo?: Flashscore1X2Odds;
  doubleChance?: FlashscoreDoubleChanceOdds;
  totalMarkets: number;
  isFavorite?: boolean;
  hasStats?: boolean;
  hasLineup?: boolean;
  hasStream?: boolean;
  hasAnalysis?: boolean;
}

export type FlashscoreMatchStatus = 
  | 'scheduled'
  | 'live'
  | 'half_time'
  | 'finished'
  | 'cancelled'
  | 'postponed'
  | 'suspended';

export interface FlashscoreLeague {
  id: string;
  externalId?: number;
  name: string;
  country: string;
  countryCode?: string;
  logo?: string;
  matches: FlashscoreMatch[];
}

export interface FlashscoreMatchListData {
  leagues: FlashscoreLeague[];
  totalMatches: number;
  lastUpdate: string;
}

export interface FlashscoreOddsColumn {
  key: string;
  label: string;
  tooltip?: string;
  hasDropdown?: boolean;
}

export const FLASHSCORE_ODDS_COLUMNS: FlashscoreOddsColumn[] = [
  { key: 'home', label: '1', tooltip: 'Home Win' },
  { key: 'draw', label: 'X', tooltip: 'Draw', hasDropdown: true },
  { key: 'away', label: '2', tooltip: 'Away Win' },
  { key: 'homeOrDraw', label: '1X', tooltip: 'Home or Draw' },
  { key: 'homeOrAway', label: '12', tooltip: 'Home or Away', hasDropdown: true },
  { key: 'awayOrDraw', label: '2X', tooltip: 'Away or Draw' },
  { key: 'markets', label: '+5', tooltip: 'More Markets' },
];
