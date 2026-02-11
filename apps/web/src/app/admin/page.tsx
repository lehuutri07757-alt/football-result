'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Trophy,
  DollarSign,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  MoreHorizontal,
  CreditCard,
  TrendingUp,
  Wallet,
  BarChart3,
  CheckCircle2,
  XCircle,
  Minus,
} from 'lucide-react';
import { adminService, AdminStats } from '@/services/admin.service';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { useLanguageStore } from '@/stores/language.store';
import { t } from '@/lib/i18n';
import { AdminLoading } from '@/components/admin/AdminLoading';
import Link from 'next/link';

export default function AdminPage() {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';
  const language = useLanguageStore((s) => s.language);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatFullCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
      approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
      won: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
      lost: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20',
    };
    
    const labels: Record<string, string> = {
      pending: t(language, 'admin.common.pending'),
      approved: t(language, 'admin.common.approved'),
      won: t(language, 'admin.dashboard.won'),
      lost: t(language, 'admin.dashboard.lost'),
      rejected: t(language, 'admin.common.rejected'),
    };

    const style = styles[status] || (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200');

    return (
      <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${style}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownToLine size={18} className="text-emerald-500" />;
      case 'withdrawal': return <ArrowUpFromLine size={18} className="text-orange-500" />;
      case 'bet': return <Trophy size={18} className="text-blue-500" />;
      default: return <Activity size={18} className="text-slate-500" />;
    }
  };

  const formatTrend = (value: number, isAbsolute = false): string => {
    if (isAbsolute) return value >= 0 ? `+${value}` : `${value}`;
    return value >= 0 ? `+${value}%` : `${value}%`;
  };

  const statsData = [
    { 
      label: t(language, 'admin.dashboard.totalRevenue'), 
      value: formatCurrency(stats?.totalRevenue || 0), 
      change: formatTrend(stats?.revenueChange || 0), 
      trend: (stats?.revenueChange || 0) >= 0 ? 'up' : 'down',
      subLabel: `Today: ${formatCurrency(stats?.todayRevenue || 0)}`,
      icon: DollarSign, 
      color: 'emerald' 
    },
    { 
      label: t(language, 'admin.dashboard.totalUsers'), 
      value: stats?.totalUsers?.toLocaleString() || '0', 
      change: formatTrend(stats?.usersChange || 0), 
      trend: (stats?.usersChange || 0) >= 0 ? 'up' : 'down',
      subLabel: `New today: ${stats?.newUsersToday || 0}`,
      icon: Users, 
      color: 'blue' 
    },
    { 
      label: t(language, 'admin.dashboard.activeMatches'), 
      value: stats?.activeMatches?.toString() || '0', 
      change: formatTrend(stats?.matchesDiff || 0, true), 
      trend: (stats?.matchesDiff || 0) >= 0 ? 'up' : 'down',
      subLabel: t(language, 'admin.dashboard.liveNow'),
      icon: Trophy, 
      color: 'orange' 
    },
    { 
      label: "Today's Bets", 
      value: stats?.todayBets?.toLocaleString() || '0', 
      change: formatTrend(stats?.betsChange || 0), 
      trend: (stats?.betsChange || 0) >= 0 ? 'up' : 'down',
      subLabel: `Total: ${stats?.totalBets?.toLocaleString() || '0'}`,
      icon: Clock, 
      color: 'purple' 
    },
  ];

  if (loading) {
    return <AdminLoading text={t(language, 'admin.common.loading')} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Dashboard Overview
          </h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Welcome back! Here's what's happening with your platform today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
            isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
          }`}>
            Live Updates
          </span>
          <button 
            onClick={fetchData}
            className={`p-2.5 rounded-lg transition-all active:scale-95 ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700' 
                : 'bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200 shadow-sm'
            }`}
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className={`group p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 ${
              isDark 
                ? 'bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-lg shadow-black/20' 
                : 'bg-white border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${
                isDark ? `bg-${stat.color}-500/10` : `bg-${stat.color}-50`
              }`}>
                <stat.icon size={22} className={`text-${stat.color}-500`} />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${
                stat.trend === 'up' 
                  ? 'bg-emerald-500/10 text-emerald-500' 
                  : 'bg-red-500/10 text-red-500'
              }`}>
                {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </span>
            </div>
            <div>
              <h3 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stat.value}
              </h3>
              <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {stat.label}
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {stat.subLabel}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Extra Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t(language, 'admin.dashboard.platformBalance'), value: formatCurrency(stats?.totalPlatformBalance || 0), icon: Wallet, iconColor: 'text-cyan-500', bgColor: isDark ? 'bg-cyan-500/10' : 'bg-cyan-50' },
          { label: t(language, 'admin.dashboard.totalDeposits'), value: formatCurrency(stats?.totalDeposits || 0), icon: ArrowDownToLine, iconColor: 'text-emerald-500', bgColor: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50' },
          { label: t(language, 'admin.dashboard.totalWithdrawals'), value: formatCurrency(stats?.totalWithdrawals || 0), icon: ArrowUpFromLine, iconColor: 'text-orange-500', bgColor: isDark ? 'bg-orange-500/10' : 'bg-orange-50' },
          { label: t(language, 'admin.dashboard.betsWonLost'), value: `${stats?.betsWon || 0} / ${stats?.betsLost || 0}`, icon: BarChart3, iconColor: 'text-indigo-500', bgColor: isDark ? 'bg-indigo-500/10' : 'bg-indigo-50' },
        ].map((item, i) => (
          <div key={i} className={`p-4 rounded-2xl flex items-center gap-3 ${
            isDark
              ? 'bg-slate-900 border border-slate-800'
              : 'bg-white border border-slate-100 shadow-sm'
          }`}>
            <div className={`p-2.5 rounded-xl ${item.bgColor}`}>
              <item.icon size={18} className={item.iconColor} />
            </div>
            <div>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.value}</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart (Last 7 Days) */}
      {stats?.last7DaysRevenue && stats.last7DaysRevenue.length > 0 && (() => {
        const maxRevenue = Math.max(...stats.last7DaysRevenue.map(d => Math.abs(d.revenue)), 1);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
          <div className={`rounded-2xl p-6 ${
            isDark
              ? 'bg-slate-900 border border-slate-800 shadow-lg shadow-black/20'
              : 'bg-white border border-slate-100 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`font-bold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <TrendingUp size={20} className="text-emerald-500" />
                Revenue (Last 7 Days)
              </h3>
              <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Total: {formatCurrency(stats.last7DaysRevenue.reduce((s, d) => s + d.revenue, 0))}
              </span>
            </div>
            <div className="flex items-end gap-2 h-40">
              {stats.last7DaysRevenue.map((day, i) => {
                const height = Math.max((Math.abs(day.revenue) / maxRevenue) * 100, 4);
                const isPositive = day.revenue >= 0;
                const dateObj = new Date(day.date + 'T00:00:00');
                const dayName = dayNames[dateObj.getDay()];
                const dateLabel = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className={`text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {formatCurrency(day.revenue)}
                    </div>
                    <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                      <div
                        className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 group-hover:opacity-80 ${
                          isPositive
                            ? (isDark ? 'bg-emerald-500/60' : 'bg-emerald-400')
                            : (isDark ? 'bg-red-500/60' : 'bg-red-400')
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{dayName}</p>
                      <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{dateLabel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className={`lg:col-span-2 rounded-2xl p-6 ${
          isDark 
            ? 'bg-slate-900 border border-slate-800 shadow-lg shadow-black/20' 
            : 'bg-white border border-slate-100 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`font-bold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Activity size={20} className="text-emerald-500" />
              {t(language, 'admin.dashboard.recentActivity')}
            </h3>
            <Link 
              href="/admin/transactions" 
              className={`text-sm font-medium transition-colors ${
                isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'
              }`}
            >
              View All
            </Link>
          </div>
          
          <div className="space-y-3">
            {(!stats?.recentActivities || stats.recentActivities.length === 0) ? (
              <div className={`text-center py-10 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <Activity size={32} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">{t(language, 'admin.dashboard.noRecentActivity')}</p>
                <p className="text-xs mt-1">{t(language, 'admin.dashboard.transactionsAppearHere')}</p>
              </div>
            ) : (
              stats.recentActivities.map((activity) => {
                const timeAgo = (() => {
                  const diff = Date.now() - new Date(activity.time).getTime();
                  const mins = Math.floor(diff / 60000);
                  if (mins < 1) return t(language, 'admin.dashboard.justNow');
                  if (mins < 60) return `${mins}m ago`;
                  const hours = Math.floor(mins / 60);
                  if (hours < 24) return `${hours}h ago`;
                  const days = Math.floor(hours / 24);
                  return `${days}d ago`;
                })();

                return (
                  <div 
                    key={activity.id} 
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
                      isDark 
                        ? 'bg-slate-800/50 hover:bg-slate-800 border border-slate-800/50' 
                        : 'bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isDark ? 'bg-slate-800' : 'bg-white shadow-sm border border-slate-100'
                    }`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {activity.user}
                        </p>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {activity.type}
                        </span>
                      </div>
                      <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <Clock size={12} />
                        {timeAgo}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className={`text-sm font-bold mb-0.5 ${
                        activity.type === 'deposit'
                          ? 'text-emerald-500' 
                          : activity.type === 'withdrawal'
                            ? 'text-red-500' 
                            : isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {activity.type === 'deposit' ? '+' : activity.type === 'withdrawal' ? '-' : ''}
                        {formatFullCurrency(activity.amount)}
                      </p>
                      <div className="flex justify-end">
                        {getStatusBadge(activity.status)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Bet Status Breakdown */}
          <div className={`rounded-2xl p-6 ${
            isDark 
              ? 'bg-slate-900 border border-slate-800 shadow-lg shadow-black/20' 
              : 'bg-white border border-slate-100 shadow-sm'
          }`}>
            <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <BarChart3 size={20} className="text-indigo-500" />
              Bet Breakdown
            </h3>
            <div className="space-y-3">
              {[
                { label: t(language, 'admin.dashboard.won'), count: stats?.betsWon || 0, icon: CheckCircle2, color: 'emerald' },
                { label: t(language, 'admin.dashboard.lost'), count: stats?.betsLost || 0, icon: XCircle, color: 'red' },
                { label: t(language, 'admin.common.pending'), count: stats?.betsPending || 0, icon: Clock, color: 'amber' },
              ].map((item, i) => {
                const total = (stats?.totalBets || 1);
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <item.icon size={14} className={`text-${item.color}-500`} />
                        <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.label}</span>
                      </div>
                      <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.count.toLocaleString()} <span className={`text-xs font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({pct}%)</span>
                      </span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 bg-${item.color}-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Actions */}
          <div className={`rounded-2xl p-6 ${
            isDark 
              ? 'bg-slate-900 border border-slate-800 shadow-lg shadow-black/20' 
              : 'bg-white border border-slate-100 shadow-sm'
          }`}>
            <h3 className={`font-bold text-lg mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Pending Actions
            </h3>
            
            <div className="space-y-3">
              <Link 
                href="/admin/deposits" 
                className={`flex items-center justify-between p-4 rounded-xl transition-all group ${
                  isDark 
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/10' 
                    : 'bg-amber-50 hover:bg-amber-100 border border-amber-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-500/20' : 'bg-white'}`}>
                    <ArrowDownToLine size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Pending Deposits
                    </p>
                    <p className="text-xs text-amber-500 font-medium">{t(language, 'admin.dashboard.actionRequired')}</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-amber-500">
                  {stats?.pendingDeposits || 0}
                </span>
              </Link>

              <Link 
                href="/admin/withdrawals" 
                className={`flex items-center justify-between p-4 rounded-xl transition-all group ${
                  isDark 
                    ? 'bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/10' 
                    : 'bg-orange-50 hover:bg-orange-100 border border-orange-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-orange-500/20' : 'bg-white'}`}>
                    <ArrowUpFromLine size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Pending Withdrawals
                    </p>
                    <p className="text-xs text-orange-500 font-medium">{t(language, 'admin.dashboard.actionRequired')}</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-orange-500">
                  {stats?.pendingWithdrawals || 0}
                </span>
              </Link>
            </div>
          </div>

          {/* Quick Access */}
          <div className={`rounded-2xl p-6 ${
            isDark 
              ? 'bg-slate-900 border border-slate-800 shadow-lg shadow-black/20' 
              : 'bg-white border border-slate-100 shadow-sm'
          }`}>
             <h3 className={`font-bold text-lg mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t(language, 'admin.dashboard.quickLinks')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin/users" className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white' 
                  : 'bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100'
              }`}>
                <Users size={24} className="text-blue-500" />
                <span className="text-xs font-medium">{t(language, 'admin.nav.users')}</span>
              </Link>
              <Link href="/admin/matches" className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white' 
                  : 'bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100'
              }`}>
                <Trophy size={24} className="text-yellow-500" />
                <span className="text-xs font-medium">{t(language, 'admin.nav.matches')}</span>
              </Link>
              <Link href="/admin/bets" className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white' 
                  : 'bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100'
              }`}>
                <CreditCard size={24} className="text-purple-500" />
                <span className="text-xs font-medium">{t(language, 'admin.nav.bets')}</span>
              </Link>
              <Link href="/admin/settings" className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white' 
                  : 'bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100'
              }`}>
                <MoreHorizontal size={24} className="text-slate-400" />
                <span className="text-xs font-medium">{t(language, 'admin.nav.settings')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}