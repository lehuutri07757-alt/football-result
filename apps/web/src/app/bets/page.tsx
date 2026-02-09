'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  Receipt,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { betService, BetHistoryParams } from '@/services/bet.service';
import { Bet, BetStatus, PaginatedResponse } from '@/types/bet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_OPTIONS: { label: string; value: BetStatus | 'all' }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chờ xử lý', value: 'pending' },
  { label: 'Thắng', value: 'won' },
  { label: 'Thua', value: 'lost' },
  { label: 'Hủy', value: 'void' },
];

const STATUS_BADGE_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30',
  won: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
  lost: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30',
  void: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400 border-gray-200 dark:border-gray-500/30',
  partial_won: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
  cashout: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200 dark:border-purple-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  won: 'Thắng',
  lost: 'Thua',
  void: 'Hủy',
  partial_won: 'Thắng 1 phần',
  cashout: 'Cashout',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN').format(amount);

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function BetsHistoryPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<BetStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const fetchBets = useCallback(async () => {
    setLoading(true);
    try {
      const params: BetHistoryParams = { page, limit };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await betService.getBets(params);
      const data = response.data as unknown as PaginatedResponse<Bet>;
      setBets(data.data);
      setTotalPages(data.meta.totalPages);
      setTotal(data.meta.total);
    } catch (error) {
      console.error('Failed to fetch bets:', error);
      setBets([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBets();
    }
  }, [isAuthenticated, fetchBets]);

  const handleStatusChange = (status: BetStatus | 'all') => {
    setStatusFilter(status);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Lịch sử cá cược</h1>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {!loading && `${total} cược`}
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-4">
        {/* Filter Bar */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          <Filter size={16} className="text-slate-400 flex-shrink-0" />
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === option.value
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-32 mb-2" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : bets.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              Chưa có cược nào
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
              {statusFilter !== 'all'
                ? `Không tìm thấy cược nào với trạng thái "${STATUS_LABELS[statusFilter] || statusFilter}".`
                : 'Bạn chưa đặt cược nào. Hãy chọn kèo và đặt cược ngay!'}
            </p>
            {statusFilter !== 'all' && (
              <button
                onClick={() => handleStatusChange('all')}
                className="mt-4 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-full hover:bg-emerald-600 transition-colors"
              >
                Xem tất cả
              </button>
            )}
          </div>
        ) : (
          /* Bet List */
          <div className="space-y-3">
            {bets.map((bet) => (
              <div
                key={bet.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md dark:shadow-none dark:border dark:border-slate-800 transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    {bet.selections.map((sel) => (
                      <div key={sel.id} className="mb-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {sel.match.homeTeam.name} vs {sel.match.awayTeam.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {sel.selectionName || sel.selection}
                          {sel.handicap != null ? ` (${sel.handicap})` : ''}
                          {' '}@ <span className="font-medium text-emerald-600 dark:text-emerald-400">{sel.oddsValue.toFixed(2)}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                  <Badge className={`ml-2 flex-shrink-0 text-[10px] ${STATUS_BADGE_STYLES[bet.status] || STATUS_BADGE_STYLES.pending}`}>
                    {STATUS_LABELS[bet.status] || bet.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    {formatDate(bet.placedAt)}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Cược:</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatCurrency(bet.stake)} ₫
                    </span>
                    <span className="mx-1.5 text-slate-300 dark:text-slate-600">→</span>
                    <span className={`text-sm font-bold ${
                      bet.status === 'won' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {bet.status === 'won'
                        ? `${formatCurrency(bet.actualWin)} ₫`
                        : `${formatCurrency(bet.potentialWin)} ₫`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6 pb-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-slate-200 dark:border-slate-700"
            >
              <ChevronLeft size={16} />
              Trước
            </button>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-slate-200 dark:border-slate-700"
            >
              Sau
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
