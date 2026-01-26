'use client';

import { useTodayOdds, useLiveOdds } from '@/hooks/useOdds';
import { LeagueGroup } from './LeagueGroup';

interface OddsTableProps {
  live?: boolean;
}

export function OddsTable({ live = false }: OddsTableProps) {
  const { data, isLoading, error } = live ? useLiveOdds() : useTodayOdds();

  if (isLoading) {
    return <OddsTableSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load odds. Please try again.
      </div>
    );
  }

  if (!data || data.leagues.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No matches available.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          {live ? 'Live Matches' : 'Today Matches'}
        </h2>
        <span className="text-sm text-muted-foreground">
          {data.totalMatches} matches • Updated {new Date(data.lastUpdate).toLocaleTimeString()}
        </span>
      </div>

      {data.leagues.map((league) => (
        <LeagueGroup key={league.leagueId} league={league} showHalfTime={live} />
      ))}
    </div>
  );
}

function OddsTableSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-border overflow-hidden animate-pulse">
          <div className="h-12 bg-muted" />
          <div className="p-4 space-y-4">
            {[1, 2].map((j) => (
              <div key={j} className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-muted rounded w-48" />
                  <div className="h-6 bg-muted rounded w-40" />
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map((k) => (
                    <div key={k} className="w-16 h-16 bg-muted rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
