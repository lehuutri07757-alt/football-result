'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ChevronUp, X, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBetSlipStore } from '@/stores/betslip.store';

interface FloatingBetSlipProps {
  className?: string;
}

export function FloatingBetSlip({ className }: FloatingBetSlipProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();
  const { 
    items, 
    removeSelection, 
    clearAll, 
    getTotalOdds, 
    getItemCount,
    stake,
    setStake,
    isPlacing,
    error,
    placeBet,
    lastPlacedBet,
    showConfirmation,
    dismissConfirmation,
  } = useBetSlipStore();

  const totalOdds = getTotalOdds();
  const itemCount = getItemCount();
  const potentialWin = stake * totalOdds;

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Don't render until Zustand store has hydrated from localStorage
  // to prevent SSR/client mismatch (hydration error)
  if (!hydrated) return null;

  if (itemCount === 0 && !showConfirmation) return null;

  const handleStakeChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    setStake(isNaN(num) ? 0 : num);
  };

  const handlePlaceBet = async () => {
    await placeBet();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div
      className={cn(
        'fixed right-4 z-40 transition-all duration-300 lg:hidden',
        isExpanded ? 'bottom-24' : 'bottom-20',
        className
      )}
    >
      {isExpanded && (itemCount > 0 || (showConfirmation && lastPlacedBet)) && (
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

          {showConfirmation && lastPlacedBet ? (
            <div className="p-4 space-y-3">
              <div className="flex flex-col items-center py-3">
                <CheckCircle className="h-12 w-12 text-emerald-500 mb-2" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Bet Placed Successfully!</h3>
              </div>
              
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 space-y-2 text-sm">
                {lastPlacedBet.selections.map((sel) => (
                  <div key={sel.id}>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {sel.match?.homeTeam?.name ?? 'Home'} vs {sel.match?.awayTeam?.name ?? 'Away'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {sel.selectionName || sel.selection} @ {sel.oddsValue.toFixed(2)}
                    </p>
                  </div>
                ))}
                
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Stake</span>
                    <span className="font-medium text-slate-900 dark:text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(lastPlacedBet.stake)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Potential Win</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(lastPlacedBet.potentialWin)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => { dismissConfirmation(); router.push('/bets'); }}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Bet History
                </button>
                <button
                  onClick={() => dismissConfirmation()}
                  className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
                >
                  Continue Betting
                </button>
              </div>
            </div>
          ) : (
            <>
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

                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                    Stake (USD)
                  </label>
                  <input
                    type="text"
                    value={stake > 0 ? stake : ''}
                    onChange={(e) => handleStakeChange(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={isPlacing}
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    {[5, 10, 50, 100].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setStake(amount)}
                        className="flex-1 text-[10px] font-medium py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-colors"
                        disabled={isPlacing}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                </div>

                {stake > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Potential Win</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(potentialWin)}
                    </span>
                  </div>
                )}

                {error && (
                  <div className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  onClick={handlePlaceBet}
                  disabled={stake <= 0 || isPlacing || !items[0]?.oddsId}
                  className={cn(
                    'w-full py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]',
                    stake > 0 && !isPlacing
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                  )}
                >
                  {isPlacing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Placing Bet...
                    </span>
                  ) : (
                    'Place Bet'
                  )}
                </button>
              </div>
            </>
          )}
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
