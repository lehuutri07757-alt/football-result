'use client';

import { cn } from '@/lib/utils';
import { FlashscoreMatchListData } from '@/types/flashscore';
import { FlashscoreLeagueGroup } from './FlashscoreLeagueGroup';

interface FlashscoreMatchListProps {
  data?: FlashscoreMatchListData;
  isLoading?: boolean;
  error?: Error | null;
  title?: string;
  onFavoriteToggle?: (matchId: string) => void;
  onMatchClick?: (matchId: string) => void;
  onOddsClick?: (matchId: string, market: string, selection: string) => void;
  onMarketsClick?: (matchId: string) => void;
  className?: string;
}

export function FlashscoreMatchList({
  data,
  isLoading,
  error,
  title = 'Matches',
  onFavoriteToggle,
  onMatchClick,
  onOddsClick,
  onMarketsClick,
  className,
}: FlashscoreMatchListProps) {
  if (isLoading) {
    return <FlashscoreMatchListSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load matches. Please try again.
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
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <span className="text-sm text-muted-foreground">
          {data.totalMatches} matches • Updated {new Date(data.lastUpdate).toLocaleTimeString()}
        </span>
      </div>

      {data.leagues.map((league) => (
        <FlashscoreLeagueGroup
          key={league.id}
          league={league}
          onFavoriteToggle={onFavoriteToggle}
          onMatchClick={onMatchClick}
          onOddsClick={onOddsClick}
          onMarketsClick={onMarketsClick}
        />
      ))}
    </div>
  );
}

function FlashscoreMatchListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse"
        >
          <div className="h-12 bg-slate-700" />
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {[1, 2].map((j) => (
              <div key={j} className="flex items-center gap-4 p-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-40" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-36" />
                  </div>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map((k) => (
                    <div key={k} className="w-[60px] h-[52px] bg-slate-200 dark:bg-slate-700 rounded" />
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
