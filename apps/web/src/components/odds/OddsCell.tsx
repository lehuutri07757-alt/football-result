'use client';

import { cn } from '@/lib/utils';
import { OddsCell as OddsCellType } from '@/types/odds';

interface OddsCellProps {
  cell?: OddsCellType;
  showLabel?: boolean;
  className?: string;
  onClick?: () => void;
}

export function OddsCell({ cell, showLabel = true, className, onClick }: OddsCellProps) {
  if (!cell) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-2 min-w-[60px]', className)}>
        <span className="text-muted-foreground text-sm">-</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={cell.suspended}
      className={cn(
        'flex flex-col items-center justify-center p-2 min-w-[60px] rounded transition-colors',
        'hover:bg-primary/10 active:bg-primary/20',
        cell.suspended && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {showLabel && (
        <span className="text-xs text-blue-400 font-medium">{cell.label}</span>
      )}
      <span className="text-sm font-bold">{cell.odds.toFixed(2)}</span>
    </button>
  );
}

interface OddsColumnProps {
  home?: OddsCellType;
  away?: OddsCellType;
  draw?: OddsCellType;
  showDraw?: boolean;
  className?: string;
}

export function OddsColumn({ home, away, draw, showDraw = false, className }: OddsColumnProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <OddsCell cell={home} />
      <OddsCell cell={away} />
      {showDraw && <OddsCell cell={draw} />}
    </div>
  );
}
