import { useQuery } from '@tanstack/react-query';
import { oddsService } from '@/services/odds.service';
import { OddsQueryParams } from '@/types/odds';

export function useOddsTable(params?: OddsQueryParams) {
  return useQuery({
    queryKey: ['odds', 'table', params],
    queryFn: () => oddsService.getOddsTable(params),
    refetchInterval: params?.live ? 30000 : 120000,
    refetchIntervalInBackground: false,
  });
}

export function useLiveOdds() {
  return useQuery({
    queryKey: ['odds', 'live'],
    queryFn: () => oddsService.getLiveOdds(),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
}

export function useTodayOdds() {
  return useQuery({
    queryKey: ['odds', 'today'],
    queryFn: () => oddsService.getTodayOdds(),
    refetchInterval: 120000,
    refetchIntervalInBackground: false,
  });
}

export function useFixtureOdds(fixtureId: number) {
  return useQuery({
    queryKey: ['odds', 'fixture', fixtureId],
    queryFn: () => oddsService.getFixtureOdds(fixtureId),
    enabled: !!fixtureId,
  });
}
