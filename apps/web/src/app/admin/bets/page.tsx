'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Calendar,
  XCircle,
  Receipt,
  TrendingUp,
  Ban,
  Trophy,
  AlertTriangle,
} from 'lucide-react';
import { adminService, AdminBet } from '@/services/admin.service';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { TableSkeleton } from '@/components/admin/AdminLoading';
import { toast } from 'sonner';

const fadeInAnimation = {
  animation: 'fadeIn 0.3s ease-out forwards',
};

const slideUpAnimation = {
  animation: 'slideUp 0.3s ease-out forwards',
};

export default function AdminBetsPage() {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';
  const [bets, setBets] = useState<AdminBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedBet, setSelectedBet] = useState<AdminBet | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  const [stats, setStats] = useState({
    pending: 0,
    won: 0,
    lost: 0,
    voided: 0,
    totalStake: 0,
  });

  const detailModalRef = useRef<HTMLDivElement>(null);
  const voidModalRef = useRef<HTMLDivElement>(null);

  const fetchBets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getBets({
        page,
        limit: 10,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setBets(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
      
      const pendingCount = response.data.filter((b: AdminBet) => b.status === 'pending').length;
      const wonCount = response.data.filter((b: AdminBet) => b.status === 'won').length;
      const lostCount = response.data.filter((b: AdminBet) => b.status === 'lost').length;
      const voidCount = response.data.filter((b: AdminBet) => b.status === 'void').length;
      const totalStk = response.data.reduce((sum: number, b: AdminBet) => sum + Number(b.stake), 0);
      
      setStats({
        pending: pendingCount,
        won: wonCount,
        lost: lostCount,
        voided: voidCount,
        totalStake: totalStk,
      });
    } catch (error) {
      console.error('Failed to fetch bets:', error);
      toast.error('Failed to load bets');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery, fromDate, toDate]);

  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fromDate, toDate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showVoidModal) {
          setShowVoidModal(false);
        } else if (showDetailModal) {
          setShowDetailModal(false);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDetailModal, showVoidModal]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBets();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleVoid = async () => {
    if (!selectedBet) return;
    setActionLoading(true);
    try {
      await adminService.voidBet(selectedBet.id);
      toast.success('Bet voided successfully!', {
        icon: <Ban className="text-slate-500" size={18} />,
      });
      fetchBets();
      setShowVoidModal(false);
      setShowDetailModal(false);
    } catch (error) {
      toast.error('Failed to void bet');
    } finally {
      setActionLoading(false);
    }
  };

  const clearDateFilter = () => {
    setFromDate('');
    setToDate('');
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

  const getStatusBadge = (status: string) => {
    const darkStyles: Record<string, string> = {
      pending: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30',
      won: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30',
      lost: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30',
      void: 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-400 border border-slate-500/30',
      partial_won: 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30',
      cashout: 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-400 border border-purple-500/30',
    };
    const lightStyles: Record<string, string> = {
      pending: 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200',
      won: 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200',
      lost: 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200',
      void: 'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-500 border border-slate-200',
      partial_won: 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200',
      cashout: 'bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border border-purple-200',
    };
    const labels: Record<string, string> = {
      pending: 'Pending',
      won: 'Won',
      lost: 'Lost',
      void: 'Void',
      partial_won: 'Partial Won',
      cashout: 'Cashout',
    };
    const styles = isDark ? darkStyles : lightStyles;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || (isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500')} transition-all duration-200 hover:scale-105`}>
        {labels[status] || status}
      </span>
    );
  };

  const getSelectionResultBadge = (result: string) => {
    const darkStyles: Record<string, string> = {
      pending: 'text-amber-400 bg-amber-500/10',
      won: 'text-emerald-400 bg-emerald-500/10',
      lost: 'text-red-400 bg-red-500/10',
      void: 'text-slate-400 bg-slate-500/10',
      half_won: 'text-blue-400 bg-blue-500/10',
      half_lost: 'text-orange-400 bg-orange-500/10',
    };
    const lightStyles: Record<string, string> = {
      pending: 'text-amber-700 bg-amber-50',
      won: 'text-emerald-700 bg-emerald-50',
      lost: 'text-red-700 bg-red-50',
      void: 'text-slate-500 bg-slate-50',
      half_won: 'text-blue-700 bg-blue-50',
      half_lost: 'text-orange-700 bg-orange-50',
    };
    const labels: Record<string, string> = {
      pending: 'Pending',
      won: 'Won',
      lost: 'Lost',
      void: 'Void',
      half_won: 'Half Won',
      half_lost: 'Half Lost',
    };
    const styles = isDark ? darkStyles : lightStyles;
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${styles[result] || (isDark ? 'text-slate-400 bg-slate-800' : 'text-slate-500 bg-slate-100')}`}>
        {labels[result] || result}
      </span>
    );
  };

  const formatBetType = (type: string) => {
    const types: Record<string, string> = {
      single: 'Single',
      accumulator: 'Accumulator',
      system: 'System',
    };
    return types[type] || type;
  };

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    color, 
    gradient 
  }: { 
    icon: React.ElementType; 
    label: string; 
    value: string | number; 
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
        <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>
          {value}
        </p>
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
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div style={fadeInAnimation}>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Bets Management
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {total} total bets • Monitor and manage user bets
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2" style={{ ...fadeInAnimation, animationDelay: '0.1s' }}>
            <div className="relative group">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                isDark ? 'text-slate-400 group-focus-within:text-emerald-400' : 'text-slate-400 group-focus-within:text-emerald-500'
              }`} size={16} />
              <input
                type="text"
                placeholder="Search user or bet ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-44 transition-all duration-200 ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-700' 
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-slate-50'
                } border`}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <div className="relative">
                <Calendar className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} size={14} />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className={`pl-8 pr-2 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-36 transition-all duration-200 ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white' 
                      : 'bg-white border-slate-200 text-slate-900'
                  } border`}
                />
              </div>
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={`px-2 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-36 transition-all duration-200 ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white' 
                    : 'bg-white border-slate-200 text-slate-900'
                } border`}
              />
              {(fromDate || toDate) && (
                <button
                  onClick={clearDateFilter}
                  className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                    isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                  }`}
                  title="Clear date filter"
                >
                  <XCircle size={16} />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' 
                  : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
              } border`}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="void">Void</option>
              <option value="partial_won">Partial Won</option>
              <option value="cashout">Cashout</option>
            </select>

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
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" style={{ ...fadeInAnimation, animationDelay: '0.15s' }}>
          <StatCard
            icon={Clock}
            label="Pending"
            value={stats.pending}
            color="text-amber-500"
            gradient="from-amber-500/10 to-orange-500/10"
          />
          <StatCard
            icon={Trophy}
            label="Won"
            value={stats.won}
            color="text-emerald-500"
            gradient="from-emerald-500/10 to-green-500/10"
          />
          <StatCard
            icon={XCircle}
            label="Lost"
            value={stats.lost}
            color="text-red-500"
            gradient="from-red-500/10 to-rose-500/10"
          />
          <StatCard
            icon={Ban}
            label="Voided"
            value={stats.voided}
            color="text-slate-500"
            gradient="from-slate-500/10 to-gray-500/10"
          />
          <StatCard
            icon={TrendingUp}
            label="Total Stake"
            value={formatCurrency(stats.totalStake)}
            color="text-blue-500"
            gradient="from-blue-500/10 to-indigo-500/10"
          />
        </div>

        <div 
          className={`rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-xl ${
            isDark ? 'bg-slate-800/80 backdrop-blur-sm' : 'bg-white shadow-sm border border-slate-100'
          }`}
          style={{ ...fadeInAnimation, animationDelay: '0.2s' }}
        >
          {loading ? (
            <TableSkeleton columns={8} rows={10} />
          ) : bets.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-20 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <div className={`p-4 rounded-full mb-4 ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                <Receipt size={40} className="opacity-50" />
              </div>
              <p className="font-medium">No bets found</p>
              <p className="text-sm mt-1 opacity-70">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={isDark ? 'bg-slate-700/50' : 'bg-slate-50'}>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ID</th>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>User</th>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Match / Selection</th>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Type</th>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Odds</th>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Stake / Pot. Win</th>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Placed At</th>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                    {bets.map((bet, index) => (
                      <tr 
                        key={bet.id} 
                        className={`animate-row opacity-0 transition-colors duration-200 ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50/80'}`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <td className={`px-4 py-3.5 font-mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {bet.id.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                              {bet.user?.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {bet.user?.username || 'N/A'}
                              </p>
                              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {bet.user?.email || ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="max-w-[200px]">
                            {bet.selections.length > 1 ? (
                              <div>
                                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  Multiple Matches
                                </span>
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {bet.selections.length} selections
                                </p>
                              </div>
                            ) : (
                              <div>
                                <p className={`text-xs mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {bet.selections[0]?.match?.homeTeam?.name} vs {bet.selections[0]?.match?.awayTeam?.name}
                                </p>
                                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {bet.selections[0]?.selectionName || bet.selections[0]?.selection}
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {formatBetType(bet.betType)}
                          </span>
                        </td>
                        <td className={`px-4 py-3.5 font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                          {Number(bet.totalOdds).toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col">
                            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              Stake: <span className={isDark ? 'text-white' : 'text-slate-900'}>{formatCurrency(bet.stake)}</span>
                            </span>
                            <span className={`text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                              Win: {formatCurrency(bet.potentialWin)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">{getStatusBadge(bet.status)}</td>
                        <td className={`px-4 py-3.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {formatDate(bet.placedAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => {
                                setSelectedBet(bet);
                                setShowDetailModal(true);
                              }}
                              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                                isDark ? 'hover:bg-blue-500/20 text-blue-400' : 'hover:bg-blue-50 text-blue-500'
                              }`}
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            {bet.status === 'pending' && (
                              <button 
                                onClick={() => {
                                  setSelectedBet(bet);
                                  setShowVoidModal(true);
                                }}
                                className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                                  isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'
                                }`}
                                title="Void Bet"
                              >
                                <Ban size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={`px-4 py-3 border-t flex items-center justify-between ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of {total}
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

        {showDetailModal && selectedBet && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowDetailModal(false)}
          >
            <div 
              ref={detailModalRef}
              className={`rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-800' : 'bg-white'}`}
              style={slideUpAnimation}
            >
              <div className={`sticky top-0 flex items-center justify-between p-5 border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'} z-10`}>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Bet Details</h3>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 space-y-6">
                <div className={`flex items-center gap-4 p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                    {selectedBet.user?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedBet.user?.username}</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedBet.user?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-5 rounded-xl text-center bg-gradient-to-br ${isDark ? 'from-blue-500/20 to-indigo-500/10' : 'from-blue-50 to-indigo-50'} border ${isDark ? 'border-blue-500/30' : 'border-blue-200'}`}>
                    <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Stake</p>
                    <p className="text-blue-500 font-bold text-2xl">
                      {formatCurrency(selectedBet.stake)}
                    </p>
                  </div>
                  <div className={`p-5 rounded-xl text-center bg-gradient-to-br ${isDark ? 'from-emerald-500/20 to-green-500/10' : 'from-emerald-50 to-green-50'} border ${isDark ? 'border-emerald-500/30' : 'border-emerald-200'}`}>
                    <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Potential Win</p>
                    <p className="text-emerald-500 font-bold text-2xl">
                      {formatCurrency(selectedBet.potentialWin)}
                    </p>
                  </div>
                </div>

                <div className={`p-4 rounded-xl space-y-3 ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                   <div className="grid grid-cols-2 gap-y-3 gap-x-8">
                     <div className="flex justify-between text-sm">
                       <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Bet Type</span>
                       <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                         {formatBetType(selectedBet.betType)}
                       </span>
                     </div>
                     <div className="flex justify-between text-sm">
                       <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Total Odds</span>
                       <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                         {Number(selectedBet.totalOdds).toFixed(2)}
                       </span>
                     </div>
                     <div className="flex justify-between text-sm items-center">
                       <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Status</span>
                       {getStatusBadge(selectedBet.status)}
                     </div>
                     <div className="flex justify-between text-sm items-center">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Bet ID</span>
                        <span className={`font-mono text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{selectedBet.id.substring(0, 8)}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                       <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Placed At</span>
                       <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                         {formatDate(selectedBet.placedAt)}
                       </span>
                     </div>
                     {selectedBet.settledAt && (
                       <div className="flex justify-between text-sm">
                         <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Settled At</span>
                         <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                           {formatDate(selectedBet.settledAt)}
                         </span>
                       </div>
                     )}
                   </div>
                </div>

                <div>
                  <h4 className={`text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Selections ({selectedBet.selections.length})</h4>
                  <div className="space-y-3">
                    {selectedBet.selections.map((selection) => (
                      <div 
                        key={selection.id} 
                        className={`p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] ${
                          isDark ? 'bg-slate-700/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                             <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                               {selection.match.league?.name || 'League'}
                             </span>
                             {selection.match.status !== 'NS' && (
                               <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500 text-white font-bold animate-pulse">
                                 {selection.match.status}
                               </span>
                             )}
                          </div>
                          {getSelectionResultBadge(selection.result)}
                        </div>
                        
                        <div className={`text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {selection.match.homeTeam.name} <span className="text-slate-400 font-normal mx-1">vs</span> {selection.match.awayTeam.name}
                          {(selection.match.homeScore !== undefined && selection.match.homeScore !== null) && (
                            <span className="ml-2 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                              {selection.match.homeScore} - {selection.match.awayScore}
                            </span>
                          )}
                        </div>
                        
                        <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                          <div>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {selection.odds?.betType?.name || 'Bet Type'}
                            </p>
                            <p className={`text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                              {selection.selectionName || selection.selection}
                              {selection.handicap && <span className="ml-1 text-slate-500">({selection.handicap})</span>}
                            </p>
                          </div>
                          <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {Number(selection.oddsValue).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={`sticky bottom-0 p-5 border-t ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'}`}>
                {selectedBet.status === 'pending' ? (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowVoidModal(true);
                      }}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                        isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-500 hover:bg-red-100'
                      }`}
                    >
                      Void Bet
                    </button>
                    <button 
                      onClick={() => setShowDetailModal(false)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
                        isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowDetailModal(false)}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
                      isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showVoidModal && selectedBet && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowVoidModal(false)}
          >
            <div 
              ref={voidModalRef}
              className={`rounded-2xl p-6 w-full max-w-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}
              style={slideUpAnimation}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-red-500/20' : 'bg-red-50'}`}>
                  <AlertTriangle className="text-red-500" size={24} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Void Bet?</h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              
              <div className={`mb-5 p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                <div className="flex justify-between text-sm mb-2">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>User</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedBet.user?.username}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                   <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Bet ID</span>
                   <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedBet.id.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Stake Refund</span>
                  <span className="font-bold text-emerald-500">{formatCurrency(selectedBet.stake)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowVoidModal(false)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                    isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleVoid}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Processing...' : 'Void Bet'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
