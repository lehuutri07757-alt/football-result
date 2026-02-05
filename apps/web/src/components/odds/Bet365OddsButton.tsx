'use client';

import { cn } from '@/lib/utils';
import { OddsCell } from '@/types/odds';

export interface Bet365OddsButtonProps {
  label: string;
  odds: number | null;
  handicap?: string;
  suspended?: boolean;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function Bet365OddsButton({
  label,
  odds,
  handicap,
  suspended = false,
  selected = false,
  onClick,
  size = 'md',
}: Bet365OddsButtonProps) {
  const isDisabled = suspended || odds === null;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'relative flex flex-col items-center justify-center transition-all duration-150',
        'border border-slate-200 dark:border-slate-700',
        'rounded-md font-medium',
        size === 'sm' ? 'min-w-[52px] py-1.5 px-2' : 'min-w-[60px] py-2 px-2.5',
        !isDisabled && !selected && [
          'bg-white dark:bg-slate-900',
          'hover:bg-emerald-50 hover:border-emerald-400 dark:hover:bg-emerald-950/30',
          'active:scale-[0.98]',
        ],
        selected && [
          'bg-emerald-500 border-emerald-500 text-white',
          'hover:bg-emerald-600 hover:border-emerald-600',
        ],
        isDisabled && [
          'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60',
        ]
      )}
    >
      <span
        className={cn(
          'text-[10px] font-medium leading-none',
          selected ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400',
          isDisabled && 'text-slate-400 dark:text-slate-500'
        )}
      >
        {handicap || label}
      </span>

      <span
        className={cn(
          'font-bold leading-tight mt-0.5',
          size === 'sm' ? 'text-sm' : 'text-base',
          selected ? 'text-white' : 'text-slate-900 dark:text-slate-100',
          isDisabled && 'text-slate-400 dark:text-slate-500'
        )}
      >
        {suspended ? '-' : odds?.toFixed(2) ?? '-'}
      </span>
    </button>
  );
}

export interface Bet365OddsPairProps {
  homeLabel: string;
  awayLabel: string;
  homeOdds: OddsCell | null;
  awayOdds: OddsCell | null;
  selectedKey?: string | null;
  onSelect?: (key: 'home' | 'away', cell: OddsCell) => void;
  size?: 'sm' | 'md';
}

export function Bet365OddsPair({
  homeLabel,
  awayLabel,
  homeOdds,
  awayOdds,
  selectedKey,
  onSelect,
  size = 'md',
}: Bet365OddsPairProps) {
  return (
    <div className="flex gap-1">
      <Bet365OddsButton
        label={homeLabel}
        odds={homeOdds?.odds ?? null}
        handicap={homeOdds?.handicap}
        suspended={homeOdds?.suspended}
        selected={selectedKey === 'home'}
        onClick={() => homeOdds && onSelect?.('home', homeOdds)}
        size={size}
      />
      <Bet365OddsButton
        label={awayLabel}
        odds={awayOdds?.odds ?? null}
        handicap={awayOdds?.handicap}
        suspended={awayOdds?.suspended}
        selected={selectedKey === 'away'}
        onClick={() => awayOdds && onSelect?.('away', awayOdds)}
        size={size}
      />
    </div>
  );
}

export interface Bet365ThreeWayOddsProps {
  homeOdds: OddsCell | null;
  drawOdds: OddsCell | null;
  awayOdds: OddsCell | null;
  selectedKey?: string | null;
  onSelect?: (key: '1' | 'X' | '2', cell: OddsCell) => void;
  size?: 'sm' | 'md';
}

export function Bet365ThreeWayOdds({
  homeOdds,
  drawOdds,
  awayOdds,
  selectedKey,
  onSelect,
  size = 'md',
}: Bet365ThreeWayOddsProps) {
  return (
    <div className="flex gap-1">
      <Bet365OddsButton
        label="1"
        odds={homeOdds?.odds ?? null}
        suspended={homeOdds?.suspended}
        selected={selectedKey === '1'}
        onClick={() => homeOdds && onSelect?.('1', homeOdds)}
        size={size}
      />
      <Bet365OddsButton
        label="X"
        odds={drawOdds?.odds ?? null}
        suspended={drawOdds?.suspended}
        selected={selectedKey === 'X'}
        onClick={() => drawOdds && onSelect?.('X', drawOdds)}
        size={size}
      />
      <Bet365OddsButton
        label="2"
        odds={awayOdds?.odds ?? null}
        suspended={awayOdds?.suspended}
        selected={selectedKey === '2'}
        onClick={() => awayOdds && onSelect?.('2', awayOdds)}
        size={size}
      />
    </div>
  );
}
