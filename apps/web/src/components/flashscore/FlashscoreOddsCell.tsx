'use client';

import { cn } from '@/lib/utils';
import { FlashscoreOddsValue } from '@/types/flashscore';

interface FlashscoreOddsCellProps {
  odds?: FlashscoreOddsValue;
  onClick?: () => void;
  className?: string;
}

export function FlashscoreOddsCell({ odds, onClick, className }: FlashscoreOddsCellProps) {
  if (!odds) {
    return (
      <div className={cn(
        'flex items-center justify-center w-[60px] h-[44px] text-slate-400',
        className
      )}>
        -
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={odds.suspended}
      className={cn(
        'flex items-center justify-center w-[60px] h-[44px]',
        'text-sm font-medium tabular-nums',
        'border border-slate-200 dark:border-slate-600 rounded',
        'bg-slate-100 dark:bg-slate-700/50',
        'hover:bg-blue-100 hover:border-blue-400 dark:hover:bg-blue-900/40 dark:hover:border-blue-600',
        'transition-colors cursor-pointer',
        odds.suspended && 'opacity-40 cursor-not-allowed',
        className
      )}
    >
      {odds.value.toFixed(odds.value >= 10 ? 2 : 3)}
    </button>
  );
}

interface FlashscoreMarketsBadgeProps {
  count: number;
  onClick?: () => void;
  className?: string;
}

export function FlashscoreMarketsBadge({ count, onClick, className }: FlashscoreMarketsBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center w-[52px] h-[44px]',
        'text-sm font-medium text-blue-600 dark:text-blue-400',
        'hover:text-blue-700 dark:hover:text-blue-300',
        'hover:underline transition-colors cursor-pointer',
        className
      )}
    >
      +{count}
    </button>
  );
}
