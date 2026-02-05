'use client';

import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OddsTableRow, OddsCell } from '@/types/odds';
import { Bet365OddsPair, Bet365ThreeWayOdds } from './Bet365OddsButton';

export interface BetSelection {
  fixtureId: number;
  matchName: string;
  market: string;
  selection: string;
  odds: number;
  handicap?: string;
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tmr';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
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
  });

  const getBetKey = (market: string, selection: string) =>
    `${match.fixtureId}-${market}-${selection}`;

  const isSelected = (market: string, selection: string) =>
    selectedBets?.has(getBetKey(market, selection));

  const handleHdpSelect = (key: 'home' | 'away', cell: OddsCell) => {
    const selectionName = key === 'home' ? match.homeTeam.name : match.awayTeam.name;
    const selection = createSelection('hdp', key, `HDP ${selectionName} ${cell.handicap}`, cell);
    onSelectBet?.(selection);
  };

  const handle1X2Select = (key: '1' | 'X' | '2', cell: OddsCell) => {
    const selectionNames: Record<string, string> = {
      '1': match.homeTeam.name,
      'X': 'Draw',
      '2': match.awayTeam.name,
    };
    const selection = createSelection('1x2', key, selectionNames[key], cell);
    onSelectBet?.(selection);
  };

  const getHdpSelectedKey = (): string | null => {
    if (isSelected('hdp', 'home')) return 'home';
    if (isSelected('hdp', 'away')) return 'away';
    return null;
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
        'flex items-center gap-2 py-2 px-3 border-b border-slate-100 dark:border-slate-800',
        'hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors',
        isLive && 'bg-red-50/50 dark:bg-red-950/10'
      )}
    >
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
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {formatDate(match.startTime)}
            </span>
          </div>
        )}
      </div>

      <Link
        href={`/matches/${match.fixtureId}`}
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
        <div className="hidden xl:flex items-center gap-1.5 w-32 flex-shrink-0">
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

      <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">
            HDP
          </span>
          {match.hdp ? (
            <Bet365OddsPair
              homeLabel="H"
              awayLabel="A"
              homeOdds={match.hdp.home}
              awayOdds={match.hdp.away}
              selectedKey={getHdpSelectedKey()}
              onSelect={handleHdpSelect}
              size="sm"
            />
          ) : (
            <div className="flex gap-1">
              <div className="min-w-[52px] py-1.5 px-2 bg-slate-100 dark:bg-slate-800 rounded-md text-center text-slate-400 text-sm">
                -
              </div>
              <div className="min-w-[52px] py-1.5 px-2 bg-slate-100 dark:bg-slate-800 rounded-md text-center text-slate-400 text-sm">
                -
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">
            1X2
          </span>
          {match.oneXTwo ? (
            <Bet365ThreeWayOdds
              homeOdds={match.oneXTwo.home}
              drawOdds={match.oneXTwo.draw ?? null}
              awayOdds={match.oneXTwo.away}
              selectedKey={get1X2SelectedKey()}
              onSelect={handle1X2Select}
              size="sm"
            />
          ) : (
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="min-w-[52px] py-1.5 px-2 bg-slate-100 dark:bg-slate-800 rounded-md text-center text-slate-400 text-sm"
                >
                  -
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden lg:flex items-center justify-center w-12 flex-shrink-0">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            +{match.totalMarkets}
          </span>
        </div>
      </div>

      <div className="flex sm:hidden items-center gap-1 flex-shrink-0">
        {match.oneXTwo ? (
          <Bet365ThreeWayOdds
            homeOdds={match.oneXTwo.home}
            drawOdds={match.oneXTwo.draw ?? null}
            awayOdds={match.oneXTwo.away}
            selectedKey={get1X2SelectedKey()}
            onSelect={handle1X2Select}
            size="sm"
          />
        ) : (
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="min-w-[44px] py-1.5 px-1 bg-slate-100 dark:bg-slate-800 rounded text-center text-slate-400 text-xs"
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
