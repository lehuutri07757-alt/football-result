'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
} from 'lucide-react';
import { adminService, Transaction } from '@/services/admin.service';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { TableSkeleton } from '@/components/admin/AdminLoading';
import { toast } from 'sonner';

export default function AdminTransactionsPage() {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await adminService.getTransactions({
        page,
        limit: 15,
        search: searchQuery || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
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
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchTransactions();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const getTypeBadge = (type: string) => {
    const config: Record<string, { bg: string; text: string; label: string; icon: 'up' | 'down' }> = {
      deposit: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Deposit', icon: 'up' },
      withdrawal: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Withdrawal', icon: 'down' },
      bet_placed: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Bet placed', icon: 'down' },
      bet_won: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Bet won', icon: 'up' },
      bet_refund: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Bet refund', icon: 'up' },
      bonus: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Bonus', icon: 'up' },
      transfer: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Transfer', icon: 'down' },
      adjustment: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Adjustment', icon: 'up' },
    };
    const c = config[type] || { bg: 'bg-gray-500/20', text: 'text-gray-400', label: type, icon: 'up' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text} border border-current/30 flex items-center gap-1`}>
        {c.icon === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {c.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
      cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    const labels: Record<string, string> = {
      completed: 'Completed',
      pending: 'Pending',
      failed: 'Failed',
      cancelled: 'Cancelled',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[status] || 'bg-gray-500/20 text-gray-400'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const isPositiveAmount = (type: string) => {
    return ['deposit', 'bet_won', 'bet_refund', 'bonus'].includes(type);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Transaction History</h2>
          <p className="text-gray-400 text-sm mt-1">Total {total} transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-[#1e2a3a] border border-[#2a3a4a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88] transition-colors w-64"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#1e2a3a] border border-[#2a3a4a] rounded-xl text-white focus:outline-none focus:border-[#00ff88] transition-colors"
          >
            <option value="all">All types</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="bet_placed">Bet placed</option>
            <option value="bet_won">Bet won</option>
            <option value="bet_refund">Bet refund</option>
            <option value="bonus">Bonus</option>
            <option value="adjustment">Adjustment</option>
          </select>
          <button 
            onClick={fetchTransactions}
            className="p-2.5 bg-[#1e2a3a] border border-[#2a3a4a] rounded-xl text-gray-400 hover:text-white hover:border-[#00ff88] transition-colors"
          >
            <RefreshCw size={18} />
          </button>
          <button 
            className="p-2.5 bg-[#1e2a3a] border border-[#2a3a4a] rounded-xl text-gray-400 hover:text-white hover:border-[#00ff88] transition-colors"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#1e2a3a] to-[#1a2535] rounded-2xl border border-[#2a3a4a] overflow-hidden">
        {loading ? (
          <TableSkeleton columns={9} rows={15} />
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <CreditCard size={48} className="mb-4 opacity-50" />
            <p>No transactions</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#243444] text-left">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-300">ID</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-300">Type</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-300">Amount</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-300">Balance before</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-300">Balance after</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-300">Balance type</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-300">Time</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-300">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a3a4a]">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#243444] transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-gray-400 font-mono text-xs">
                          {tx.id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="px-6 py-4">{getTypeBadge(tx.type)}</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${isPositiveAmount(tx.type) ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isPositiveAmount(tx.type) ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {formatCurrency(tx.balanceBefore)}
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        {formatCurrency(tx.balanceAfter)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          tx.balanceType === 'real' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {tx.balanceType === 'real' ? 'Real' : 'Bonus'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(tx.status)}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(tx.createdAt)}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => {
                            setSelectedTransaction(tx);
                            setShowDetailModal(true);
                          }}
                          className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors" 
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

            <div className="px-6 py-4 bg-[#1a2535] border-t border-[#2a3a4a] flex items-center justify-between">
              <span className="text-gray-400 text-sm">
                Showing {(page - 1) * 15 + 1}-{Math.min(page * 15, total)} of {total}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 bg-[#2a3a4a] text-gray-400 rounded-lg hover:text-white transition-colors disabled:opacity-50"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="px-4 py-2 bg-[#00ff88] text-[#1a2535] font-semibold rounded-lg">{page}</span>
                <span className="text-gray-400">/ {totalPages}</span>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 bg-[#2a3a4a] text-gray-400 rounded-lg hover:text-white transition-colors disabled:opacity-50"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-[#1e2a3a] to-[#1a2535] rounded-2xl border border-[#2a3a4a] p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Transaction details</h3>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-lg bg-[#2a3a4a] text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-[#1a2535] rounded-xl text-center">
                <div className="mb-2">{getTypeBadge(selectedTransaction.type)}</div>
                <p className={`text-3xl font-bold ${isPositiveAmount(selectedTransaction.type) ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositiveAmount(selectedTransaction.type) ? '+' : '-'}{formatCurrency(Math.abs(selectedTransaction.amount))}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#1a2535] rounded-xl">
                  <p className="text-gray-400 text-sm mb-1">Balance before</p>
                  <p className="text-white font-bold">{formatCurrency(selectedTransaction.balanceBefore)}</p>
                </div>
                <div className="p-4 bg-[#1a2535] rounded-xl">
                  <p className="text-gray-400 text-sm mb-1">Balance after</p>
                  <p className="text-[#00ff88] font-bold">{formatCurrency(selectedTransaction.balanceAfter)}</p>
                </div>
              </div>

              <div className="p-4 bg-[#1a2535] rounded-xl space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Transaction ID</span>
                  <span className="text-white font-mono text-sm">{selectedTransaction.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Balance type</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    selectedTransaction.balanceType === 'real' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {selectedTransaction.balanceType === 'real' ? 'Real balance' : 'Bonus balance'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time</span>
                  <span className="text-white">{formatDate(selectedTransaction.createdAt)}</span>
                </div>
                {selectedTransaction.referenceType && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reference</span>
                    <span className="text-white">{selectedTransaction.referenceType}</span>
                  </div>
                )}
              </div>

              {selectedTransaction.description && (
                <div className="p-4 bg-[#1a2535] rounded-xl">
                  <p className="text-gray-400 text-sm mb-1">Description</p>
                  <p className="text-white">{selectedTransaction.description}</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowDetailModal(false)}
              className="w-full mt-6 py-3 bg-[#2a3a4a] text-white rounded-xl hover:bg-[#3a4a5a] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
