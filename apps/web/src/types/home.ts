import type { MatchStatus } from '@/services/match.service';

export interface HomeFeedQuery {
  sportId?: string;
  limit?: number;
}

export interface HomeLeague {
  id: string;
  name: string;
  slug: string;
  country?: string | null;
  countryCode?: string | null;
  logoUrl?: string | null;
  liveMatchCount: number;
}

export interface HomeTeam {
  id: string;
  name: string;
  logoUrl?: string | null;
}

export interface HomeMatch {
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
  homeTeam: HomeTeam;
  awayTeam: HomeTeam;
}

export interface OddsSnapshot {
  betTypeId: string;
  betTypeCode: string;
  selection: string;
  handicap?: string | null;
  oddsValue: string;
}

export interface HomeFeed {
  hotLeagues: HomeLeague[];
  topLiveMatches: HomeMatch[];
  oddsSnapshotByMatchId: Record<string, OddsSnapshot[]>;
  lastUpdate: string;
}

