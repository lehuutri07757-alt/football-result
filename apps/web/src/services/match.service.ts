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
  updatedAt: string;
  _count?: {
    matches: number;
  };
}

export interface LeagueStats {
  total: number;
  active: number;
  featured: number;
  matches: number;
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
  recentForm?: string[];
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
  updatedAt: string;
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

  async getStats(params?: { search?: string; sportId?: string; country?: string; isActive?: boolean; isFeatured?: boolean }): Promise<LeagueStats> {
    const response = await api.get<LeagueStats>('/leagues/stats', { params });
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

  async getBySlug(slug: string): Promise<League> {
    const response = await api.get<League>(`/leagues/slug/${slug}`);
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

  async getStatistics(): Promise<{ total: number; live: number; upcoming: number; finished: number }> {
    const response = await api.get<{ total: number; live: number; upcoming: number; finished: number }>('/matches/statistics');
    return response.data;
  },

  async getLive(): Promise<Match[]> {
    const response = await api.get<Match[]>('/matches/live');
    return response.data;
  },

  async getUpcoming(limit?: number): Promise<Match[]> {
    const params = limit !== undefined ? { limit } : undefined;
    const response = await api.get<Match[]>('/matches/upcoming', { params });
    return response.data;
  },

  async getUpcomingPaginated(params?: PaginationParams): Promise<PaginatedResponse<Match>> {
    const response = await api.get<PaginatedResponse<Match>>('/matches/upcoming', { params });
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

// === API-Football sync services ===

export interface FixtureSyncResult {
  totalFetched: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  syncedAt: string;
}

export interface TeamSyncResult {
  totalFetched: number;
  created: number;
  updated: number;
  skipped: number;
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

export interface OddsSyncResult {
  totalMatches: number;
  totalOdds: number;
  created: number;
  updated: number;
  errors: string[];
  syncedAt: string;
}

export interface TeamStatisticsSyncResult {
  totalFetched: number;
  updated: number;
  skipped: number;
  errors: string[];
  syncedAt: string;
}

export const apiFootballSyncService = {
  /**
   * Sync fixtures (matches) from API-Football
   * @param from Start date YYYY-MM-DD (default: today -1)
   * @param to End date YYYY-MM-DD (default: today +7)
   */
  async syncFixtures(from?: string, to?: string): Promise<FixtureSyncResult> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.post<FixtureSyncResult>('/api-football/fixtures/sync', null, { params });
    return response.data;
  },

  /**
   * Sync fixtures for a specific league
   */
  async syncFixturesByLeague(leagueExternalId: number, from?: string, to?: string): Promise<FixtureSyncResult> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.post<FixtureSyncResult>(`/api-football/fixtures/sync/${leagueExternalId}`, null, { params });
    return response.data;
  },

  /**
   * Sync leagues from API-Football
   */
  async syncLeagues(): Promise<LeagueSyncResult> {
    const response = await api.post<LeagueSyncResult>('/api-football/leagues/sync');
    return response.data;
  },

  /**
   * Sync teams for all active leagues
   */
  async syncTeams(): Promise<TeamSyncResult> {
    const response = await api.post<TeamSyncResult>('/api-football/teams/sync');
    return response.data;
  },

  /**
   * Sync teams for a specific league
   */
  async syncTeamsByLeague(leagueExternalId: string, season?: string): Promise<TeamSyncResult> {
    const params: Record<string, string> = {};
    if (season) params.season = season;
    const response = await api.post<TeamSyncResult>(`/api-football/teams/sync/${leagueExternalId}`, null, { params });
    return response.data;
  },

  /**
   * Sync odds for upcoming matches
   */
  async syncUpcomingOdds(hours?: number): Promise<OddsSyncResult> {
    const params: Record<string, string> = {};
    if (hours) params.hours = hours.toString();
    const response = await api.post<OddsSyncResult>('/api-football/odds/sync/upcoming', null, { params });
    return response.data;
  },

  /**
   * Sync live odds
   */
  async syncLiveOdds(): Promise<OddsSyncResult> {
    const response = await api.post<OddsSyncResult>('/api-football/odds/sync/live');
    return response.data;
  },

  /**
   * Get fixtures stats (count by status)
   */
  async getFixturesStats(): Promise<{ total: number; byStatus: Record<string, number> }> {
    const response = await api.get<{ total: number; byStatus: Record<string, number> }>('/api-football/fixtures/stats');
    return response.data;
  },

  /**
   * Sync team statistics (form) for all active leagues
   */
  async syncTeamStatistics(): Promise<TeamStatisticsSyncResult> {
    const response = await api.post<TeamStatisticsSyncResult>('/api-football/teams/statistics/sync');
    return response.data;
  },

  /**
   * Sync team statistics (form) for a specific league
   */
  async syncTeamStatisticsByLeague(leagueExternalId: string, season?: string): Promise<TeamStatisticsSyncResult> {
    const params: Record<string, string> = {};
    if (season) params.season = season;
    const response = await api.post<TeamStatisticsSyncResult>(`/api-football/teams/statistics/sync/${leagueExternalId}`, null, { params });
    return response.data;
  },
};

export interface FeaturedMatchesSettings {
  featuredLeagueIds: string[];
  topTeamRankThreshold: number;
  topTeamIds: string[];
  derbyPairs: { homeTeamId: string; awayTeamId: string; name?: string }[];
  maxFeaturedMatches: number;
  autoSelectEnabled: boolean;
  includeUpcoming: boolean;
  includeLive: boolean;
  upcomingHours: number;
}

export interface FeaturedMatchesStats {
  totalFeatured: number;
  byLeague: { leagueId: string; leagueName: string; count: number }[];
  byStatus: { status: string; count: number }[];
  liveCount: number;
  upcomingCount: number;
}

export interface StandingTeam {
  position: number;
  team: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: string | null;
}

export interface StandingsResponse {
  standings: StandingTeam[];
  league: {
    id: string;
    name: string;
    logoUrl: string | null;
  } | null;
}

export interface StandingsSyncResult {
  totalFetched: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  syncedAt: string;
}

export const standingsService = {
  async getByLeagueId(leagueId: string, season?: string): Promise<StandingsResponse> {
    const params: Record<string, string> = {};
    if (season) params.season = season;
    const response = await api.get<StandingsResponse>(`/standings/league/${leagueId}`, { params });
    return response.data;
  },

  async getByExternalLeagueId(externalLeagueId: string, season?: string): Promise<StandingsResponse> {
    const params: Record<string, string> = {};
    if (season) params.season = season;
    const response = await api.get<StandingsResponse>(`/standings/external/${externalLeagueId}`, { params });
    return response.data;
  },

  async syncAll(): Promise<StandingsSyncResult> {
    const response = await api.post<StandingsSyncResult>('/standings/sync');
    return response.data;
  },

  async syncByLeague(externalLeagueId: string, season?: string): Promise<StandingsSyncResult> {
    const params: Record<string, string> = {};
    if (season) params.season = season;
    const response = await api.post<StandingsSyncResult>(`/standings/sync/${externalLeagueId}`, null, { params });
    return response.data;
  },

  async invalidateCache(): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>('/standings/cache/invalidate');
    return response.data;
  },
};

export const featuredMatchesService = {
  async getFeaturedMatches(): Promise<Match[]> {
    const response = await api.get<Match[]>('/featured-matches');
    return response.data;
  },

  async getSettings(): Promise<FeaturedMatchesSettings> {
    const response = await api.get<FeaturedMatchesSettings>('/featured-matches/settings');
    return response.data;
  },

  async updateSettings(settings: Partial<FeaturedMatchesSettings>): Promise<FeaturedMatchesSettings> {
    const response = await api.put<FeaturedMatchesSettings>('/featured-matches/settings', settings);
    return response.data;
  },

  async getStats(): Promise<FeaturedMatchesStats> {
    const response = await api.get<FeaturedMatchesStats>('/featured-matches/stats');
    return response.data;
  },

  async autoSelect(): Promise<{ updated: number }> {
    const response = await api.post<{ updated: number }>('/featured-matches/auto-select');
    return response.data;
  },

  async toggleFeatured(matchId: string): Promise<Match> {
    const response = await api.post<Match>(`/featured-matches/toggle/${matchId}`);
    return response.data;
  },

  async batchUpdate(matchIds: string[], featured: boolean): Promise<{ updated: number }> {
    const response = await api.post<{ updated: number }>('/featured-matches/batch-update', {
      matchIds,
      featured,
    });
    return response.data;
  },

  async getAvailableLeagues(): Promise<League[]> {
    const response = await api.get<League[]>('/featured-matches/available-leagues');
    return response.data;
  },

  async getAvailableTeams(leagueId?: string): Promise<Team[]> {
    const params = leagueId ? { leagueId } : undefined;
    const response = await api.get<Team[]>('/featured-matches/available-teams', { params });
    return response.data;
  },
};
