'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { adminService, AdminStats } from '@/services/admin.service';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { AdminLoading } from '@/components/admin/AdminLoading';
import Link from 'next/link';

interface RecentActivity {
  id: string;
  type: 'deposit' | 'withdrawal' | 'bet';
  user: string;
  amount: number;
  status: string;
  time: string;
}

export default function AdminPage() {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        setStats({
          totalUsers: 12458,
          totalRevenue: 2500000000,
          totalBets: 45678,
          pendingDeposits: 23,
          pendingWithdrawals: 15,
          activeMatches: 48,
          todayBets: 1247,
          todayRevenue: 125000000,
        });

        setRecentActivities([
          { id: '1', type: 'deposit', user: 'nguyenvana', amount: 5000000, status: 'pending', time: '5 minutes ago' },
          { id: '2', type: 'bet', user: 'tranthib', amount: 1000000, status: 'won', time: '10 minutes ago' },
          { id: '3', type: 'withdrawal', user: 'levancuong', amount: 2000000, status: 'pending', time: '15 minutes ago' },
          { id: '4', type: 'bet', user: 'phamthid', amount: 500000, status: 'lost', time: '20 minutes ago' },
          { id: '5', type: 'deposit', user: 'hoangmine', amount: 10000000, status: 'approved', time: '30 minutes ago' },
        ]);
        setLoading(false);
      }, 800);
      
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `₫${(amount / 1000000000).toFixed(1)}B`;
    }
    if (amount >= 1000000) {
      return `₫${(amount / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatFullCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
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
      pending: 'Pending',
      approved: 'Approved',
      won: 'Won',
      lost: 'Lost',
      rejected: 'Rejected',
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

  const statsData = [
    { 
      label: 'Total Revenue', 
      value: formatCurrency(stats?.totalRevenue || 0), 
      change: '+23%', 
      trend: 'up',
      icon: DollarSign, 
      color: 'emerald' 
    },
    { 
      label: 'Total Users', 
      value: stats?.totalUsers?.toLocaleString() || '0', 
      change: '+12%', 
      trend: 'up',
      icon: Users, 
      color: 'blue' 
    },
    { 
      label: 'Active Matches', 
      value: stats?.activeMatches?.toString() || '0', 
      change: '+5', 
      trend: 'up',
      icon: Trophy, 
      color: 'orange' 
    },
    { 
      label: "Today's Bets", 
      value: stats?.todayBets?.toLocaleString() || '0', 
      change: '-8%', 
      trend: 'down',
      icon: Clock, 
      color: 'purple' 
    },
  ];

  if (loading) {
    return <AdminLoading text="Loading dashboard..." />;
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
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={`lg:col-span-2 rounded-2xl p-6 ${
          isDark 
            ? 'bg-slate-900 border border-slate-800 shadow-lg shadow-black/20' 
            : 'bg-white border border-slate-100 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`font-bold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Activity size={20} className="text-emerald-500" />
              Recent Activity
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
          
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div 
                key={activity.id} 
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
                  isDark 
                    ? 'bg-slate-800/50 hover:bg-slate-800 border border-slate-800/50' 
                    : 'bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-sm'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isDark ? 'bg-slate-800' : 'bg-white shadow-sm border border-slate-100'
                }`}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
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
                    {activity.time}
                  </p>
                </div>

                <div className="text-right">
                  <p className={`text-sm font-bold mb-1 ${
                    activity.type === 'deposit' || activity.status === 'won' 
                      ? 'text-emerald-500' 
                      : activity.status === 'lost' 
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
            ))}
          </div>
        </div>

        <div className="space-y-6">
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
                    <p className="text-xs text-amber-500 font-medium">Action Required</p>
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
                    <p className="text-xs text-orange-500 font-medium">Action Required</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-orange-500">
                  {stats?.pendingWithdrawals || 0}
                </span>
              </Link>
            </div>
          </div>

          <div className={`rounded-2xl p-6 ${
            isDark 
              ? 'bg-slate-900 border border-slate-800 shadow-lg shadow-black/20' 
              : 'bg-white border border-slate-100 shadow-sm'
          }`}>
             <h3 className={`font-bold text-lg mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Quick Access
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin/users" className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white' 
                  : 'bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100'
              }`}>
                <Users size={24} className="text-blue-500" />
                <span className="text-xs font-medium">Users</span>
              </Link>
              <Link href="/admin/matches" className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white' 
                  : 'bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100'
              }`}>
                <Trophy size={24} className="text-yellow-500" />
                <span className="text-xs font-medium">Matches</span>
              </Link>
              <Link href="/admin/bets" className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white' 
                  : 'bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100'
              }`}>
                <CreditCard size={24} className="text-purple-500" />
                <span className="text-xs font-medium">Bets</span>
              </Link>
              <button className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white' 
                  : 'bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100'
              }`}>
                <MoreHorizontal size={24} className="text-slate-400" />
                <span className="text-xs font-medium">More</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}