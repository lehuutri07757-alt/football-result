'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Server,
  Gauge,
  Calendar,
  Mail,
  Clock,
  Wifi,
  WifiOff,
  Database,
  TrendingUp,
  Shield,
  User,
  CreditCard,
  Timer,
  AlertCircle,
} from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { AdminLoading } from '@/components/admin/AdminLoading';
import { adminService, ApiFootballAccountStatus } from '@/services/admin.service';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/language.store';
import { t } from '@/lib/i18n';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'checking';
  latency?: number;
  message?: string;
  lastChecked?: string;
}

interface EndpointHealth {
  name: string;
  endpoint: string;
  status: HealthCheckResult['status'];
  latency?: number;
  lastSuccess?: string;
}

export default function ApiHealthPage() {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';
  const language = useLanguageStore((s) => s.language);

  const [accountStatus, setAccountStatus] = useState<ApiFootballAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [apiHealth, setApiHealth] = useState<HealthCheckResult>({ status: 'checking' });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const hasFetchedInitially = useRef(false);

  const checkApiHealth = useCallback(async () => {
    setChecking(true);
    const startTime = Date.now();
    
    try {
      const response = await adminService.getApiFootballStatus();
      const latency = Date.now() - startTime;
      
      if (response) {
        setAccountStatus(response);
        setApiHealth({
          status: 'healthy',
          latency,
          message: 'API is responding normally',
          lastChecked: new Date().toISOString(),
        });
      } else {
        setApiHealth({
          status: 'unhealthy',
          latency,
          message: 'Failed to get API status',
          lastChecked: new Date().toISOString(),
        });
      }
      setLastCheck(new Date());
    } catch (error) {
      const latency = Date.now() - startTime;
      setApiHealth({
        status: 'unhealthy',
        latency,
        message: error instanceof Error ? error.message : 'Connection failed',
        lastChecked: new Date().toISOString(),
      });
    } finally {
      setChecking(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetchedInitially.current) return;
    hasFetchedInitially.current = true;
    checkApiHealth();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      checkApiHealth();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, checkApiHealth]);

  const getStatusIcon = (status: HealthCheckResult['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 size={20} className="text-emerald-500" />;
      case 'degraded':
        return <AlertTriangle size={20} className="text-amber-500" />;
      case 'unhealthy':
        return <XCircle size={20} className="text-red-500" />;
      case 'checking':
        return <RefreshCw size={20} className="text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: HealthCheckResult['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-500';
      case 'degraded':
        return 'text-amber-500';
      case 'unhealthy':
        return 'text-red-500';
      case 'checking':
        return 'text-blue-500';
    }
  };

  const getStatusBgColor = (status: HealthCheckResult['status']) => {
    switch (status) {
      case 'healthy':
        return isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200';
      case 'degraded':
        return isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200';
      case 'unhealthy':
        return isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200';
      case 'checking':
        return isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200';
    }
  };

  const getQuotaStatus = () => {
    if (!accountStatus) return 'checking';
    const percentage = (accountStatus.requests.current / accountStatus.requests.limit_day) * 100;
    if (percentage >= 90) return 'unhealthy';
    if (percentage >= 70) return 'degraded';
    return 'healthy';
  };

  const getQuotaStatusText = () => {
    if (!accountStatus) return 'Checking...';
    const percentage = (accountStatus.requests.current / accountStatus.requests.limit_day) * 100;
    if (percentage >= 90) return 'Critical - Near Limit';
    if (percentage >= 70) return 'Warning - High Usage';
    return t(language, 'admin.apiHealth.normal');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return <AdminLoading text={t(language, 'admin.common.loading')} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={cn('text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
            {t(language, 'admin.apiHealth.title')}
          </h1>
          <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
            Monitor API-Football connection status and quota usage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all',
            isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-50 border border-slate-200'
          )}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
            />
            <span className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-slate-600')}>
              Auto-refresh (30s)
            </span>
          </label>
          <button
            onClick={checkApiHealth}
            disabled={checking}
            className={cn(
              'px-4 py-2.5 rounded-lg transition-all active:scale-95 flex items-center gap-2 font-medium',
              isDark
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200'
            )}
          >
            <RefreshCw size={18} className={checking ? 'animate-spin' : ''} />
            {checking ? 'Checking...' : t(language, 'admin.apiHealth.checkNow')}
          </button>
        </div>
      </div>

      <div
        className={cn(
          'p-6 rounded-2xl border-2 transition-all',
          getStatusBgColor(apiHealth.status)
        )}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center',
              apiHealth.status === 'healthy' ? (isDark ? 'bg-emerald-500/20' : 'bg-emerald-100') :
              apiHealth.status === 'degraded' ? (isDark ? 'bg-amber-500/20' : 'bg-amber-100') :
              apiHealth.status === 'unhealthy' ? (isDark ? 'bg-red-500/20' : 'bg-red-100') :
              (isDark ? 'bg-blue-500/20' : 'bg-blue-100')
            )}>
              {apiHealth.status === 'healthy' ? <Wifi size={32} className="text-emerald-500" /> :
               apiHealth.status === 'unhealthy' ? <WifiOff size={32} className="text-red-500" /> :
               apiHealth.status === 'degraded' ? <AlertTriangle size={32} className="text-amber-500" /> :
               <RefreshCw size={32} className="text-blue-500 animate-spin" />}
            </div>
            <div>
              <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                API-Football Status
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(apiHealth.status)}
                <span className={cn('font-semibold capitalize', getStatusColor(apiHealth.status))}>
                  {apiHealth.status}
                </span>
                {apiHealth.message && (
                  <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                    - {apiHealth.message}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {apiHealth.latency && (
              <div className="text-center">
                <div className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                  {apiHealth.latency}ms
                </div>
                <div className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  Response Time
                </div>
              </div>
            )}
            {lastCheck && (
              <div className="text-center">
                <div className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-slate-600')}>
                  {formatTime(lastCheck)}
                </div>
                <div className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  Last Check
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={cn(
            'p-5 rounded-2xl transition-all',
            isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={cn('p-3 rounded-xl', isDark ? 'bg-blue-500/10' : 'bg-blue-50')}>
              <Gauge size={22} className="text-blue-500" />
            </div>
            <div className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              getQuotaStatus() === 'healthy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
              getQuotaStatus() === 'degraded' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
              'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
            )}>
              {getQuotaStatusText()}
            </div>
          </div>
          <h3 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>
            {accountStatus?.requests.current.toLocaleString() || '-'}
            <span className={cn('text-lg font-normal', isDark ? 'text-slate-500' : 'text-slate-400')}>
              /{accountStatus?.requests.limit_day.toLocaleString() || '-'}
            </span>
          </h3>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-slate-500')}>
            Daily API Requests
          </p>
          {accountStatus && (
            <div className="mt-3">
              <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-slate-700' : 'bg-slate-200')}>
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    getQuotaStatus() === 'unhealthy' ? 'bg-red-500' :
                    getQuotaStatus() === 'degraded' ? 'bg-amber-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${Math.min((accountStatus.requests.current / accountStatus.requests.limit_day) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div
          className={cn(
            'p-5 rounded-2xl transition-all',
            isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={cn('p-3 rounded-xl', isDark ? 'bg-emerald-500/10' : 'bg-emerald-50')}>
              <TrendingUp size={22} className="text-emerald-500" />
            </div>
          </div>
          <h3 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>
            {accountStatus?.provider.remainingToday.toLocaleString() || '-'}
          </h3>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-slate-500')}>
            Remaining Today
          </p>
        </div>

        <div
          className={cn(
            'p-5 rounded-2xl transition-all',
            isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={cn('p-3 rounded-xl', isDark ? 'bg-purple-500/10' : 'bg-purple-50')}>
              <CreditCard size={22} className="text-purple-500" />
            </div>
            {accountStatus?.subscription.active && (
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                Active
              </div>
            )}
          </div>
          <h3 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>
            {accountStatus?.subscription.plan || '-'}
          </h3>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-slate-500')}>
            Subscription Plan
          </p>
        </div>

        <div
          className={cn(
            'p-5 rounded-2xl transition-all',
            isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={cn('p-3 rounded-xl', isDark ? 'bg-amber-500/10' : 'bg-amber-50')}>
              <Calendar size={22} className="text-amber-500" />
            </div>
          </div>
          <h3 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>
            {accountStatus?.subscription.end ? formatDate(accountStatus.subscription.end) : '-'}
          </h3>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-slate-500')}>
            Subscription Expires
          </p>
        </div>
      </div>

      {accountStatus && (
        <div
          className={cn(
            'p-6 rounded-2xl',
            isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <User size={20} className="text-emerald-500" />
            <h3 className={cn('font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
              Account Information
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={cn('p-4 rounded-xl', isDark ? 'bg-slate-800' : 'bg-slate-50')}>
              <div className={cn('text-xs font-medium uppercase tracking-wider mb-1', isDark ? 'text-slate-400' : 'text-slate-500')}>
                Name
              </div>
              <div className={cn('font-medium', isDark ? 'text-white' : 'text-slate-900')}>
                {accountStatus.account.firstname} {accountStatus.account.lastname}
              </div>
            </div>
            <div className={cn('p-4 rounded-xl', isDark ? 'bg-slate-800' : 'bg-slate-50')}>
              <div className={cn('text-xs font-medium uppercase tracking-wider mb-1', isDark ? 'text-slate-400' : 'text-slate-500')}>
                Email
              </div>
              <div className={cn('font-medium flex items-center gap-2', isDark ? 'text-white' : 'text-slate-900')}>
                <Mail size={14} className="text-slate-400" />
                {accountStatus.account.email}
              </div>
            </div>
            <div className={cn('p-4 rounded-xl', isDark ? 'bg-slate-800' : 'bg-slate-50')}>
              <div className={cn('text-xs font-medium uppercase tracking-wider mb-1', isDark ? 'text-slate-400' : 'text-slate-500')}>
                Daily Limit
              </div>
              <div className={cn('font-medium', isDark ? 'text-white' : 'text-slate-900')}>
                {accountStatus.provider.dailyLimit.toLocaleString()} requests/day
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          'p-6 rounded-2xl',
          isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap size={20} className="text-emerald-500" />
          <h3 className={cn('font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
            Quick Actions
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a
            href="/admin/api-logs"
            className={cn(
              'p-4 rounded-xl text-center transition-all hover:scale-[1.02]',
              isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'
            )}
          >
            <Activity size={24} className="mx-auto mb-2 text-blue-500" />
            <div className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-slate-700')}>
              View API Logs
            </div>
          </a>
          <a
            href="/admin/matches"
            className={cn(
              'p-4 rounded-xl text-center transition-all hover:scale-[1.02]',
              isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'
            )}
          >
            <Database size={24} className="mx-auto mb-2 text-purple-500" />
            <div className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-slate-700')}>
              Manage Matches
            </div>
          </a>
          <a
            href="/admin/leagues"
            className={cn(
              'p-4 rounded-xl text-center transition-all hover:scale-[1.02]',
              isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'
            )}
          >
            <Shield size={24} className="mx-auto mb-2 text-emerald-500" />
            <div className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-slate-700')}>
              Manage Leagues
            </div>
          </a>
          <a
            href="/admin/settings"
            className={cn(
              'p-4 rounded-xl text-center transition-all hover:scale-[1.02]',
              isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'
            )}
          >
            <Server size={24} className="mx-auto mb-2 text-amber-500" />
            <div className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-slate-700')}>
              API Settings
            </div>
          </a>
        </div>
      </div>

      <div
        className={cn(
          'p-4 rounded-xl flex items-center gap-3',
          isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'
        )}
      >
        <AlertCircle size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
        <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
          API health check calls do not count against your daily quota limit. Data is fetched directly from API-Football status endpoint.
        </span>
      </div>
    </div>
  );
}
