import { useQuery } from '@tanstack/react-query';
import { homeService } from '@/services/home.service';
import type { HomeFeedQuery } from '@/types/home';

export function useHomeFeed(params?: HomeFeedQuery) {
  return useQuery({
    queryKey: ['home', 'feed', params],
    queryFn: () => homeService.getFeed(params),
    refetchInterval: 8000,
    staleTime: 8000,
    refetchIntervalInBackground: false,
  });
}

