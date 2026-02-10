'use client';

import { Calendar, Trophy, Loader2, RefreshCw, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { useLanguageStore } from '@/stores/language.store';
import { DateOddsGroup } from '@/types/odds';
import { Bet365MatchRow, BetSelection } from './Bet365MatchRow';

export interface Bet365OddsTableProps {
  dateGroups: DateOddsGroup[];
  isLoading?: boolean;
  selectedBets?: Map<string, BetSelection>;
  onSelectBet?: (selection: BetSelection) => void;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  lastUpdate?: string;
  className?: string;
}

export function Bet365OddsTable({
  dateGroups,
  isLoading = false,
  selectedBets,
  onSelectBet,
  onRefresh,
  onLoadMore,
  hasMore = false,
  isFetchingMore = false,
  lastUpdate,
  className,
}: Bet365OddsTableProps) {
  const language = useLanguageStore((s) => s.language);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-slate-500 dark:text-slate-400">Loading odds...</span>
      </div>
    );
  }

  if (dateGroups.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        <Trophy className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No odds available</h3>
        <p className="text-slate-500 dark:text-slate-400">Check back later for updated odds.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {dateGroups.map((group) => (
        <div key={group.date} className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="grid grid-cols-[1fr_minmax(0,1.2fr)] items-center px-3 py-2.5 bg-slate-100 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span className="font-semibold text-sm text-slate-900 dark:text-white">
                {group.dateLabel}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {group.matches.length}
              </span>
            </div>
            <div className="hidden sm:grid grid-cols-3 gap-1">
              <span className="text-center text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">1</span>
              <span className="text-center text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">X</span>
              <span className="text-center text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">2</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {group.matches.map((match) => (
              <Bet365MatchRow
                key={match.fixtureId}
                match={match}
                selectedBets={selectedBets}
                onSelectBet={onSelectBet}
                showLeague
              />
            ))}
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={onLoadMore}
            disabled={isFetchingMore}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t(language, 'common.loading')}</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span>{t(language, 'results.loadMore')}</span>
              </>
            )}
          </button>
        </div>
      )}

      {lastUpdate && (
        <div className="flex items-center justify-center gap-2 py-3 text-xs text-slate-500 dark:text-slate-400">
          <span>Last updated: {new Date(lastUpdate).toLocaleTimeString()}</span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
