export type BetStatus = 'pending' | 'won' | 'lost' | 'void' | 'partial_won' | 'cashout';

export type SelectionResult = 'pending' | 'won' | 'lost' | 'void' | 'half_won' | 'half_lost';

export interface BetMatchInfo {
  id: string;
  startTime: string;
  status: string;
  homeScore?: number | null;
  awayScore?: number | null;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  league: { id: string; name: string };
}

export interface BetSelectionItem {
  id: string;
  oddsId: string;
  matchId: string;
  oddsValue: number | string;
  selection: string;
  selectionName?: string | null;
  handicap?: number | null;
  result: SelectionResult;
  betTypeCode?: string | null;
  match: BetMatchInfo;
}

export interface Bet {
  id: string;
  betType: string;
  stake: number;
  totalOdds: number;
  potentialWin: number;
  actualWin: number;
  status: BetStatus;
  placedAt: string;
  settledAt?: string | null;
  selections: BetSelectionItem[];
}

export interface BetPlacementBalance {
  realBalance: number;
  bonusBalance: number;
  totalAvailable: number;
  currency: string;
}

export interface PlaceBetRequest {
  oddsId: string;
  stake: number;
  idempotencyKey: string;
}

export interface PlaceBetResponse {
  duplicate: boolean;
  bet: Bet;
  balance?: BetPlacementBalance;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

