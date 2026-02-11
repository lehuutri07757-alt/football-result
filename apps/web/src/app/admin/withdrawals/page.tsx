'use client';

import { useState, useEffect } from 'react';
import {
  ArrowUpFromLine,
  Search,
  Eye,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Banknote,
} from 'lucide-react';
import { adminService, WithdrawalRequest } from '@/services/admin.service';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { TableSkeleton } from '@/components/admin/AdminLoading';
import { toast } from 'sonner';
import { useLanguageStore } from '@/stores/language.store';
import { t } from '@/lib/i18n';

export default function AdminWithdrawalsPage() {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';
  const language = useLanguageStore((s) => s.language);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const response = await adminService.getWithdrawals({
        page,
        limit: 10,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setWithdrawals(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
      toast.error('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchWithdrawals();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleApprove = async () => {
    if (!selectedWithdrawal) return;
    setActionLoading(true);
    try {
      await adminService.approveWithdrawal(selectedWithdrawal.id, transactionRef || undefined);
      toast.success('Withdrawal approved');
      fetchWithdrawals();
      setShowApproveModal(false);
      setShowDetailModal(false);
      setTransactionRef('');
    } catch (error) {
      toast.error('Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    setActionLoading(true);
    try {
      await adminService.rejectWithdrawal(selectedWithdrawal.id, rejectReason);
      toast.success('Withdrawal rejected');
      fetchWithdrawals();
      setShowRejectModal(false);
      setShowDetailModal(false);
      setRejectReason('');
    } catch (error) {
      toast.error('Failed to reject request');
    } finally {
      setActionLoading(false);
    }
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
      pending: 'bg-amber-500/20 text-amber-400',
      processing: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-emerald-500/20 text-emerald-400',
      rejected: 'bg-red-500/20 text-red-400',
      cancelled: 'bg-slate-500/20 text-slate-400',
    };
    const lightStyles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-slate-100 text-slate-500',
    };
    const labels: Record<string, string> = {
      pending: t(language, 'admin.common.pending'),
      processing: t(language, 'admin.common.processing'),
      completed: t(language, 'admin.common.completed'),
      rejected: t(language, 'admin.common.rejected'),
      cancelled: t(language, 'admin.common.cancelled'),
    };
    const styles = isDark ? darkStyles : lightStyles;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || (isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t(language, 'admin.withdrawals.title')}</h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{total} requests</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-48 ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
              } border`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-white' 
                : 'bg-white border-slate-200 text-slate-900'
            } border`}
          >
            <option value="all">{t(language, 'admin.common.all')}</option>
            <option value="pending">{t(language, 'admin.common.pending')}</option>
            <option value="processing">{t(language, 'admin.common.processing')}</option>
            <option value="completed">{t(language, 'admin.common.completed')}</option>
            <option value="rejected">{t(language, 'admin.common.rejected')}</option>
          </select>
          <button 
            onClick={fetchWithdrawals}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`p-3 rounded-lg flex items-center gap-3 ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
          <Clock className="text-amber-500" size={20} />
          <div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.pending')}</p>
            <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {withdrawals.filter(w => w.status === 'pending').length}
            </p>
          </div>
        </div>
        <div className={`p-3 rounded-lg flex items-center gap-3 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
          <Banknote className="text-blue-500" size={20} />
          <div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.processing')}</p>
            <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {withdrawals.filter(w => w.status === 'processing').length}
            </p>
          </div>
        </div>
        <div className={`p-3 rounded-lg flex items-center gap-3 ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
          <Check className="text-emerald-500" size={20} />
          <div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.completed')}</p>
            <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {withdrawals.filter(w => w.status === 'completed').length}
            </p>
          </div>
        </div>
        <div className={`p-3 rounded-lg flex items-center gap-3 ${isDark ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
          <ArrowUpFromLine className="text-orange-500" size={20} />
          <div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.total')}</p>
            <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(withdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + w.netAmount, 0))}
            </p>
          </div>
        </div>
      </div>

      <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm border border-slate-100'}`}>
        {loading ? (
          <TableSkeleton columns={8} rows={10} />
        ) : withdrawals.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-16 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <ArrowUpFromLine size={40} className="mb-3 opacity-50" />
            <p className="text-sm">{t(language, 'admin.withdrawals.noWithdrawals')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className={isDark ? 'bg-slate-700/50' : 'bg-slate-50'}>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.user')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.amount')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.withdrawals.fee')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.withdrawals.net')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.deposits.bank')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.status')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.time')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.actions')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-sm font-medium">
                            {withdrawal.user?.username?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{withdrawal.user?.username || 'N/A'}</p>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{withdrawal.user?.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-orange-500 font-medium text-sm">
                          {formatCurrency(withdrawal.amount)}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {formatCurrency(withdrawal.fee)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-emerald-500 font-medium text-sm">
                          {formatCurrency(withdrawal.netAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{withdrawal.bankName}</p>
                          <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{withdrawal.accountNumber}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(withdrawal.status)}</td>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(withdrawal.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setShowDetailModal(true);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-600 text-blue-400' : 'hover:bg-blue-50 text-blue-500'}`}
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          {withdrawal.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => {
                                  setSelectedWithdrawal(withdrawal);
                                  setShowApproveModal(true);
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-600 text-emerald-400' : 'hover:bg-emerald-50 text-emerald-500'}`}
                                title={t(language, 'admin.common.approve')}
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedWithdrawal(withdrawal);
                                  setShowRejectModal(true);
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-600 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                                title={t(language, 'admin.common.reject')}
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

            <div className={`px-4 py-3 border-t flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of {total}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="px-3 py-1 bg-emerald-500 text-white text-sm font-medium rounded-lg">{page}</span>
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ {totalPages}</span>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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

      {showDetailModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`rounded-xl p-5 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t(language, 'admin.withdrawals.withdrawalDetails')}</h3>
              <button 
                onClick={() => setShowDetailModal(false)}
                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold">
                  {selectedWithdrawal.user?.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedWithdrawal.user?.username}</p>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedWithdrawal.user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className={`p-2 rounded-lg text-center ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.amount')}</p>
                  <p className="text-orange-500 font-bold text-sm">{formatCurrency(selectedWithdrawal.amount)}</p>
                </div>
                <div className={`p-2 rounded-lg text-center ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.withdrawals.fee')}</p>
                  <p className="text-red-500 font-bold text-sm">{formatCurrency(selectedWithdrawal.fee)}</p>
                </div>
                <div className={`p-2 rounded-lg text-center ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.withdrawals.net')}</p>
                  <p className="text-emerald-500 font-bold text-sm">{formatCurrency(selectedWithdrawal.netAmount)}</p>
                </div>
              </div>

              <div className={`p-3 rounded-lg space-y-2 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                <p className={`text-xs font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.withdrawals.bankInfo')}</p>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t(language, 'admin.deposits.bank')}</span>
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>{selectedWithdrawal.bankName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t(language, 'admin.withdrawals.account')}</span>
                  <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedWithdrawal.accountNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t(language, 'admin.common.name')}</span>
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>{selectedWithdrawal.accountName}</span>
                </div>
              </div>

              <div className={`p-3 rounded-lg space-y-2 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                <div className="flex justify-between text-sm items-center">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t(language, 'admin.common.status')}</span>
                  {getStatusBadge(selectedWithdrawal.status)}
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t(language, 'admin.common.created')}</span>
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>{formatDate(selectedWithdrawal.createdAt)}</span>
                </div>
                {selectedWithdrawal.transactionRef && (
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t(language, 'admin.withdrawals.ref')}</span>
                    <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedWithdrawal.transactionRef}</span>
                  </div>
                )}
              </div>

              {selectedWithdrawal.rejectReason && (
                <div className={`p-3 rounded-lg ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                  <p className="text-red-500 text-xs mb-1">{t(language, 'admin.withdrawals.rejectReason')}</p>
                  <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedWithdrawal.rejectReason}</p>
                </div>
              )}
            </div>

            {selectedWithdrawal.status === 'pending' && (
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowRejectModal(true);
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-500 hover:bg-red-100'
                  }`}
                >
                  {t(language, 'admin.common.reject')}
                </button>
                <button 
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowApproveModal(true);
                  }}
                  className="flex-1 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  {t(language, 'admin.common.approve')}
                </button>
              </div>
            )}

            {selectedWithdrawal.status !== 'pending' && (
              <button 
                onClick={() => setShowDetailModal(false)}
                className={`w-full mt-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t(language, 'admin.common.close')}
              </button>
            )}
          </div>
        </div>
      )}

      {showApproveModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`rounded-xl p-5 w-full max-w-sm mx-4 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t(language, 'admin.withdrawals.approveWithdrawal')}</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Approve <span className="text-emerald-500 font-medium">{formatCurrency(selectedWithdrawal.netAmount)}</span> for <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedWithdrawal.user?.username}</span>
            </p>
            
            <div className={`p-3 rounded-lg mb-4 space-y-1 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
              <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedWithdrawal.bankName}</p>
              <p className={`font-mono text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedWithdrawal.accountNumber}</p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedWithdrawal.accountName}</p>
            </div>

            <div className="mb-4">
              <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.withdrawals.transactionRef')}</label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Enter ref..."
                className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isDark 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                } border`}
              />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setShowApproveModal(false);
                  setTransactionRef('');
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t(language, 'admin.common.cancel')}
              </button>
              <button 
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {actionLoading ? t(language, 'admin.common.processing') + '...' : t(language, 'admin.common.approve')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`rounded-xl p-5 w-full max-w-sm mx-4 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t(language, 'admin.withdrawals.rejectRequest')}</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Reject <span className="text-orange-500 font-medium">{formatCurrency(selectedWithdrawal.amount)}</span> from <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedWithdrawal.user?.username}</span>
            </p>
            
            <div className="mb-4">
              <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Reason *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason..."
                className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none h-20 ${
                  isDark 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                } border`}
              />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t(language, 'admin.common.cancel')}
              </button>
              <button 
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="flex-1 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {actionLoading ? t(language, 'admin.common.processing') + '...' : t(language, 'admin.common.reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
