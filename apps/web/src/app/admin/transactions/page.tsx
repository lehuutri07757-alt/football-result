'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Banknote,
  X,
  User,
} from 'lucide-react';
import { adminService, Transaction, TransactionStats } from '@/services/admin.service';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { useLanguageStore } from '@/stores/language.store';
import { t } from '@/lib/i18n';
import { TableSkeleton } from '@/components/admin/AdminLoading';
import { toast } from 'sonner';

const LIMIT = 20;

const fadeInAnimation = {
  animation: 'fadeIn 0.3s ease-out forwards',
};

const slideUpAnimation = {
  animation: 'slideUp 0.3s ease-out forwards',
};

export default function AdminTransactionsPage() {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';
  const language = useLanguageStore((s) => s.language);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [balanceTypeFilter, setBalanceTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'amount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getTransactions({
        page,
        limit: LIMIT,
        search: searchQuery || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        balanceType: balanceTypeFilter !== 'all' ? (balanceTypeFilter as 'real' | 'bonus') : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
      });
      setTransactions(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter, balanceTypeFilter, startDate, endDate, sortBy, sortOrder, searchQuery]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await adminService.getTransactionStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch transaction stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Debounced search resets page
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleFilterChange = useCallback((setter: (val: string) => void, value: string) => {
    setter(value);
    setPage(1);
  }, []);

  const handleSort = (column: 'createdAt' | 'amount') => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchTransactions(), fetchStats()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeBadge = (type: string) => {
    const darkConfig: Record<string, { bg: string; text: string; label: string; icon: 'up' | 'down' }> = {
      deposit: { bg: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30', text: 'text-emerald-400', label: t(language, 'admin.transactions.deposit'), icon: 'up' },
      withdrawal: { bg: 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30', text: 'text-orange-400', label: t(language, 'admin.transactions.withdrawal'), icon: 'down' },
      bet_placed: { bg: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30', text: 'text-red-400', label: t(language, 'admin.transactions.betPlaced'), icon: 'down' },
      bet_won: { bg: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30', text: 'text-emerald-400', label: t(language, 'admin.transactions.betWon'), icon: 'up' },
      bet_refund: { bg: 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30', text: 'text-blue-400', label: t(language, 'admin.transactions.betRefund'), icon: 'up' },
      bonus: { bg: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30', text: 'text-yellow-400', label: t(language, 'admin.transactions.bonus'), icon: 'up' },
      transfer: { bg: 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-500/30', text: 'text-purple-400', label: t(language, 'admin.transactions.transfer'), icon: 'down' },
      adjustment: { bg: 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 border border-slate-500/30', text: 'text-slate-400', label: t(language, 'admin.transactions.adjustment'), icon: 'up' },
    };
    const lightConfig: Record<string, { bg: string; text: string; label: string; icon: 'up' | 'down' }> = {
      deposit: { bg: 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200', text: 'text-emerald-700', label: t(language, 'admin.transactions.deposit'), icon: 'up' },
      withdrawal: { bg: 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200', text: 'text-orange-700', label: t(language, 'admin.transactions.withdrawal'), icon: 'down' },
      bet_placed: { bg: 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200', text: 'text-red-700', label: t(language, 'admin.transactions.betPlaced'), icon: 'down' },
      bet_won: { bg: 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200', text: 'text-emerald-700', label: t(language, 'admin.transactions.betWon'), icon: 'up' },
      bet_refund: { bg: 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200', text: 'text-blue-700', label: t(language, 'admin.transactions.betRefund'), icon: 'up' },
      bonus: { bg: 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200', text: 'text-yellow-700', label: t(language, 'admin.transactions.bonus'), icon: 'up' },
      transfer: { bg: 'bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200', text: 'text-purple-700', label: t(language, 'admin.transactions.transfer'), icon: 'down' },
      adjustment: { bg: 'bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200', text: 'text-slate-500', label: t(language, 'admin.transactions.adjustment'), icon: 'up' },
    };
    const config = isDark ? darkConfig : lightConfig;
    const fallback = isDark
      ? { bg: 'bg-slate-700 border border-slate-600', text: 'text-slate-400', label: type, icon: 'up' as const }
      : { bg: 'bg-slate-100 border border-slate-200', text: 'text-slate-500', label: type, icon: 'up' as const };
    const c = config[type] || fallback;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text} flex items-center gap-1 w-fit transition-all duration-200 hover:scale-105`}>
        {c.icon === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {c.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const darkStyles: Record<string, string> = {
      completed: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30',
      pending: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30',
      failed: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30',
      cancelled: 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-400 border border-slate-500/30',
    };
    const lightStyles: Record<string, string> = {
      completed: 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200',
      pending: 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200',
      failed: 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200',
      cancelled: 'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-500 border border-slate-200',
    };
    const labels: Record<string, string> = {
      completed: t(language, 'admin.common.completed'),
      pending: t(language, 'admin.common.pending'),
      failed: t(language, 'admin.common.failed'),
      cancelled: t(language, 'admin.common.cancelled'),
    };
    const styles = isDark ? darkStyles : lightStyles;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || (isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500')} transition-all duration-200 hover:scale-105`}>
        {labels[status] || status}
      </span>
    );
  };

  const isPositiveAmount = (type: string) => {
    return ['deposit', 'bet_won', 'bet_refund', 'bonus'].includes(type);
  };

  const SortIcon = ({ column }: { column: 'createdAt' | 'amount' }) => {
    if (sortBy !== column) return <ArrowUpDown size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />;
    return sortOrder === 'asc'
      ? <ArrowUp size={14} className="text-emerald-500" />
      : <ArrowDown size={14} className="text-emerald-500" />;
  };

  const hasActiveFilters = typeFilter !== 'all' || statusFilter !== 'all' || balanceTypeFilter !== 'all' || startDate || endDate || searchQuery;

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setBalanceTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subValue,
    color,
    gradient,
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
    subValue: string;
    color: string;
    gradient: string;
  }) => (
    <div
      className={`relative overflow-hidden p-4 rounded-xl flex items-center gap-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-default group ${
        isDark ? gradient : gradient.replace('/10', '/5')
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className={`relative p-2.5 rounded-xl ${isDark ? 'bg-white/10' : 'bg-white/80'} shadow-sm`}>
        <Icon className={color} size={22} />
      </div>
      <div className="relative">
        <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
        <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>{value}</p>
        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{subValue}</p>
      </div>
    </div>
  );

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-row {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-row:nth-child(1) { animation-delay: 0.05s; }
        .animate-row:nth-child(2) { animation-delay: 0.1s; }
        .animate-row:nth-child(3) { animation-delay: 0.15s; }
        .animate-row:nth-child(4) { animation-delay: 0.2s; }
        .animate-row:nth-child(5) { animation-delay: 0.25s; }
        .animate-row:nth-child(6) { animation-delay: 0.3s; }
        .animate-row:nth-child(7) { animation-delay: 0.35s; }
        .animate-row:nth-child(8) { animation-delay: 0.4s; }
        .animate-row:nth-child(9) { animation-delay: 0.45s; }
        .animate-row:nth-child(10) { animation-delay: 0.5s; }
      `}</style>

      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4" style={fadeInAnimation}>
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t(language, 'admin.transactions.title')}
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {total} total transactions • Global overview across the platform
            </p>
          </div>
          <div className="flex items-center gap-2" style={{ ...fadeInAnimation, animationDelay: '0.1s' }}>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
                isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
              } ${isRefreshing ? 'animate-spin' : ''}`}
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <button
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
                isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
              }`}
              title="Export"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ ...fadeInAnimation, animationDelay: '0.15s' }}>
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`p-4 rounded-xl animate-pulse ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                <div className={`h-4 rounded w-24 mb-3 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                <div className={`h-7 rounded w-32 mb-2 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                <div className={`h-3 rounded w-20 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
              </div>
            ))
          ) : stats ? (
            <>
              <StatCard
                icon={TrendingUp}
                label="Total Deposits"
                value={formatCurrency(Number(stats.amounts.deposits))}
                subValue={`${stats.counts.deposits} transactions`}
                color="text-emerald-500"
                gradient="from-emerald-500/10 to-green-500/10"
              />
              <StatCard
                icon={TrendingDown}
                label="Total Withdrawals"
                value={formatCurrency(Number(stats.amounts.withdrawals))}
                subValue={`${stats.counts.withdrawals} transactions`}
                color="text-orange-500"
                gradient="from-orange-500/10 to-amber-500/10"
              />
              <StatCard
                icon={DollarSign}
                label="Bets Placed"
                value={formatCurrency(Number(stats.amounts.betsPlaced))}
                subValue={`${stats.counts.betsPlaced} bets`}
                color="text-red-500"
                gradient="from-red-500/10 to-rose-500/10"
              />
              <StatCard
                icon={Banknote}
                label="Bets Won"
                value={formatCurrency(Number(stats.amounts.betsWon))}
                subValue={`${stats.counts.betsWon} wins`}
                color="text-blue-500"
                gradient="from-blue-500/10 to-indigo-500/10"
              />
            </>
          ) : null}
        </div>

        {/* Filters */}
        <div
          className={`rounded-xl p-4 transition-shadow duration-300 ${
            isDark ? 'bg-slate-800/80 backdrop-blur-sm' : 'bg-white shadow-sm border border-slate-100'
          }`}
          style={{ ...fadeInAnimation, animationDelay: '0.2s' }}
        >
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] group">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                isDark ? 'text-slate-400 group-focus-within:text-emerald-400' : 'text-slate-400 group-focus-within:text-emerald-500'
              }`} size={16} />
              <input
                type="text"
                placeholder="Search by user, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-700'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-slate-50'
                } border`}
              />
            </div>

            {/* Type */}
            <select
              value={typeFilter}
              onChange={(e) => handleFilterChange(setTypeFilter, e.target.value)}
              className={`px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 cursor-pointer ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                  : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
              } border`}
            >
              <option value="all">{t(language, 'admin.transactions.allTypes')}</option>
              <option value="deposit">{t(language, 'admin.transactions.deposit')}</option>
              <option value="withdrawal">{t(language, 'admin.transactions.withdrawal')}</option>
              <option value="bet_placed">{t(language, 'admin.transactions.betPlaced')}</option>
              <option value="bet_won">{t(language, 'admin.transactions.betWon')}</option>
              <option value="bet_refund">{t(language, 'admin.transactions.betRefund')}</option>
              <option value="bonus">{t(language, 'admin.transactions.bonus')}</option>
              <option value="transfer">{t(language, 'admin.transactions.transfer')}</option>
              <option value="adjustment">{t(language, 'admin.transactions.adjustment')}</option>
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              className={`px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 cursor-pointer ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                  : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
              } border`}
            >
              <option value="all">{t(language, 'admin.transactions.allStatuses')}</option>
              <option value="completed">{t(language, 'admin.common.completed')}</option>
              <option value="pending">{t(language, 'admin.common.pending')}</option>
              <option value="failed">{t(language, 'admin.common.failed')}</option>
              <option value="cancelled">{t(language, 'admin.common.cancelled')}</option>
            </select>

            {/* Balance Type */}
            <select
              value={balanceTypeFilter}
              onChange={(e) => handleFilterChange(setBalanceTypeFilter, e.target.value)}
              className={`px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 cursor-pointer ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                  : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
              } border`}
            >
              <option value="all">{t(language, 'admin.transactions.allBalances')}</option>
              <option value="real">{t(language, 'admin.transactions.real')}</option>
              <option value="bonus">{t(language, 'admin.transactions.bonusLabel')}</option>
            </select>

            {/* Date Range */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleFilterChange(setStartDate, e.target.value)}
              className={`px-2 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 w-full sm:w-36 ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              } border`}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleFilterChange(setEndDate, e.target.value)}
              className={`px-2 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 w-full sm:w-36 ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              } border`}
            />

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-all duration-200 hover:scale-105 ${
                  isDark
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    : 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'
                }`}
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>

          {/* Active filter summary */}
          {hasActiveFilters && (
            <div className={`mt-3 pt-3 border-t flex items-center gap-2 text-xs flex-wrap ${
              isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}>
              <span>Showing {total} results</span>
              {searchQuery && <span className={`px-2 py-0.5 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>Search: &quot;{searchQuery}&quot;</span>}
              {typeFilter !== 'all' && <span className={`px-2 py-0.5 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>Type: {typeFilter}</span>}
              {statusFilter !== 'all' && <span className={`px-2 py-0.5 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>Status: {statusFilter}</span>}
              {balanceTypeFilter !== 'all' && <span className={`px-2 py-0.5 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>Balance: {balanceTypeFilter}</span>}
              {startDate && <span className={`px-2 py-0.5 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>From: {startDate}</span>}
              {endDate && <span className={`px-2 py-0.5 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>To: {endDate}</span>}
            </div>
          )}
        </div>

        {/* Table */}
        <div
          className={`rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-xl ${
            isDark ? 'bg-slate-800/80 backdrop-blur-sm' : 'bg-white shadow-sm border border-slate-100'
          }`}
          style={{ ...fadeInAnimation, animationDelay: '0.25s' }}
        >
          {loading ? (
            <TableSkeleton columns={8} rows={LIMIT} />
          ) : transactions.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-20 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <div className={`p-4 rounded-full mb-4 ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                <CreditCard size={40} className="opacity-50" />
              </div>
              <p className="font-medium">{t(language, 'admin.transactions.noTransactions')}</p>
              <p className="text-sm mt-1 opacity-70">{t(language, 'admin.common.tryAdjustFilters')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className={isDark ? 'bg-slate-700/50' : 'bg-slate-50'}>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.user')}</th>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.type')}</th>
                      <th
                        className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors select-none ${
                          isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                        }`}
                        onClick={() => handleSort('amount')}
                      >
                        <span className="flex items-center gap-1.5">
                          Amount
                          <SortIcon column="amount" />
                        </span>
                      </th>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.transactions.beforeAfter')}</th>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.balance')}</th>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.status')}</th>
                      <th
                        className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors select-none ${
                          isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                        }`}
                        onClick={() => handleSort('createdAt')}
                      >
                        <span className="flex items-center gap-1.5">
                          {t(language, 'admin.common.date')}
                          <SortIcon column="createdAt" />
                        </span>
                      </th>
                      <th className={`px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                    {transactions.map((tx, index) => (
                      <tr
                        key={tx.id}
                        className={`animate-row opacity-0 transition-colors duration-200 ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50/80'}`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        {/* User */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow-lg flex-shrink-0">
                              {tx.wallet?.user?.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {tx.wallet?.user?.username || t(language, 'admin.transactions.unknown')}
                              </p>
                              <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tx.wallet?.user?.email || tx.walletId.slice(0, 12) + '...'}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* Type */}
                        <td className="px-4 py-3.5">{getTypeBadge(tx.type)}</td>
                        {/* Amount */}
                        <td className="px-4 py-3.5">
                          <span className={`font-bold text-sm ${isPositiveAmount(tx.type) ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isPositiveAmount(tx.type) ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                          </span>
                        </td>
                        {/* Balance Before/After */}
                        <td className="px-4 py-3.5">
                          <div className="text-sm">
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{formatCurrency(tx.balanceBefore)}</span>
                            <span className={`mx-1.5 ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>&rarr;</span>
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(tx.balanceAfter)}</span>
                          </div>
                        </td>
                        {/* Balance Type */}
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            tx.balanceType === 'real'
                              ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-700')
                              : (isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-50 text-yellow-700')
                          }`}>
                            {tx.balanceType === 'real' ? t(language, 'admin.transactions.real') : t(language, 'admin.transactions.bonusLabel')}
                          </span>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3.5">{getStatusBadge(tx.status)}</td>
                        {/* Date */}
                        <td className={`px-4 py-3.5 text-sm whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(tx.createdAt)}</td>
                        {/* Actions */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => {
                              setSelectedTransaction(tx);
                              setShowDetailModal(true);
                            }}
                            className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                              isDark ? 'hover:bg-blue-500/20 text-blue-400' : 'hover:bg-blue-50 text-blue-500'
                            }`}
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={`px-4 py-3 border-t flex items-center justify-between ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Showing {(page - 1) * LIMIT + 1}-{Math.min(page * LIMIT, total)} of {total}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`p-2 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 ${
                      isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                    }`}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-emerald-500/25">
                    {page}
                  </span>
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={`p-2 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 ${
                      isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                    }`}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedTransaction && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowDetailModal(false)}
          >
            <div
              className={`rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-800' : 'bg-white'}`}
              style={slideUpAnimation}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`sticky top-0 flex items-center justify-between p-5 border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'}`}>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t(language, 'admin.transactions.transactionDetails')}</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Amount + Type */}
                <div className={`p-5 rounded-xl text-center bg-gradient-to-br ${
                  isPositiveAmount(selectedTransaction.type)
                    ? (isDark ? 'from-emerald-500/20 to-green-500/10 border border-emerald-500/30' : 'from-emerald-50 to-green-50 border border-emerald-200')
                    : (isDark ? 'from-red-500/20 to-rose-500/10 border border-red-500/30' : 'from-red-50 to-rose-50 border border-red-200')
                }`}>
                  <div className="mb-2 flex justify-center">{getTypeBadge(selectedTransaction.type)}</div>
                  <p className={`text-3xl font-bold ${isPositiveAmount(selectedTransaction.type) ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isPositiveAmount(selectedTransaction.type) ? '+' : '-'}{formatCurrency(Math.abs(selectedTransaction.amount))}
                  </p>
                </div>

                {/* Balance Before/After */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                    <p className={`text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.transactions.balanceBefore')}</p>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(selectedTransaction.balanceBefore)}</p>
                  </div>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                    <p className={`text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.transactions.balanceAfter')}</p>
                    <p className="text-emerald-500 font-bold">{formatCurrency(selectedTransaction.balanceAfter)}</p>
                  </div>
                </div>

                {/* Details */}
                <div className={`p-4 rounded-xl space-y-3 ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.transactions.transactionId')}</span>
                    <span className={`font-mono text-xs text-right break-all max-w-[60%] ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedTransaction.id}</span>
                  </div>

                  {selectedTransaction.wallet?.user && (
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.user')}</span>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedTransaction.wallet.user.username}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{selectedTransaction.wallet.user.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.transactions.balanceType')}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      selectedTransaction.balanceType === 'real'
                        ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-700')
                        : (isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-50 text-yellow-700')
                    }`}>
                      {selectedTransaction.balanceType === 'real' ? t(language, 'admin.transactions.realBalance') : t(language, 'admin.transactions.bonusBalance')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.status')}</span>
                    {getStatusBadge(selectedTransaction.status)}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.date')}</span>
                    <span className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatDate(selectedTransaction.createdAt)}</span>
                  </div>

                  {selectedTransaction.referenceType && (
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.transactions.referenceType')}</span>
                      <span className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedTransaction.referenceType}</span>
                    </div>
                  )}

                  {selectedTransaction.referenceId && (
                    <div className="flex justify-between items-start">
                      <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.transactions.referenceId')}</span>
                      <span className={`font-mono text-xs text-right break-all max-w-[60%] ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedTransaction.referenceId}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedTransaction.description && (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                    <p className={`text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Description</p>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedTransaction.description}</p>
                  </div>
                )}

                {/* Metadata */}
                {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                    <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.transactions.metadata')}</p>
                    <pre className={`text-xs font-mono p-3 rounded-lg overflow-x-auto ${isDark ? 'text-slate-300 bg-slate-800' : 'text-slate-700 bg-slate-100'}`}>
                      {JSON.stringify(selectedTransaction.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className={`sticky bottom-0 p-5 border-t ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'}`}>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
                    isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t(language, 'admin.common.close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
