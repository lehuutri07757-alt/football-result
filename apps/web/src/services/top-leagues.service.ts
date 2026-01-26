import api from './api';
import type { TopLeaguesResponse, TopLeaguesQueryParams } from '@/types/top-leagues';

export const topLeaguesService = {
  getTopLeagues: async (params?: TopLeaguesQueryParams): Promise<TopLeaguesResponse> => {
    const res = await api.get<TopLeaguesResponse>('/api-football/top-leagues', { params });
    return res.data;
  },
};
