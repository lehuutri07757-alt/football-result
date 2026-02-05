'use client';

import { Trophy, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeagueOddsGroup, OddsTableRow } from '@/types/odds';
import { Bet365MatchRow, BetSelection } from './Bet365MatchRow';

export interface Bet365OddsTableProps {
  leagues: LeagueOddsGroup[];
  isLoading?: boolean;
  selectedBets?: Map<string, BetSelection>;
  onSelectBet?: (selection: BetSelection) => void;
  onRefresh?: () => void;
  lastUpdate?: string;
  className?: string;
}

export function Bet365OddsTable({
  leagues,
  isLoading = false,
  selectedBets,
  onSelectBet,
  onRefresh,
  lastUpdate,
  className,
}: Bet365OddsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-slate-500 dark:text-slate-400">Loading odds...</span>
      </div>
    );
  }

  if (leagues.length === 0) {
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
      <div className="hidden sm:flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
          <span className="w-14 text-center">Time</span>
          <span className="flex-1">Match</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3">
            <span className="w-[116px] text-center text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
              Asian HDP
            </span>
            <span className="w-[168px] text-center text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
              1X2
            </span>
            <span className="hidden lg:block w-12 text-center text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
              More
            </span>
          </div>
        </div>
      </div>

      {leagues.map((league) => (
        <div key={league.leagueId} className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700">
            {league.leagueLogo ? (
              <img src={league.leagueLogo} alt={league.leagueName} className="h-5 w-5 object-contain" />
            ) : (
              <Trophy className="h-4 w-4 text-slate-400" />
            )}
            <span className="font-semibold text-sm text-slate-900 dark:text-white">
              {league.leagueName}
            </span>
            {league.country && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                • {league.country}
              </span>
            )}
            <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {league.matches.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {league.matches.map((match) => (
              <Bet365MatchRow
                key={match.fixtureId}
                match={match}
                selectedBets={selectedBets}
                onSelectBet={onSelectBet}
              />
            ))}
          </div>
        </div>
      ))}

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
