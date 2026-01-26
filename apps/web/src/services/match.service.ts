import api from './api';
import { PaginatedResponse, PaginationParams } from './admin.service';

export interface Sport {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  _count?: {
    leagues: number;
    teams: number;
  };
}

export interface League {
  id: string;
  sportId: string;
  sport?: Sport;
  name: string;
  slug: string;
  country?: string;
  countryCode?: string;
  logoUrl?: string;
  season?: string;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  _count?: {
    matches: number;
  };
}

export interface Team {
  id: string;
  sportId: string;
  sport?: Sport;
  name: string;
  shortName?: string;
  slug: string;
  logoUrl?: string;
  country?: string;
  countryCode?: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    homeMatches: number;
    awayMatches: number;
  };
}

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'cancelled' | 'postponed';

export interface Match {
  id: string;
  leagueId: string;
  league?: League;
  homeTeamId: string;
  homeTeam?: Team;
  awayTeamId: string;
  awayTeam?: Team;
  startTime: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  isLive: boolean;
  isFeatured: boolean;
  bettingEnabled: boolean;
  liveMinute?: number;
  period?: string;
  externalId?: string;
  createdAt: string;
  _count?: {
    odds: number;
    betSelections: number;
  };
}

export interface MatchQueryParams extends PaginationParams {
  leagueId?: string;
  sportId?: string;
  teamId?: string;
  status?: MatchStatus;
  isLive?: boolean;
  isFeatured?: boolean;
  bettingEnabled?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateMatchDto {
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  startTime: string;
  status?: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  isLive?: boolean;
  isFeatured?: boolean;
  bettingEnabled?: boolean;
}

export interface UpdateScoreDto {
  homeScore: number;
  awayScore: number;
  liveMinute?: number;
  period?: string;
  status?: MatchStatus;
}

export interface MatchStats {
  matchId: string;
  totalBets: number;
  totalStake: number;
  homeTeam: string;
  awayTeam: string;
  status: string;
}

export const sportsService = {
  async getAll(params?: PaginationParams & { isActive?: boolean }): Promise<PaginatedResponse<Sport>> {
    const response = await api.get<PaginatedResponse<Sport>>('/sports', { params });
    return response.data;
  },

  async getActive(): Promise<Sport[]> {
    const response = await api.get<Sport[]>('/sports/active');
    return response.data;
  },

  async getById(id: string): Promise<Sport> {
    const response = await api.get<Sport>(`/sports/${id}`);
    return response.data;
  },

  async create(data: Partial<Sport>): Promise<Sport> {
    const response = await api.post<Sport>('/sports', data);
    return response.data;
  },

  async update(id: string, data: Partial<Sport>): Promise<Sport> {
    const response = await api.put<Sport>(`/sports/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/sports/${id}`);
  },

  async toggleActive(id: string): Promise<Sport> {
    const response = await api.post<Sport>(`/sports/${id}/toggle-active`);
    return response.data;
  },
};

export const leaguesService = {
  async getAll(params?: PaginationParams & { sportId?: string; isActive?: boolean; isFeatured?: boolean }): Promise<PaginatedResponse<League>> {
    const response = await api.get<PaginatedResponse<League>>('/leagues', { params });
    return response.data;
  },

  async getFeatured(): Promise<League[]> {
    const response = await api.get<League[]>('/leagues/featured');
    return response.data;
  },

  async getBySport(sportId: string): Promise<League[]> {
    const response = await api.get<League[]>(`/leagues/sport/${sportId}`);
    return response.data;
  },

  async getById(id: string): Promise<League> {
    const response = await api.get<League>(`/leagues/${id}`);
    return response.data;
  },

  async create(data: Partial<League>): Promise<League> {
    const response = await api.post<League>('/leagues', data);
    return response.data;
  },

  async update(id: string, data: Partial<League>): Promise<League> {
    const response = await api.put<League>(`/leagues/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/leagues/${id}`);
  },

  async toggleActive(id: string): Promise<League> {
    const response = await api.post<League>(`/leagues/${id}/toggle-active`);
    return response.data;
  },

  async toggleFeatured(id: string): Promise<League> {
    const response = await api.post<League>(`/leagues/${id}/toggle-featured`);
    return response.data;
  },

  async inactiveAll(): Promise<{ message: string; count: number }> {
    const response = await api.post<{ message: string; count: number }>('/leagues/inactive-all');
    return response.data;
  },

  async reorder(items: { id: string; sortOrder: number }[]): Promise<void> {
    await api.post('/leagues/reorder', { items });
  },
};

export const teamsService = {
  async getAll(params?: PaginationParams & { sportId?: string; isActive?: boolean }): Promise<PaginatedResponse<Team>> {
    const response = await api.get<PaginatedResponse<Team>>('/teams', { params });
    return response.data;
  },

  async getBySport(sportId: string): Promise<Team[]> {
    const response = await api.get<Team[]>(`/teams/sport/${sportId}`);
    return response.data;
  },

  async getById(id: string): Promise<Team> {
    const response = await api.get<Team>(`/teams/${id}`);
    return response.data;
  },

  async create(data: Partial<Team>): Promise<Team> {
    const response = await api.post<Team>('/teams', data);
    return response.data;
  },

  async update(id: string, data: Partial<Team>): Promise<Team> {
    const response = await api.put<Team>(`/teams/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/teams/${id}`);
  },

  async toggleActive(id: string): Promise<Team> {
    const response = await api.post<Team>(`/teams/${id}/toggle-active`);
    return response.data;
  },
};

export const matchesService = {
  async getAll(params?: MatchQueryParams): Promise<PaginatedResponse<Match>> {
    const response = await api.get<PaginatedResponse<Match>>('/matches', { params });
    return response.data;
  },

  async getLive(): Promise<Match[]> {
    const response = await api.get<Match[]>('/matches/live');
    return response.data;
  },

  async getUpcoming(limit?: number): Promise<Match[]> {
    const response = await api.get<Match[]>('/matches/upcoming', { params: { limit } });
    return response.data;
  },

  async getToday(): Promise<Match[]> {
    const response = await api.get<Match[]>('/matches/today');
    return response.data;
  },

  async getFeatured(): Promise<Match[]> {
    const response = await api.get<Match[]>('/matches/featured');
    return response.data;
  },

  async getById(id: string): Promise<Match> {
    const response = await api.get<Match>(`/matches/${id}`);
    return response.data;
  },

  async getStats(id: string): Promise<MatchStats> {
    const response = await api.get<MatchStats>(`/matches/${id}/stats`);
    return response.data;
  },

  async create(data: CreateMatchDto): Promise<Match> {
    const response = await api.post<Match>('/matches', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateMatchDto>): Promise<Match> {
    const response = await api.put<Match>(`/matches/${id}`, data);
    return response.data;
  },

  async updateScore(id: string, data: UpdateScoreDto): Promise<Match> {
    const response = await api.put<Match>(`/matches/${id}/score`, data);
    return response.data;
  },

  async start(id: string): Promise<Match> {
    const response = await api.post<Match>(`/matches/${id}/start`);
    return response.data;
  },

  async end(id: string): Promise<Match> {
    const response = await api.post<Match>(`/matches/${id}/end`);
    return response.data;
  },

  async cancel(id: string): Promise<Match> {
    const response = await api.post<Match>(`/matches/${id}/cancel`);
    return response.data;
  },

  async postpone(id: string): Promise<Match> {
    const response = await api.post<Match>(`/matches/${id}/postpone`);
    return response.data;
  },

  async toggleBetting(id: string): Promise<Match> {
    const response = await api.post<Match>(`/matches/${id}/toggle-betting`);
    return response.data;
  },

  async toggleFeatured(id: string): Promise<Match> {
    const response = await api.post<Match>(`/matches/${id}/toggle-featured`);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/matches/${id}`);
  },
};
