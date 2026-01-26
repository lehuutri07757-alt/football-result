export interface LeagueInfo {
  id: number;
  name: string;
  logo: string;
  matchCount: number;
}

export interface CountryLeagueStats {
  countryCode: string;
  countryName: string;
  countryFlag: string | null;
  matchCount: number;
  leagues: LeagueInfo[];
}

export interface TopLeaguesResponse {
  topLeagues: CountryLeagueStats;
  countries: CountryLeagueStats[];
  totalMatches: number;
  lastUpdate: string;
}

export interface TopLeaguesQueryParams {
  date?: string;
}
