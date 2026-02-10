'use client';

import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OddsTableRow, OddsCell } from '@/types/odds';
import { Bet365ThreeWayOdds } from './Bet365OddsButton';

export interface BetSelection {
  fixtureId: number;
  matchName: string;
  market: string;
  selection: string;
  odds: number;
  handicap?: string;
  oddsId?: string;
}

export interface Bet365MatchRowProps {
  match: OddsTableRow;
  selectedBets?: Map<string, BetSelection>;
  onSelectBet?: (selection: BetSelection) => void;
  showLeague?: boolean;
}

export function Bet365MatchRow({
  match,
  selectedBets,
  onSelectBet,
  showLeague = false,
}: Bet365MatchRowProps) {
  const isLive = match.isLive;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  };

  const createSelection = (
    market: string,
    selectionKey: string,
    selectionName: string,
    cell: OddsCell
  ): BetSelection => ({
    fixtureId: match.fixtureId,
    matchName: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
    market,
    selection: selectionName,
    odds: cell.odds,
    handicap: cell.handicap,
    oddsId: cell.oddsId,
  });

  const getBetKey = (market: string, selection: string) =>
    `${match.fixtureId}-${market}-${selection}`;

  const isSelected = (market: string, selection: string) =>
    selectedBets?.has(getBetKey(market, selection));

  const handle1X2Select = (key: '1' | 'X' | '2', cell: OddsCell) => {
    const selectionNames: Record<string, string> = {
      '1': match.homeTeam.name,
      'X': 'Draw',
      '2': match.awayTeam.name,
    };
    const selection = createSelection('1x2', key, selectionNames[key], cell);
    onSelectBet?.(selection);
  };

  const get1X2SelectedKey = (): string | null => {
    if (isSelected('1x2', '1')) return '1';
    if (isSelected('1x2', 'X')) return 'X';
    if (isSelected('1x2', '2')) return '2';
    return null;
  };

  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_minmax(0,1fr)] sm:grid-cols-[1fr_minmax(0,1.2fr)] items-center py-2 px-3 border-b border-slate-100 dark:border-slate-800',
        'hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors',
        isLive && 'bg-red-50/50 dark:bg-red-950/10'
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-14 flex-shrink-0 text-center">
          {isLive ? (
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                </span>
                Live
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {match.homeTeam.score ?? 0} - {match.awayTeam.score ?? 0}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {formatTime(match.startTime)}
              </span>
            </div>
          )}
        </div>

        <Link
          href={match.matchId ? `/matches/${match.matchId}` : '#'}
          className="flex-1 min-w-0 group"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {match.homeTeam.logo ? (
                <img src={match.homeTeam.logo} alt="" className="h-4 w-4 object-contain flex-shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              )}
              <span className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {match.homeTeam.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {match.awayTeam.logo ? (
                <img src={match.awayTeam.logo} alt="" className="h-4 w-4 object-contain flex-shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              )}
              <span className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {match.awayTeam.name}
              </span>
            </div>
          </div>
        </Link>

        {showLeague && (
          <div className="hidden sm:flex items-center gap-1.5 w-36 flex-shrink-0">
            {match.leagueName && (
              <>
                <Trophy className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {match.leagueName}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center">
          {match.oneXTwo ? (
            <Bet365ThreeWayOdds
              homeOdds={match.oneXTwo.home}
              drawOdds={match.oneXTwo.draw ?? null}
              awayOdds={match.oneXTwo.away}
              selectedKey={get1X2SelectedKey()}
              onSelect={handle1X2Select}
              size="md"
              fullWidth
              hideLabel
            />
          ) : (
            <div className="grid grid-cols-3 gap-1 w-full">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="py-2 px-2.5 bg-slate-100 dark:bg-slate-800 rounded-md text-center text-slate-400 text-sm"
                >
                  -
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
