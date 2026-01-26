import api from './api';
import type { HomeFeed, HomeFeedQuery } from '@/types/home';

export const homeService = {
  getFeed: async (params?: HomeFeedQuery) => {
    const res = await api.get<HomeFeed>('/home/feed', { params });
    return res.data;
  },
};

