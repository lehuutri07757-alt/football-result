'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { adminService, AdminUser, WalletDetails, Transaction } from '@/services/admin.service';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/admin/AdminLoading';

type TabType = 'details' | 'wallet' | 'stats' | 'bets' | 'transactions';

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
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bets, setBets] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // Wallet state
  const [walletDetails, setWalletDetails] = useState<WalletDetails | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<Transaction[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletPage, setWalletPage] = useState(1);
  const [walletTotalPages, setWalletTotalPages] = useState(1);

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
    if (activeTab === 'stats' && user) {
      fetchStats();
    } else if (activeTab === 'transactions' && user) {
      fetchTransactions();
    } else if (activeTab === 'wallet' && user) {
      fetchWalletData();
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
    setStatsLoading(true);
    try {
      const data = await adminService.getTransactions({ userId, limit: 10 });
      setStats(data);
    } catch (error) {
      toast.error('Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setStatsLoading(true);
    try {
      const data = await adminService.getTransactions({ userId, limit: 20 });
      setTransactions(data.data);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setStatsLoading(false);
    }
  };

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

  const handleWalletPageChange = (page: number) => {
    fetchWalletData(page);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(amount);
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
    };
    const lightStyles: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700',
      suspended: 'bg-orange-100 text-orange-700',
      blocked: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      active: 'Active',
      suspended: 'Suspended',
      blocked: 'Blocked',
    };
    const styles = isDark ? darkStyles : lightStyles;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || (isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
        {labels[status] || status}
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
    { id: 'details', label: 'Details & Edit', icon: User },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'stats', label: 'Statistics', icon: Activity },
    { id: 'transactions', label: 'Transactions', icon: History },
  ];

  return (
    <div className="space-y-4">
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
          <div>
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {user.username}
            </h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              User ID: {user.id.slice(0, 8)}...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(user.status)}
        </div>
      </div>

      <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white border border-slate-200'}`}>
        <div className={`flex border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-b-2 border-emerald-500'
                    : ''
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
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Mail size={14} className="inline mr-1" />
                    Email
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
                    <Phone size={14} className="inline mr-1" />
                    Phone
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
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    First Name
                  </label>
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
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Last Name
                  </label>
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
                    <Shield size={14} className="inline mr-1" />
                    Status
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
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Role
                  </label>
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

              <div>
                <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Betting Limits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Min Bet
                    </label>
                    <input
                      type="number"
                      value={formData.bettingLimits.minBet}
                      onChange={(e) => setFormData({
                        ...formData,
                        bettingLimits: { ...formData.bettingLimits, minBet: Number(e.target.value) }
                      })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Max Bet
                    </label>
                    <input
                      type="number"
                      value={formData.bettingLimits.maxBet}
                      onChange={(e) => setFormData({
                        ...formData,
                        bettingLimits: { ...formData.bettingLimits, maxBet: Number(e.target.value) }
                      })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Daily Limit
                    </label>
                    <input
                      type="number"
                      value={formData.bettingLimits.dailyLimit}
                      onChange={(e) => setFormData({
                        ...formData,
                        bettingLimits: { ...formData.bettingLimits, dailyLimit: Number(e.target.value) }
                      })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Weekly Limit
                    </label>
                    <input
                      type="number"
                      value={formData.bettingLimits.weeklyLimit}
                      onChange={(e) => setFormData({
                        ...formData,
                        bettingLimits: { ...formData.bettingLimits, weeklyLimit: Number(e.target.value) }
                      })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Monthly Limit
                    </label>
                    <input
                      type="number"
                      value={formData.bettingLimits.monthlyLimit}
                      onChange={(e) => setFormData({
                        ...formData,
                        bettingLimits: { ...formData.bettingLimits, monthlyLimit: Number(e.target.value) }
                      })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
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

          {activeTab === 'wallet' && (
            <div className="space-y-6">
              {walletLoading ? (
                <TableSkeleton columns={2} rows={4} />
              ) : (
                <>
                  {/* Balance Cards */}
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

                  {/* Adjust Balance Button */}
                  <button
                    onClick={() => setShowBalanceModal(true)}
                    className="w-full py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                  >
                    <DollarSign size={18} className="inline mr-2" />
                    Adjust Balance
                  </button>

                  {/* Wallet Transactions Table */}
                  <div>
                    <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
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
                                <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Amount</th>
                                <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Balance After</th>
                                <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Description</th>
                                <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
                                <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Date</th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-200'}`}>
                              {walletTransactions.map((txn) => (
                                <tr key={txn.id} className={isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}>
                                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      txn.type === 'deposit' ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') :
                                      txn.type === 'withdrawal' ? (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700') :
                                      txn.type === 'bonus' ? (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700') :
                                      txn.type === 'adjustment' ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700') :
                                      (isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600')
                                    }`}>
                                      {txn.type}
                                    </span>
                                  </td>
                                  <td className={`px-4 py-3 text-sm font-medium ${
                                    txn.balanceAfter > txn.balanceBefore ? 'text-emerald-500' : 'text-red-500'
                                  }`}>
                                    {txn.balanceAfter > txn.balanceBefore ? '+' : '-'}{formatCurrency(txn.amount)}
                                  </td>
                                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {formatCurrency(txn.balanceAfter)}
                                  </td>
                                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {txn.description || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                                      txn.status === 'completed'
                                        ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                        : txn.status === 'pending'
                                        ? isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                                        : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                                    }`}>
                                      {txn.status}
                                    </span>
                                  </td>
                                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {formatDate(txn.createdAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        {walletTotalPages > 1 && (
                          <div className="flex items-center justify-between mt-4">
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              Page {walletPage} of {walletTotalPages}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleWalletPageChange(walletPage - 1)}
                                disabled={walletPage <= 1}
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                  isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                Previous
                              </button>
                              <button
                                onClick={() => handleWalletPageChange(walletPage + 1)}
                                disabled={walletPage >= walletTotalPages}
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                  isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Bets</span>
                    <Activity className="text-blue-500" size={20} />
                  </div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>0</p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Stake</span>
                    <TrendingDown className="text-red-500" size={20} />
                  </div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatCurrency(0)}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Wins</span>
                    <TrendingUp className="text-emerald-500" size={20} />
                  </div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatCurrency(0)}
                  </p>
                </div>
              </div>
              <p className={`text-sm text-center py-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Detailed betting statistics will be displayed here
              </p>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-4">
              {statsLoading ? (
                <TableSkeleton columns={5} rows={5} />
              ) : transactions.length === 0 ? (
                <p className={`text-sm text-center py-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  No transactions found
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={isDark ? 'bg-slate-700/50' : 'bg-slate-50'}>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Type</th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Amount</th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Balance</th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Date</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-200'}`}>
                      {transactions.map((txn) => (
                        <tr key={txn.id} className={isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}>
                          <td className={`px-4 py-3 text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{txn.type}</td>
                          <td className={`px-4 py-3 text-sm font-medium ${txn.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {formatCurrency(txn.amount)}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {formatCurrency(txn.balanceAfter)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              txn.status === 'completed'
                                ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                : isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {txn.status}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {formatDate(txn.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Balance Type
                </label>
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
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Amount
                </label>
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
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Reason
                </label>
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
