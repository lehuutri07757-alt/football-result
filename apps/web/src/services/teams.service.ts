import api from './api';

export interface Team {
  id: string;
  sportId: string;
  name: string;
  shortName?: string;
  slug: string;
  logoUrl?: string;
  country?: string;
  countryCode?: string;
  externalId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface League {
  id: string;
  sportId?: string;
  name: string;
  slug: string;
  country?: string;
  countryCode?: string;
  logoUrl?: string;
}

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'cancelled' | 'postponed';

export interface TeamMatch {
  id: string;
  startTime: string;
  status: MatchStatus;
  homeTeam: Team;
  awayTeam: Team;
  league?: League;
  homeScore?: number;
  awayScore?: number;
}

export const teamsService = {
  async getById(id: string): Promise<Team> {
    const response = await api.get<Team>(`/teams/${id}`);
    return response.data;
  },

  async getMatches(id: string, type: 'upcoming' | 'finished', limit?: number): Promise<TeamMatch[]> {
    const params = limit !== undefined ? { type, limit } : { type };
    const response = await api.get<TeamMatch[]>(`/teams/${id}/matches`, { params });
    return response.data;
  },
};
