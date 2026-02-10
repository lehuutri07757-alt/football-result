import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { oddsService } from '@/services/odds.service';
import { OddsQueryParams, OddsTableResponse, LeagueOddsGroup, OddsTableRow, DateOddsGroup } from '@/types/odds';
import { useMemo } from 'react';

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

const ODDS_PAGE_SIZE = 20;

function mergeLeagues(pages: OddsTableResponse[]): LeagueOddsGroup[] {
  const leagueMap = new Map<number, LeagueOddsGroup>();

  for (const page of pages) {
    for (const league of page.leagues) {
      const existing = leagueMap.get(league.leagueId);
      if (existing) {
        const existingFixtureIds = new Set(existing.matches.map((m) => m.fixtureId));
        for (const match of league.matches) {
          if (!existingFixtureIds.has(match.fixtureId)) {
            existing.matches.push(match);
          }
        }
      } else {
        leagueMap.set(league.leagueId, { ...league, matches: [...league.matches] });
      }
    }
  }

  return Array.from(leagueMap.values());
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(date);
}

function groupByDate(leagues: LeagueOddsGroup[]): DateOddsGroup[] {
  const dateMap = new Map<string, OddsTableRow[]>();

  for (const league of leagues) {
    for (const match of league.matches) {
      const dateKey = match.startTime.slice(0, 10);
      const existing = dateMap.get(dateKey);
      if (existing) {
        existing.push(match);
      } else {
        dateMap.set(dateKey, [match]);
      }
    }
  }

  return Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, matches]) => ({
      date,
      dateLabel: formatDateLabel(date),
      matches: matches.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      ),
    }));
}

export function useAllOdds() {
  const query = useInfiniteQuery({
    queryKey: ['odds', 'today'],
    queryFn: ({ pageParam = 1 }) =>
      oddsService.getAllOdds({ page: pageParam, limit: ODDS_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  });

  const mergedData = useMemo(() => {
    if (!query.data?.pages?.length) return undefined;
    const lastPage = query.data.pages[query.data.pages.length - 1];
    const leagues = mergeLeagues(query.data.pages);
    return {
      leagues,
      dateGroups: groupByDate(leagues),
      totalMatches: lastPage.totalMatches,
      hasMore: lastPage.hasMore,
      lastUpdate: lastPage.lastUpdate,
    };
  }, [query.data]);

  return {
    data: mergedData,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    error: query.error,
  };
}

export function useFixtureOdds(fixtureId: number) {
  return useQuery({
    queryKey: ['odds', 'fixture', fixtureId],
    queryFn: () => oddsService.getFixtureOdds(fixtureId),
    enabled: !!fixtureId,
  });
}
