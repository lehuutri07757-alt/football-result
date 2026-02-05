import api from './api';
import { OddsTableResponse, OddsTableRow, OddsQueryParams } from '@/types/odds';

export const oddsService = {
  async getOddsTable(params?: OddsQueryParams): Promise<OddsTableResponse> {
    const response = await api.get<OddsTableResponse>('/api-football/odds', { params });
    return response.data;
  },

  async getLiveOdds(): Promise<OddsTableResponse> {
    const response = await api.get<OddsTableResponse>('/api-football/odds/live');
    return response.data;
  },

  async getTodayOdds(): Promise<OddsTableResponse> {
    const response = await api.get<OddsTableResponse>('/api-football/odds/today');
    return response.data;
  },

  async getFixtureOdds(fixtureId: number): Promise<OddsTableRow | null> {
    const response = await api.get<OddsTableRow | null>(`/api-football/fixtures/${fixtureId}/odds`);
    return response.data;
  },
};
