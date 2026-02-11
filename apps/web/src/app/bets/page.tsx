'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  ChevronDown,
  ChevronUp,
  Trophy,
  Target,
  Clock,
  DollarSign,
  SearchX,
  History
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { betService, BetHistoryParams } from '@/services/bet.service';
import { Bet, BetStatus, PaginatedResponse } from '@/types/bet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: { label: string; value: BetStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
  { label: 'Void', value: 'void' },
  { label: 'Partial Won', value: 'partial_won' },
  { label: 'Cashout', value: 'cashout' },
];

const BET_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-500/30 dark:text-yellow-400',
  won: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-500/30 dark:text-emerald-400',
  lost: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-500/30 dark:text-red-400',
  void: 'bg-gray-500/10 text-gray-600 border-gray-200 dark:border-gray-500/30 dark:text-gray-400',
  partial_won: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-500/30 dark:text-blue-400',
  cashout: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-500/30 dark:text-purple-400',
};

const SELECTION_RESULT_COLORS: Record<string, string> = {
  pending: 'text-yellow-600 dark:text-yellow-400',
  won: 'text-emerald-600 dark:text-emerald-400',
  lost: 'text-red-600 dark:text-red-400',
  void: 'text-gray-500 dark:text-gray-400',
  half_won: 'text-blue-600 dark:text-blue-400',
  half_lost: 'text-orange-600 dark:text-orange-400',
};

const SELECTION_RESULT_LABELS: Record<string, string> = {
  pending: 'Pending',
  won: 'Won',
  lost: 'Lost',
  void: 'Void',
  half_won: 'Half Won',
  half_lost: 'Half Lost',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function BetCard({ bet }: { bet: Bet }) {
  const [expanded, setExpanded] = useState(false);

  const isMultiple = bet.selections.length > 1;
  const mainSelection = bet.selections[0];
  const totalOdds = bet.totalOdds;
  
  const toggleExpanded = () => setExpanded(!expanded);

  return (
    <Card className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
      <div 
        onClick={toggleExpanded}
        className="cursor-pointer p-4 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn(
              "font-mono text-[10px] uppercase tracking-wider", 
              isMultiple ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30" : "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
            )}>
              {isMultiple ? `${bet.selections.length} Folds` : 'Single'}
            </Badge>
            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Clock size={12} />
              {formatDate(bet.placedAt)}
            </span>
          </div>
          <Badge className={cn("capitalize text-xs px-2.5 py-0.5", BET_STATUS_COLORS[bet.status] || BET_STATUS_COLORS.pending)}>
            {bet.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {isMultiple ? (
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Multiple Bet
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {bet.selections.length} selections • Total Odds: {Number(totalOdds).toFixed(2)}
                </span>
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                   {mainSelection.selectionName || mainSelection.selection} 
                   {mainSelection.handicap ? ` (${mainSelection.handicap})` : ''}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {mainSelection.match?.homeTeam?.name ?? 'Home'} vs {mainSelection.match?.awayTeam?.name ?? 'Away'}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end shrink-0">
             <span className="text-xs text-slate-400 dark:text-slate-500">Return</span>
             <span className={cn(
               "text-sm font-bold",
               bet.status === 'won' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
             )}>
               {bet.status === 'won' ? formatCurrency(bet.actualWin) : formatCurrency(bet.potentialWin)}
             </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/50 mt-1">
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
             <DollarSign size={12} />
             <span>Stake: <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(bet.stake)}</span></span>
          </div>
          
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
             {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <CardContent className="pt-0 pb-4 px-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-3 mt-3">
            {bet.selections.map((sel) => (
              <div key={sel.id} className="relative pl-3 border-l-2 border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Trophy size={10} />
                    {sel.match?.league?.name ?? 'Unknown League'}
                  </span>
                  <Link 
                    href={`/matches/${sel.matchId}`} 
                    className="text-[10px] text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Match <ChevronRight size={10} />
                  </Link>
                </div>

                <div className="flex justify-between items-start mb-1">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {sel.match?.homeTeam?.name ?? 'Home'} <span className="text-slate-400 mx-1">vs</span> {sel.match?.awayTeam?.name ?? 'Away'}
                  </div>
                  {(sel.match?.homeScore != null && sel.match?.awayScore != null) && (
                    <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                      {sel.match.homeScore} - {sel.match.awayScore}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Target size={12} className="text-slate-400" />
                      {sel.selectionName || sel.selection} 
                      {sel.handicap ? ` (${sel.handicap})` : ''}
                    </span>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-mono text-slate-500 dark:text-slate-400">
                      @{Number(sel.oddsValue).toFixed(2)}
                    </Badge>
                  </div>
                  
                  <div className={cn("text-xs font-medium flex items-center gap-1.5", SELECTION_RESULT_COLORS[sel.result] || "text-slate-500")}>
                    {SELECTION_RESULT_LABELS[sel.result] || sel.result}
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      sel.result === 'won' ? "bg-emerald-500" :
                      sel.result === 'lost' ? "bg-red-500" :
                      sel.result === 'pending' ? "bg-yellow-500" :
                      "bg-slate-400"
                    )} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function BetsHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBets, setTotalBets] = useState(0);

  const [statusFilter, setStatusFilter] = useState<BetStatus | 'all'>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const limit = 10;

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      if (!useAuthStore.getState().isAuthenticated) {
        router.push('/');
      }
    };
    init();
  }, [checkAuth, router]);

  const fetchBets = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const params: BetHistoryParams = { page, limit };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (fromDate) params.fromDate = new Date(fromDate).toISOString();
      if (toDate) params.toDate = new Date(toDate).toISOString();

      const response = await betService.getBets(params);
      const data = response.data as unknown as PaginatedResponse<Bet>;
      
      setBets(data.data);
      setTotalPages(data.meta.totalPages);
      setTotalBets(data.meta.total);
    } catch (error) {
      console.error('Failed to fetch bets:', error);
      setBets([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page, statusFilter, fromDate, toDate]);

  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  const stats = useMemo(() => {
    const pageStake = bets.reduce((acc, bet) => acc + Number(bet.stake), 0);
    const pageWon = bets.reduce((acc, bet) => bet.status === 'won' ? acc + Number(bet.actualWin) : acc, 0);
    return { pageStake, pageWon };
  }, [bets]);

  const handleStatusChange = (status: BetStatus | 'all') => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleDateChange = (type: 'from' | 'to', value: string) => {
    if (type === 'from') setFromDate(value);
    else setToDate(value);
    setPage(1);
  };

  return (
    <div className="min-h-screen pb-20 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="container max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="text-emerald-500" />
              My Bets
            </h1>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Bets</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {loading ? <Skeleton className="h-6 w-8 mx-auto" /> : totalBets}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stake (Page)</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {loading ? <Skeleton className="h-6 w-16 mx-auto" /> : formatCurrency(stats.pageStake).replace('$', '')}
              </span>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-500/5 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Won (Page)</span>
              <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                {loading ? <Skeleton className="h-6 w-16 mx-auto" /> : formatCurrency(stats.pageWon).replace('$', '')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
        
        <div className="space-y-4">
          <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <div className="flex items-center gap-2 w-max">
              <Filter size={14} className="text-slate-400 mr-1" />
              {STATUS_FILTERS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border",
                    statusFilter === option.value
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md transform scale-105"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="space-y-1">
              <Label htmlFor="fromDate" className="text-xs text-slate-500 dark:text-slate-400 font-normal">From</Label>
              <div className="relative">
                <Input 
                  type="date" 
                  id="fromDate"
                  value={fromDate}
                  onChange={(e) => handleDateChange('from', e.target.value)}
                  className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="toDate" className="text-xs text-slate-500 dark:text-slate-400 font-normal">To</Label>
              <div className="relative">
                <Input 
                  type="date" 
                  id="toDate"
                  value={toDate}
                  onChange={(e) => handleDateChange('to', e.target.value)}
                  className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-[300px]">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between mb-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-4" />
                  <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : bets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-4">
                <SearchX className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Bets Found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[250px] mx-auto">
                We couldn't find any bets matching your current filters.
              </p>
              {statusFilter !== 'all' && (
                <Button 
                  variant="outline" 
                  className="mt-6 rounded-full"
                  onClick={() => {
                    handleStatusChange('all');
                    setFromDate('');
                    setToDate('');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {bets.map((bet) => (
                <BetCard key={bet.id} bet={bet} />
              ))}
            </div>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
             <Button
               variant="outline"
               size="sm"
               onClick={() => setPage(p => Math.max(1, p - 1))}
               disabled={page <= 1}
               className="h-9 px-4 gap-2 text-xs"
             >
               <ChevronLeft size={14} /> Previous
             </Button>
             
             <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
               Page {page} of {totalPages}
             </span>
             
             <Button
               variant="outline"
               size="sm"
               onClick={() => setPage(p => Math.min(totalPages, p + 1))}
               disabled={page >= totalPages}
               className="h-9 px-4 gap-2 text-xs"
             >
               Next <ChevronRight size={14} />
             </Button>
          </div>
        )}
      </main>
    </div>
  );
}
