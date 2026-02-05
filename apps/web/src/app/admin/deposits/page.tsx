'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowDownToLine,
  Search,
  Eye,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Image as ImageIcon,
  Copy,
  Calendar,
  TrendingUp,
  XCircle,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';
import { adminService, DepositRequest } from '@/services/admin.service';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { TableSkeleton } from '@/components/admin/AdminLoading';
import { toast } from 'sonner';

const fadeInAnimation = {
  animation: 'fadeIn 0.3s ease-out forwards',
};

const slideUpAnimation = {
  animation: 'slideUp 0.3s ease-out forwards',
};

export default function AdminDepositsPage() {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0,
  });

  const detailModalRef = useRef<HTMLDivElement>(null);
  const rejectModalRef = useRef<HTMLDivElement>(null);
  const imageModalRef = useRef<HTMLDivElement>(null);

  const fetchDeposits = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getDeposits({
        page,
        limit: 10,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setDeposits(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
      
      const pendingCount = response.data.filter((d: DepositRequest) => d.status === 'pending').length;
      const approvedCount = response.data.filter((d: DepositRequest) => d.status === 'approved').length;
      const rejectedCount = response.data.filter((d: DepositRequest) => d.status === 'rejected').length;
      const totalAmt = response.data
        .filter((d: DepositRequest) => d.status === 'approved')
        .reduce((sum: number, d: DepositRequest) => sum + d.amount, 0);
      
      setStats({
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        totalAmount: totalAmt,
      });
    } catch (error) {
      console.error('Failed to fetch deposits:', error);
      toast.error('Failed to load deposit requests');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fromDate, toDate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showImageModal) {
          setShowImageModal(false);
          resetImageView();
        } else if (showRejectModal) {
          setShowRejectModal(false);
          setRejectReason('');
        } else if (showDetailModal) {
          setShowDetailModal(false);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDetailModal, showRejectModal, showImageModal]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDeposits();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await adminService.approveDeposit(id);
      toast.success('Deposit approved successfully!', {
        icon: <Check className="text-emerald-500" size={18} />,
      });
      fetchDeposits();
      setShowDetailModal(false);
    } catch (error) {
      toast.error('Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDeposit || !rejectReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    setActionLoading(true);
    try {
      await adminService.rejectDeposit(selectedDeposit.id, rejectReason);
      toast.success('Deposit rejected', {
        icon: <X className="text-red-500" size={18} />,
      });
      fetchDeposits();
      setShowRejectModal(false);
      setShowDetailModal(false);
      setRejectReason('');
    } catch (error) {
      toast.error('Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied!`, {
        icon: <Copy className="text-emerald-500" size={16} />,
        duration: 2000,
      });
    } catch {
      toast.error('Failed to copy');
    }
  };

  const resetImageView = () => {
    setImageZoom(1);
    setImageRotation(0);
  };

  const clearDateFilter = () => {
    setFromDate('');
    setToDate('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('vi-VN', {
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
      approved: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30',
      rejected: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30',
      cancelled: 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-400 border border-slate-500/30',
    };
    const lightStyles: Record<string, string> = {
      pending: 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200',
      approved: 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200',
      rejected: 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200',
      cancelled: 'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-500 border border-slate-200',
    };
    const labels: Record<string, string> = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    };
    const styles = isDark ? darkStyles : lightStyles;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || (isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500')} transition-all duration-200 hover:scale-105`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      bank_transfer: 'Bank Transfer',
      e_wallet: 'E-Wallet',
      crypto: 'Crypto',
      card: 'Prepaid Card',
    };
    return labels[method] || method;
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
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 1; }
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
              Deposit Management
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {total} total requests • Manage and process deposit requests
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2" style={{ ...fadeInAnimation, animationDelay: '0.1s' }}>
            <div className="relative group">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                isDark ? 'text-slate-400 group-focus-within:text-emerald-400' : 'text-slate-400 group-focus-within:text-emerald-500'
              }`} size={16} />
              <input
                type="text"
                placeholder="Search user..."
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
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ ...fadeInAnimation, animationDelay: '0.15s' }}>
          <StatCard
            icon={Clock}
            label="Pending"
            value={stats.pending}
            color="text-amber-500"
            gradient="from-amber-500/10 to-orange-500/10"
          />
          <StatCard
            icon={Check}
            label="Approved"
            value={stats.approved}
            color="text-emerald-500"
            gradient="from-emerald-500/10 to-green-500/10"
          />
          <StatCard
            icon={X}
            label="Rejected"
            value={stats.rejected}
            color="text-red-500"
            gradient="from-red-500/10 to-rose-500/10"
          />
          <StatCard
            icon={TrendingUp}
            label="Total Approved"
            value={formatCurrency(stats.totalAmount)}
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
            <TableSkeleton columns={7} rows={10} />
          ) : deposits.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-20 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <div className={`p-4 rounded-full mb-4 ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                <ArrowDownToLine size={40} className="opacity-50" />
              </div>
              <p className="font-medium">No deposit requests found</p>
              <p className="text-sm mt-1 opacity-70">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={isDark ? 'bg-slate-700/50' : 'bg-slate-50'}>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>User</th>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Amount</th>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Method</th>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bank Info</th>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Created</th>
                      <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                    {deposits.map((deposit, index) => (
                      <tr 
                        key={deposit.id} 
                        className={`animate-row opacity-0 transition-colors duration-200 ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50/80'}`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                              {deposit.user?.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {deposit.user?.username || 'N/A'}
                              </p>
                              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {deposit.user?.email || ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-emerald-500 font-bold text-sm">
                            {formatCurrency(deposit.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {getPaymentMethodLabel(deposit.paymentMethod)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div>
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {deposit.bankName || '-'}
                            </p>
                            {deposit.accountNumber && (
                              <button
                                onClick={() => copyToClipboard(deposit.accountNumber || '', 'Account number')}
                                className={`text-xs font-mono flex items-center gap-1 group ${isDark ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-500 hover:text-emerald-600'}`}
                              >
                                {deposit.accountNumber}
                                <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">{getStatusBadge(deposit.status)}</td>
                        <td className={`px-4 py-3.5 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {formatDate(deposit.createdAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => {
                                setSelectedDeposit(deposit);
                                setShowDetailModal(true);
                              }}
                              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                                isDark ? 'hover:bg-blue-500/20 text-blue-400' : 'hover:bg-blue-50 text-blue-500'
                              }`}
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            {deposit.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleApprove(deposit.id)}
                                  className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                                    isDark ? 'hover:bg-emerald-500/20 text-emerald-400' : 'hover:bg-emerald-50 text-emerald-500'
                                  }`}
                                  title="Approve"
                                >
                                  <Check size={16} />
                                </button>
                                <button 
                                  onClick={() => {
                                    setSelectedDeposit(deposit);
                                    setShowRejectModal(true);
                                  }}
                                  className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                                    isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'
                                  }`}
                                  title="Reject"
                                >
                                  <X size={16} />
                                </button>
                              </>
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

        {showDetailModal && selectedDeposit && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowDetailModal(false)}
          >
            <div 
              ref={detailModalRef}
              className={`rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-800' : 'bg-white'}`}
              style={slideUpAnimation}
            >
              <div className={`sticky top-0 flex items-center justify-between p-5 border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'}`}>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Deposit Details</h3>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div className={`flex items-center gap-4 p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                    {selectedDeposit.user?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedDeposit.user?.username}</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedDeposit.user?.email}</p>
                  </div>
                </div>

                <div className={`p-5 rounded-xl text-center bg-gradient-to-br ${isDark ? 'from-emerald-500/20 to-green-500/10' : 'from-emerald-50 to-green-50'} border ${isDark ? 'border-emerald-500/30' : 'border-emerald-200'}`}>
                  <p className={`text-xs font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Deposit Amount</p>
                  <p className="text-emerald-500 font-bold text-3xl">
                    {formatCurrency(selectedDeposit.amount)}
                  </p>
                </div>

                <div className={`p-4 rounded-xl space-y-3 ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Payment Method</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {getPaymentMethodLabel(selectedDeposit.paymentMethod)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Bank</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {selectedDeposit.bankName || '-'}
                    </span>
                  </div>
                  {selectedDeposit.accountNumber && (
                    <div className="flex justify-between text-sm items-center">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Account Number</span>
                      <button
                        onClick={() => copyToClipboard(selectedDeposit.accountNumber || '', 'Account number')}
                        className={`font-mono font-medium flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${
                          isDark ? 'text-white hover:bg-slate-600' : 'text-slate-900 hover:bg-slate-200'
                        }`}
                      >
                        {selectedDeposit.accountNumber}
                        <Copy size={14} className="text-emerald-500" />
                      </button>
                    </div>
                  )}
                  {selectedDeposit.transferContent && (
                    <div className="flex justify-between text-sm items-center">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Transfer Content</span>
                      <button
                        onClick={() => copyToClipboard(selectedDeposit.transferContent || '', 'Transfer content')}
                        className={`font-mono font-medium flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${
                          isDark ? 'text-white hover:bg-slate-600' : 'text-slate-900 hover:bg-slate-200'
                        }`}
                      >
                        {selectedDeposit.transferContent}
                        <Copy size={14} className="text-emerald-500" />
                      </button>
                    </div>
                  )}
                  <div className="flex justify-between text-sm items-center">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Status</span>
                    {getStatusBadge(selectedDeposit.status)}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Created</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatDate(selectedDeposit.createdAt)}
                    </span>
                  </div>
                </div>

                {selectedDeposit.proofImageUrl && (
                  <button
                    onClick={() => {
                      setShowImageModal(true);
                      resetImageView();
                    }}
                    className={`w-full p-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.02] ${
                      isDark ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <ImageIcon className="text-emerald-500" size={20} />
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>View Proof Image</span>
                  </button>
                )}

                {selectedDeposit.rejectReason && (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                    <p className="text-red-500 text-xs font-semibold mb-2">Rejection Reason</p>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedDeposit.rejectReason}</p>
                  </div>
                )}
              </div>

              <div className={`sticky bottom-0 p-5 border-t ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'}`}>
                {selectedDeposit.status === 'pending' ? (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowRejectModal(true);
                      }}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                        isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-500 hover:bg-red-100'
                      }`}
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleApprove(selectedDeposit.id)}
                      disabled={actionLoading}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? 'Processing...' : 'Approve'}
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

        {showRejectModal && selectedDeposit && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowRejectModal(false)}
          >
            <div 
              ref={rejectModalRef}
              className={`rounded-2xl p-6 w-full max-w-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}
              style={slideUpAnimation}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-red-500/20' : 'bg-red-50'}`}>
                  <X className="text-red-500" size={24} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Reject Request</h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {formatCurrency(selectedDeposit.amount)} from {selectedDeposit.user?.username}
                  </p>
                </div>
              </div>
              
              <div className="mb-5">
                <label className={`text-xs font-semibold mb-2 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none h-24 transition-all duration-200 ${
                    isDark 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:bg-slate-600' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                  } border`}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                    isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReject}
                  disabled={actionLoading || !rejectReason.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showImageModal && selectedDeposit?.proofImageUrl && (
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={(e) => e.target === e.currentTarget && setShowImageModal(false)}
          >
            <div 
              ref={imageModalRef}
              className="relative w-full h-full flex flex-col"
              style={fadeInAnimation}
            >
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <button
                  onClick={() => setImageZoom(z => Math.max(0.5, z - 0.25))}
                  className="p-3 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={20} />
                </button>
                <span className="px-3 py-2 rounded-xl bg-black/50 text-white text-sm font-medium">
                  {Math.round(imageZoom * 100)}%
                </span>
                <button
                  onClick={() => setImageZoom(z => Math.min(3, z + 0.25))}
                  className="p-3 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={20} />
                </button>
                <button
                  onClick={() => setImageRotation(r => (r + 90) % 360)}
                  className="p-3 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors"
                  title="Rotate"
                >
                  <RotateCw size={20} />
                </button>
                <button
                  onClick={() => {
                    setShowImageModal(false);
                    resetImageView();
                  }}
                  className="p-3 rounded-xl bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                <img
                  src={selectedDeposit.proofImageUrl}
                  alt="Proof of deposit"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-300"
                  style={{
                    transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                  }}
                />
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black/50 text-white text-sm">
                Press <kbd className="px-2 py-0.5 bg-white/20 rounded mx-1">ESC</kbd> to close
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
