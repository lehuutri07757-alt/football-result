'use client';

import { useState } from 'react';
import { ShoppingCart, ChevronUp, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBetSlipStore, BetSlipItem } from '@/stores/betslip.store';

interface FloatingBetSlipProps {
  className?: string;
}

export function FloatingBetSlip({ className }: FloatingBetSlipProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { items, removeSelection, clearAll, getTotalOdds, getItemCount } = useBetSlipStore();

  const totalOdds = getTotalOdds();
  const itemCount = getItemCount();

  if (itemCount === 0) return null;

  return (
    <div
      className={cn(
        'fixed right-4 z-40 transition-all duration-300 lg:hidden',
        isExpanded ? 'bottom-24' : 'bottom-20',
        className
      )}
    >
      {isExpanded && itemCount > 0 && (
        <div className="mb-2 w-80 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center justify-between px-4 py-3 bg-emerald-500 text-white">
            <span className="font-semibold text-sm">Bet Slip ({itemCount})</span>
            <div className="flex items-center gap-2">
              <button
                onClick={clearAll}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                title="Clear all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-3 space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                    {item.matchName}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.market.toUpperCase()}: {item.selection}
                    {item.handicap && ` (${item.handicap})`}
                  </p>
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  {item.odds.toFixed(2)}
                </span>
                <button
                  onClick={() => removeSelection(item.id)}
                  className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors flex-shrink-0"
                >
                  <X className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Total Odds</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {totalOdds.toFixed(2)}
              </span>
            </div>
            <button
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors active:scale-[0.98]"
            >
              Place Bet
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'relative flex items-center justify-center rounded-full shadow-lg transition-all active:scale-95',
          'h-14 w-14 bg-emerald-500 hover:bg-emerald-600 text-white'
        )}
      >
        <ShoppingCart className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      </button>
    </div>
  );
}
