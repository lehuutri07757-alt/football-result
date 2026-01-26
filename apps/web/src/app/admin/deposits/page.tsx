'use client';

import { useState, useEffect } from 'react';
import {
  ArrowDownToLine,
  Search,
  Filter,
  Eye,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { adminService, DepositRequest } from '@/services/admin.service';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { TableSkeleton } from '@/components/admin/AdminLoading';
import { toast } from 'sonner';

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
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDeposits = async () => {
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
    } catch (error) {
      console.error('Failed to fetch deposits:', error);
      toast.error('Failed to load deposit requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchDeposits();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await adminService.approveDeposit(id);
      toast.success('Deposit approved');
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
      toast.success('Deposit rejected');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(amount);
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
      approved: 'bg-emerald-500/20 text-emerald-400',
      rejected: 'bg-red-500/20 text-red-400',
      cancelled: 'bg-slate-500/20 text-slate-400',
    };
    const lightStyles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-slate-100 text-slate-500',
    };
    const labels: Record<string, string> = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    };
    const styles = isDark ? darkStyles : lightStyles;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || (isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      bank_transfer: 'Bank transfer',
      e_wallet: 'E-wallet',
      crypto: 'Crypto',
      card: 'Prepaid card',
    };
    return labels[method] || method;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Deposits</h2>
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
              className={`pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 ${
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
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button 
            onClick={fetchDeposits}
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
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pending</p>
            <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {deposits.filter(d => d.status === 'pending').length}
            </p>
          </div>
        </div>
        <div className={`p-3 rounded-lg flex items-center gap-3 ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
          <Check className="text-emerald-500" size={20} />
          <div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Approved</p>
            <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {deposits.filter(d => d.status === 'approved').length}
            </p>
          </div>
        </div>
        <div className={`p-3 rounded-lg flex items-center gap-3 ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
          <X className="text-red-500" size={20} />
          <div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Rejected</p>
            <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {deposits.filter(d => d.status === 'rejected').length}
            </p>
          </div>
        </div>
        <div className={`p-3 rounded-lg flex items-center gap-3 ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
          <ArrowDownToLine className="text-emerald-500" size={20} />
          <div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total</p>
            <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(deposits.filter(d => d.status === 'approved').reduce((sum, d) => sum + d.amount, 0))}
            </p>
          </div>
        </div>
      </div>

      <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm border border-slate-100'}`}>
        {loading ? (
          <TableSkeleton columns={7} rows={10} />
        ) : deposits.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-16 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <ArrowDownToLine size={40} className="mb-3 opacity-50" />
            <p className="text-sm">No deposit requests</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDark ? 'bg-slate-700/50' : 'bg-slate-50'}>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>User</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Amount</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Method</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bank</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Time</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                  {deposits.map((deposit) => (
                    <tr key={deposit.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                            {deposit.user?.username?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{deposit.user?.username || 'N/A'}</p>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{deposit.user?.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-emerald-500 font-semibold text-sm">
                          {formatCurrency(deposit.amount)}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {getPaymentMethodLabel(deposit.paymentMethod)}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{deposit.bankName || '-'}</p>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{deposit.accountNumber || ''}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(deposit.status)}</td>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(deposit.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              setSelectedDeposit(deposit);
                              setShowDetailModal(true);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-600 text-blue-400' : 'hover:bg-blue-50 text-blue-500'}`}
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          {deposit.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleApprove(deposit.id)}
                                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-600 text-emerald-400' : 'hover:bg-emerald-50 text-emerald-500'}`}
                                title="Approve"
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedDeposit(deposit);
                                  setShowRejectModal(true);
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-600 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
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

      {showDetailModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`rounded-xl p-5 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Deposit Details</h3>
              <button 
                onClick={() => setShowDetailModal(false)}
                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {selectedDeposit.user?.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedDeposit.user?.username}</p>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedDeposit.user?.email}</p>
                </div>
              </div>

              <div className={`p-4 rounded-lg text-center ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Amount</p>
                <p className="text-emerald-500 font-bold text-2xl">
                  {formatCurrency(selectedDeposit.amount)}
                </p>
              </div>

              <div className={`p-3 rounded-lg space-y-2 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Method</span>
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>{getPaymentMethodLabel(selectedDeposit.paymentMethod)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Bank</span>
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>{selectedDeposit.bankName || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Account</span>
                  <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedDeposit.accountNumber || '-'}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Status</span>
                  {getStatusBadge(selectedDeposit.status)}
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Time</span>
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>{formatDate(selectedDeposit.createdAt)}</span>
                </div>
              </div>

              {selectedDeposit.proofImageUrl && (
                <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <a 
                    href={selectedDeposit.proofImageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-emerald-500 text-sm hover:underline"
                  >
                    <ImageIcon size={16} />
                    View proof image
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}

              {selectedDeposit.rejectReason && (
                <div className={`p-3 rounded-lg ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                  <p className="text-red-500 text-xs mb-1">Reject reason</p>
                  <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedDeposit.rejectReason}</p>
                </div>
              )}
            </div>

            {selectedDeposit.status === 'pending' && (
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
                  Reject
                </button>
                <button 
                  onClick={() => handleApprove(selectedDeposit.id)}
                  disabled={actionLoading}
                  className="flex-1 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
              </div>
            )}

            {selectedDeposit.status !== 'pending' && (
              <button 
                onClick={() => setShowDetailModal(false)}
                className={`w-full mt-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {showRejectModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`rounded-xl p-5 w-full max-w-sm mx-4 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Reject Request</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Reject <span className="text-emerald-500 font-medium">{formatCurrency(selectedDeposit.amount)}</span> from <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedDeposit.user?.username}</span>
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
                Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="flex-1 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
