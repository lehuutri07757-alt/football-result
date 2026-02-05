export interface Bet365OddsValue {
  value: number;
  suspended?: boolean;
}

export interface Bet365Team {
  id: string;
  name: string;
  logo?: string;
}

export interface Bet365Match {
  id: string;
  startTime: string;
  status: 'scheduled' | 'live' | 'finished';
  homeTeam: Bet365Team;
  awayTeam: Bet365Team;
  homeScore?: number;
  awayScore?: number;
  odds?: {
    home: Bet365OddsValue;
    draw: Bet365OddsValue;
    away: Bet365OddsValue;
  };
  totalMarkets: number;
  hasStats?: boolean;
  hasStream?: boolean;
}

export interface Bet365DateGroup {
  date: string;
  matches: Bet365Match[];
}

export interface Bet365League {
  id: string;
  name: string;
  country?: string;
  logo?: string;
  dateGroups: Bet365DateGroup[];
}

export interface Bet365MatchListData {
  leagues: Bet365League[];
}
