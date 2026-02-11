'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  X,
  User,
  Mail,
  Phone,
  Shield,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  History,
  Wallet,
  AlertCircle,
  Key,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Target,
  Trophy,
  Copy,
  Check,
} from 'lucide-react';
import { adminService, AdminUser, AdminBet, WalletDetails, Transaction } from '@/services/admin.service';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/admin/AdminLoading';

type TabType = 'details' | 'wallet' | 'bets' | 'transactions' | 'security';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [showBalanceModal, setShowBalanceModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    roleId: '',
    agentId: '',
    status: 'active',
    bettingLimits: {
      minBet: 0,
      maxBet: 0,
      dailyLimit: 0,
      weeklyLimit: 0,
      monthlyLimit: 0,
    },
  });

  // Balance adjustment state
  const [balanceAdjustment, setBalanceAdjustment] = useState({
    amount: 0,
    type: 'add' as 'add' | 'subtract',
    balanceType: 'real' as 'real' | 'bonus',
    reason: '',
  });

  // Stats state
  const [stats, setStats] = useState<{ totalBets: number; totalStake: number; totalWins: number } | null>(null);

  // Bets state
  const [bets, setBets] = useState<AdminBet[]>([]);
  const [betsPage, setBetsPage] = useState(1);
  const [betsTotalPages, setBetsTotalPages] = useState(1);
  const [betsTotal, setBetsTotal] = useState(0);
  const [betsLoading, setBetsLoading] = useState(false);
  const [betsStatusFilter, setBetsStatusFilter] = useState('');

  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txnPage, setTxnPage] = useState(1);
  const [txnTotalPages, setTxnTotalPages] = useState(1);
  const [txnTotal, setTxnTotal] = useState(0);
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnTypeFilter, setTxnTypeFilter] = useState('');

  // Wallet state
  const [walletDetails, setWalletDetails] = useState<WalletDetails | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<Transaction[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletPage, setWalletPage] = useState(1);
  const [walletTotalPages, setWalletTotalPages] = useState(1);

  // Security / Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        phone: user.phone || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        roleId: user.role?.id || '',
        agentId: '',
        status: user.status,
        bettingLimits: {
          minBet: 0,
          maxBet: 0,
          dailyLimit: 0,
          weeklyLimit: 0,
          monthlyLimit: 0,
        },
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'bets') {
      fetchBets(1);
    } else if (activeTab === 'transactions') {
      fetchTransactions(1);
    } else if (activeTab === 'wallet') {
      fetchWalletData();
    } else if (activeTab === 'details') {
      fetchStats();
    }
  }, [activeTab, user]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUser(userId);
      setUser(data);
    } catch (error) {
      toast.error('Failed to load user');
      router.push('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await adminService.getUserStats(userId);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const fetchBets = useCallback(async (page: number = 1) => {
    setBetsLoading(true);
    try {
      const data = await adminService.getBets({
        userId,
        page,
        limit: 10,
        status: betsStatusFilter || undefined,
      });
      setBets(data.data);
      setBetsPage(data.meta.page);
      setBetsTotalPages(data.meta.totalPages);
      setBetsTotal(data.meta.total);
    } catch (error) {
      toast.error('Failed to load bets');
    } finally {
      setBetsLoading(false);
    }
  }, [userId, betsStatusFilter]);

  useEffect(() => {
    if (activeTab === 'bets' && user) {
      fetchBets(1);
    }
  }, [betsStatusFilter]);

  const fetchTransactions = useCallback(async (page: number = 1) => {
    setTxnLoading(true);
    try {
      const data = await adminService.getTransactions({
        userId,
        page,
        limit: 10,
        type: txnTypeFilter || undefined,
      });
      setTransactions(data.data);
      setTxnPage(data.meta.page);
      setTxnTotalPages(data.meta.totalPages);
      setTxnTotal(data.meta.total);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setTxnLoading(false);
    }
  }, [userId, txnTypeFilter]);

  useEffect(() => {
    if (activeTab === 'transactions' && user) {
      fetchTransactions(1);
    }
  }, [txnTypeFilter]);

  const fetchWalletData = async (page: number = 1) => {
    setWalletLoading(true);
    try {
      const [wallet, history] = await Promise.all([
        adminService.getUserWallet(userId),
        adminService.getUserWalletHistory(userId, page, 10),
      ]);
      setWalletDetails(wallet);
      setWalletTransactions(history.data);
      setWalletPage(history.meta.page);
      setWalletTotalPages(history.meta.totalPages);
    } catch (error) {
      toast.error('Failed to load wallet data');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminService.updateUser(userId, {
        email: formData.email,
        phone: formData.phone,
        firstName: formData.firstName,
        lastName: formData.lastName,
        status: formData.status,
        bettingLimits: formData.bettingLimits,
      } as any);
      toast.success('User updated successfully');
      fetchUser();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleBalanceAdjustment = async () => {
    if (!balanceAdjustment.amount || balanceAdjustment.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!balanceAdjustment.reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setSaving(true);
    try {
      await adminService.adjustUserWalletBalance(
        userId,
        balanceAdjustment.amount,
        balanceAdjustment.type,
        balanceAdjustment.balanceType,
        balanceAdjustment.reason
      );
      toast.success('Balance adjusted successfully');
      setShowBalanceModal(false);
      setBalanceAdjustment({ amount: 0, type: 'add', balanceType: 'real', reason: '' });
      fetchWalletData(walletPage);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to adjust balance');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setResettingPassword(true);
    try {
      await adminService.adminResetPassword(userId, newPassword);
      toast.success('Password reset successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const darkStyles: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-400',
      suspended: 'bg-orange-500/20 text-orange-400',
      blocked: 'bg-red-500/20 text-red-400',
      self_excluded: 'bg-purple-500/20 text-purple-400',
    };
    const lightStyles: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700',
      suspended: 'bg-orange-100 text-orange-700',
      blocked: 'bg-red-100 text-red-700',
      self_excluded: 'bg-purple-100 text-purple-700',
    };
    const labels: Record<string, string> = {
      active: 'Active',
      suspended: 'Suspended',
      blocked: 'Blocked',
      self_excluded: 'Self-excluded',
    };
    const styles = isDark ? darkStyles : lightStyles;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || (isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getBetStatusBadge = (status: string) => {
    const darkStyles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      won: 'bg-emerald-500/20 text-emerald-400',
      lost: 'bg-red-500/20 text-red-400',
      void: 'bg-slate-500/20 text-slate-400',
      partial_won: 'bg-blue-500/20 text-blue-400',
      cashout: 'bg-purple-500/20 text-purple-400',
    };
    const lightStyles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      won: 'bg-emerald-100 text-emerald-700',
      lost: 'bg-red-100 text-red-700',
      void: 'bg-slate-100 text-slate-600',
      partial_won: 'bg-blue-100 text-blue-700',
      cashout: 'bg-purple-100 text-purple-700',
    };
    const styles = isDark ? darkStyles : lightStyles;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || (isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getTxnTypeBadge = (type: string) => {
    const darkStyles: Record<string, string> = {
      deposit: 'bg-emerald-500/20 text-emerald-400',
      withdrawal: 'bg-red-500/20 text-red-400',
      bet_placed: 'bg-blue-500/20 text-blue-400',
      bet_won: 'bg-emerald-500/20 text-emerald-400',
      bet_refund: 'bg-purple-500/20 text-purple-400',
      bonus: 'bg-amber-500/20 text-amber-400',
      adjustment: 'bg-cyan-500/20 text-cyan-400',
      transfer: 'bg-indigo-500/20 text-indigo-400',
    };
    const lightStyles: Record<string, string> = {
      deposit: 'bg-emerald-100 text-emerald-700',
      withdrawal: 'bg-red-100 text-red-700',
      bet_placed: 'bg-blue-100 text-blue-700',
      bet_won: 'bg-emerald-100 text-emerald-700',
      bet_refund: 'bg-purple-100 text-purple-700',
      bonus: 'bg-amber-100 text-amber-700',
      adjustment: 'bg-cyan-100 text-cyan-700',
      transfer: 'bg-indigo-100 text-indigo-700',
    };
    const styles = isDark ? darkStyles : lightStyles;
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[type] || (isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600')}`}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
          <TableSkeleton columns={2} rows={8} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`rounded-xl p-8 text-center ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <AlertCircle className={`mx-auto mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} size={48} />
        <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>User not found</p>
      </div>
    );
  }

  const tabs = [
    { id: 'details', label: 'User Info', icon: User },
    { id: 'bets', label: 'Bets History', icon: Target },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'security', label: 'Security', icon: Key },
  ];

  const renderPagination = (currentPage: number, totalPg: number, total: number, onChangePage: (p: number) => void) => {
    if (totalPg <= 1) return null;
    return (
      <div className="flex items-center justify-between mt-4">
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Page {currentPage} of {totalPg}{total > 0 ? ` (${total} total)` : ''}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChangePage(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="px-3 py-1 bg-emerald-500 text-white text-sm font-medium rounded-lg">
            {currentPage}
          </span>
          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ {totalPg}</span>
          <button
            onClick={() => onChangePage(currentPage + 1)}
            disabled={currentPage >= totalPg}
            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/users')}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {user.username}
              </h2>
              <div className="flex items-center gap-2">
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  ID: {user.id.slice(0, 8)}...
                </p>
                <button onClick={handleCopyId} className={`p-0.5 rounded transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}>
                  {copiedId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(user.status)}
          <span className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
            {user.role?.name || 'User'}
          </span>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-white border border-slate-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="text-emerald-500" size={16} />
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Balance</span>
          </div>
          <p className="text-lg font-bold text-emerald-500">{formatCurrency(user.wallet?.realBalance || 0)}</p>
        </div>
        <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-white border border-slate-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Target className="text-blue-500" size={16} />
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Bets</span>
          </div>
          <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats?.totalBets ?? '-'}</p>
        </div>
        <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-white border border-slate-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="text-red-500" size={16} />
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Stake</span>
          </div>
          <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats ? formatCurrency(Number(stats.totalStake)) : '-'}</p>
        </div>
        <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-white border border-slate-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="text-amber-500" size={16} />
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Wins</span>
          </div>
          <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats ? formatCurrency(Number(stats.totalWins)) : '-'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white border border-slate-200'}`}>
        <div className={`flex border-b overflow-x-auto ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive ? 'border-b-2 border-emerald-500' : ''
                } ${
                  isActive
                    ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* ──── TAB: Details & Edit ──── */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* User Info Summary */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/30' : 'bg-slate-50'}`}>
                <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Account Info</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Username</p>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.username}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Email</p>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.email || '-'}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Created</p>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatDate(user.createdAt)}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Last Login</p>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}</p>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div>
                <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Edit Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Mail size={14} className="inline mr-1" /> Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Phone size={14} className="inline mr-1" /> Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Shield size={14} className="inline mr-1" /> Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Role</label>
                    <input
                      type="text"
                      value={user.role?.name || 'User'}
                      disabled
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark ? 'bg-slate-700/50 border-slate-600 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Betting Limits */}
              <div>
                <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Betting Limits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(['minBet', 'maxBet', 'dailyLimit', 'weeklyLimit', 'monthlyLimit'] as const).map((key) => (
                    <div key={key}>
                      <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                      </label>
                      <input
                        type="number"
                        value={formData.bettingLimits[key]}
                        onChange={(e) => setFormData({
                          ...formData,
                          bettingLimits: { ...formData.bettingLimits, [key]: Number(e.target.value) }
                        })}
                        className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => router.push('/admin/users')}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                    isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ──── TAB: Bets History ──── */}
          {activeTab === 'bets' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={betsStatusFilter}
                  onChange={(e) => setBetsStatusFilter(e.target.value)}
                  className={`px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 border ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                  <option value="void">Void</option>
                  <option value="partial_won">Partial Won</option>
                  <option value="cashout">Cashout</option>
                </select>
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {betsTotal} bets found
                </span>
              </div>

              {betsLoading ? (
                <TableSkeleton columns={6} rows={5} />
              ) : bets.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-16 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Target size={40} className="mb-3 opacity-50" />
                  <p className="text-sm">No bets found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={isDark ? 'bg-slate-700/50' : 'bg-slate-50'}>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bet ID</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Type</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Selections</th>
                          <th className={`px-4 py-3 text-right text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Stake</th>
                          <th className={`px-4 py-3 text-right text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Odds</th>
                          <th className={`px-4 py-3 text-right text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Potential Win</th>
                          <th className={`px-4 py-3 text-center text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Placed</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                        {bets.map((bet) => (
                          <tr key={bet.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                            <td className={`px-4 py-3 text-xs font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                              {bet.id.slice(0, 8)}
                            </td>
                            <td className={`px-4 py-3 text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                bet.betType === 'single'
                                  ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                                  : isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {bet.betType}
                              </span>
                            </td>
                            <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                              <div className="space-y-1 max-w-xs">
                                {bet.selections.slice(0, 2).map((sel) => (
                                  <div key={sel.id} className="text-xs truncate">
                                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                                      {sel.match.homeTeam.name} vs {sel.match.awayTeam.name}
                                    </span>
                                    <span className={`ml-1 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                      ({sel.selectionName || sel.selection})
                                    </span>
                                  </div>
                                ))}
                                {bet.selections.length > 2 && (
                                  <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    +{bet.selections.length - 2} more
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className={`px-4 py-3 text-sm text-right font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {formatCurrency(bet.stake)}
                            </td>
                            <td className={`px-4 py-3 text-sm text-right font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                              {Number(bet.totalOdds).toFixed(2)}
                            </td>
                            <td className={`px-4 py-3 text-sm text-right font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                              {formatCurrency(bet.potentialWin)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {getBetStatusBadge(bet.status)}
                            </td>
                            <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {formatDate(bet.placedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(betsPage, betsTotalPages, betsTotal, (p) => fetchBets(p))}
                </>
              )}
            </div>
          )}

          {/* ──── TAB: Transactions ──── */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={txnTypeFilter}
                  onChange={(e) => setTxnTypeFilter(e.target.value)}
                  className={`px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 border ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="">All Types</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="bet_placed">Bet Placed</option>
                  <option value="bet_won">Bet Won</option>
                  <option value="bet_refund">Bet Refund</option>
                  <option value="bonus">Bonus</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="transfer">Transfer</option>
                </select>
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {txnTotal} transactions found
                </span>
              </div>

              {txnLoading ? (
                <TableSkeleton columns={6} rows={5} />
              ) : transactions.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-16 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <History size={40} className="mb-3 opacity-50" />
                  <p className="text-sm">No transactions found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={isDark ? 'bg-slate-700/50' : 'bg-slate-50'}>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Type</th>
                          <th className={`px-4 py-3 text-right text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Amount</th>
                          <th className={`px-4 py-3 text-right text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Before</th>
                          <th className={`px-4 py-3 text-right text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>After</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Description</th>
                          <th className={`px-4 py-3 text-center text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Date</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-200'}`}>
                        {transactions.map((txn) => (
                          <tr key={txn.id} className={isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}>
                            <td className="px-4 py-3">{getTxnTypeBadge(txn.type)}</td>
                            <td className={`px-4 py-3 text-sm text-right font-medium ${
                              txn.balanceAfter >= txn.balanceBefore ? 'text-emerald-500' : 'text-red-500'
                            }`}>
                              {txn.balanceAfter >= txn.balanceBefore ? '+' : '-'}{formatCurrency(txn.amount)}
                            </td>
                            <td className={`px-4 py-3 text-sm text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {formatCurrency(txn.balanceBefore)}
                            </td>
                            <td className={`px-4 py-3 text-sm text-right font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                              {formatCurrency(txn.balanceAfter)}
                            </td>
                            <td className={`px-4 py-3 text-sm max-w-[200px] truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                              {txn.description || '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                txn.status === 'completed'
                                  ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                  : txn.status === 'pending'
                                  ? isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                                  : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                              }`}>
                                {txn.status}
                              </span>
                            </td>
                            <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {formatDate(txn.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(txnPage, txnTotalPages, txnTotal, (p) => fetchTransactions(p))}
                </>
              )}
            </div>
          )}

          {/* ──── TAB: Wallet ──── */}
          {activeTab === 'wallet' && (
            <div className="space-y-6">
              {walletLoading ? (
                <TableSkeleton columns={2} rows={4} />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <Wallet className="text-emerald-500" size={20} />
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Real Balance</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-500">
                        {formatCurrency(walletDetails?.realBalance || 0)}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <Wallet className="text-amber-500" size={20} />
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Bonus Balance</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-500">
                        {formatCurrency(walletDetails?.bonusBalance || 0)}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <Clock className="text-blue-500" size={20} />
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Pending Balance</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-500">
                        {formatCurrency(walletDetails?.pendingBalance || 0)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowBalanceModal(true)}
                    className="w-full py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                  >
                    <DollarSign size={18} className="inline mr-2" />
                    Adjust Balance
                  </button>

                  <div>
                    <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Transaction History
                    </h3>
                    {walletTransactions.length === 0 ? (
                      <p className={`text-sm text-center py-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        No transactions found
                      </p>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className={isDark ? 'bg-slate-700/50' : 'bg-slate-50'}>
                                <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Type</th>
                                <th className={`px-4 py-3 text-right text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Amount</th>
                                <th className={`px-4 py-3 text-right text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Balance After</th>
                                <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Description</th>
                                <th className={`px-4 py-3 text-center text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
                                <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Date</th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-200'}`}>
                              {walletTransactions.map((txn) => (
                                <tr key={txn.id} className={isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}>
                                  <td className="px-4 py-3">{getTxnTypeBadge(txn.type)}</td>
                                  <td className={`px-4 py-3 text-sm text-right font-medium ${
                                    txn.balanceAfter >= txn.balanceBefore ? 'text-emerald-500' : 'text-red-500'
                                  }`}>
                                    {txn.balanceAfter >= txn.balanceBefore ? '+' : '-'}{formatCurrency(txn.amount)}
                                  </td>
                                  <td className={`px-4 py-3 text-sm text-right ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {formatCurrency(txn.balanceAfter)}
                                  </td>
                                  <td className={`px-4 py-3 text-sm max-w-[200px] truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {txn.description || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      txn.status === 'completed'
                                        ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                        : txn.status === 'pending'
                                        ? isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                                        : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                                    }`}>
                                      {txn.status}
                                    </span>
                                  </td>
                                  <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {formatDate(txn.createdAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {renderPagination(walletPage, walletTotalPages, 0, (p) => fetchWalletData(p))}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ──── TAB: Security (Change Password) ──── */}
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-md">
              <div>
                <h3 className={`text-sm font-semibold mb-1 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Reset Password</h3>
                <p className={`text-xs mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Set a new password for this user. They will need to use this password at next login.
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Key size={14} className="inline mr-1" />
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className={`w-full px-3 py-2 pr-10 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                )}
              </div>

              {newPassword && (
                <div>
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => {
                      const strength = newPassword.length >= 12 ? 4 : newPassword.length >= 8 ? 3 : newPassword.length >= 6 ? 2 : 1;
                      return (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${
                            i <= strength
                              ? strength >= 4 ? 'bg-emerald-500' : strength >= 3 ? 'bg-blue-500' : strength >= 2 ? 'bg-amber-500' : 'bg-red-500'
                              : isDark ? 'bg-slate-700' : 'bg-slate-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {newPassword.length >= 12 ? 'Strong' : newPassword.length >= 8 ? 'Good' : newPassword.length >= 6 ? 'Fair' : 'Weak'}
                  </p>
                </div>
              )}

              <button
                onClick={handleResetPassword}
                disabled={resettingPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Key size={18} />
                {resettingPassword ? 'Resetting...' : 'Reset Password'}
              </button>

              <div className={`p-3 rounded-lg flex items-start gap-2 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                  This will immediately change the user&apos;s password. The user will be required to login with the new password. Active sessions will not be affected.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Balance Adjustment Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`rounded-xl p-6 w-full max-w-md mx-4 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Adjust Balance</h3>
              <button
                onClick={() => setShowBalanceModal(false)}
                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setBalanceAdjustment({ ...balanceAdjustment, type: 'add' })}
                  className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                    balanceAdjustment.type === 'add'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                      : isDark ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <TrendingUp size={20} className="mx-auto mb-1" />
                  Add
                </button>
                <button
                  onClick={() => setBalanceAdjustment({ ...balanceAdjustment, type: 'subtract' })}
                  className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                    balanceAdjustment.type === 'subtract'
                      ? 'border-red-500 bg-red-500/10 text-red-500'
                      : isDark ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <TrendingDown size={20} className="mx-auto mb-1" />
                  Subtract
                </button>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Balance Type</label>
                <select
                  value={balanceAdjustment.balanceType}
                  onChange={(e) => setBalanceAdjustment({ ...balanceAdjustment, balanceType: e.target.value as 'real' | 'bonus' })}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="real">Real Balance</option>
                  <option value="bonus">Bonus Balance</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Amount</label>
                <input
                  type="number"
                  value={balanceAdjustment.amount}
                  onChange={(e) => setBalanceAdjustment({ ...balanceAdjustment, amount: Number(e.target.value) })}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  min="0"
                  step="1000"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Reason</label>
                <textarea
                  value={balanceAdjustment.reason}
                  onChange={(e) => setBalanceAdjustment({ ...balanceAdjustment, reason: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  rows={3}
                  placeholder="Explain the reason for this adjustment..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleBalanceAdjustment}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? 'Processing...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setShowBalanceModal(false)}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                    isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
