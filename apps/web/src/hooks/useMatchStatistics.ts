import { useQuery } from '@tanstack/react-query';
import { matchesService } from '@/services/match.service';

export function useMatchStatistics() {
  return useQuery({
    queryKey: ['match-statistics'],
    queryFn: () => matchesService.getStatistics(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
