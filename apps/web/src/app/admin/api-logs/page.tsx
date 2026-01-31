'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Zap,
  BarChart3,
  TrendingUp,
  Server,
  Gauge,
  Calendar,
  Mail,
} from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { AdminLoading } from '@/components/admin/AdminLoading';
import { adminService, ApiRequestLog, ApiLogsStats, ApiLogsQueryParams, ApiFootballAccountStatus } from '@/services/admin.service';
import { cn } from '@/lib/utils';

export default function ApiLogsPage() {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';

  const [logs, setLogs] = useState<ApiRequestLog[]>([]);
  const [stats, setStats] = useState<ApiLogsStats | null>(null);
  const [accountStatus, setAccountStatus] = useState<ApiFootballAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState<ApiLogsQueryParams>({
    status: 'all',
    page: 1,
    limit: 20,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [statsDays, setStatsDays] = useState(7);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  
  const isInitialMount = useRef(true);
  const isInitialStatsDays = useRef(true);

  const formatJsonPreview = (value: unknown) => {
    if (value === undefined || value === null) return '-';
    try {
      const json = JSON.stringify(value, null, 2);
      return json.length > 2000 ? json.slice(0, 2000) + '\n…' : json;
    } catch {
      return String(value);
    }
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getApiLogs(filters);
      setLogs(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await adminService.getApiLogsStats(statsDays);
      setStats(response);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [statsDays]);

  const fetchAccountStatus = useCallback(async () => {
    setQuotaLoading(true);
    try {
      const response = await adminService.getApiFootballStatus();
      setAccountStatus(response);
    } catch (error) {
      console.error('Failed to fetch account status:', error);
    } finally {
      setQuotaLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchStats();
    fetchAccountStatus();
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchLogs();
  }, [filters]);

  useEffect(() => {
    if (isInitialStatsDays.current) {
      isInitialStatsDays.current = false;
      return;
    }
    fetchStats();
  }, [statsDays]);

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (key: keyof ApiLogsQueryParams, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'error':
        return <XCircle size={16} className="text-red-500" />;
      case 'timeout':
        return <AlertTriangle size={16} className="text-amber-500" />;
      default:
        return <Activity size={16} className="text-slate-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
      error: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20',
      timeout: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    };

    return (
      <span className={cn('text-xs px-2 py-1 rounded-full font-medium border inline-flex items-center gap-1', styles[status] || 'bg-slate-100 text-slate-600')}>
        {getStatusIcon(status)}
        {status}
      </span>
    );
  };

  const formatResponseTime = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading && logs.length === 0) {
    return <AdminLoading text="Loading API logs..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={cn('text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
            API Request Logs
          </h1>
          <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
            Monitor external API calls to api-football provider
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'p-2.5 rounded-lg transition-all flex items-center gap-2',
              showFilters
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                : 'bg-white hover:bg-slate-50 text-slate-500 border border-slate-200'
            )}
          >
            <Filter size={18} />
            <span className="text-sm font-medium hidden sm:inline">Filters</span>
          </button>
          <button
            onClick={() => {
              fetchLogs();
              fetchStats();
              fetchAccountStatus();
            }}
            className={cn(
              'p-2.5 rounded-lg transition-all active:scale-95',
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700'
                : 'bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200 shadow-sm'
            )}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                'p-5 rounded-2xl animate-pulse',
                isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100'
              )}
            >
              <div className="h-20" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className={cn(
              'p-5 rounded-2xl transition-all',
              isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn('p-3 rounded-xl', isDark ? 'bg-blue-500/10' : 'bg-blue-50')}>
                <Server size={22} className="text-blue-500" />
              </div>
            </div>
            <h3 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>
              {stats.summary.totalRequests.toLocaleString()}
            </h3>
            <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Total Requests ({statsDays}d)
            </p>
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
              {stats.summary.successRate}
            </h3>
            <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-slate-500')}>Success Rate</p>
          </div>

          <div
            className={cn(
              'p-5 rounded-2xl transition-all',
              isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn('p-3 rounded-xl', isDark ? 'bg-purple-500/10' : 'bg-purple-50')}>
                <Zap size={22} className="text-purple-500" />
              </div>
            </div>
            <h3 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>
              {formatResponseTime(stats.summary.avgResponseTime)}
            </h3>
            <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-slate-500')}>Avg Response Time</p>
          </div>

          <div
            className={cn(
              'p-5 rounded-2xl transition-all',
              isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn('p-3 rounded-xl', isDark ? 'bg-red-500/10' : 'bg-red-50')}>
                <XCircle size={22} className="text-red-500" />
              </div>
            </div>
            <h3 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>
              {stats.summary.errorCount}
            </h3>
            <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-slate-500')}>Errors ({statsDays}d)</p>
          </div>
        </div>
      ) : null}

      {accountStatus && (
        <div
          className={cn(
            'p-6 rounded-2xl',
            isDark ? 'bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700' : 'bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-100 shadow-sm'
          )}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn('p-3 rounded-xl', isDark ? 'bg-emerald-500/20' : 'bg-white shadow-sm')}>
                <Gauge size={24} className="text-emerald-500" />
              </div>
              <div>
                <h3 className={cn('font-semibold text-lg', isDark ? 'text-white' : 'text-slate-900')}>
                  API-Football Quota
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                    Plan: <span className="font-medium text-emerald-500">{accountStatus.subscription.plan}</span>
                  </span>
                  <span className={cn('text-sm flex items-center gap-1', isDark ? 'text-slate-400' : 'text-slate-600')}>
                    <Calendar size={14} />
                    Ends: {new Date(accountStatus.subscription.end).toLocaleDateString()}
                  </span>
                  <span className={cn('text-sm flex items-center gap-1', isDark ? 'text-slate-400' : 'text-slate-600')}>
                    <Mail size={14} />
                    {accountStatus.account.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={cn('text-3xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                  {accountStatus.requests.current.toLocaleString()}
                </div>
                <div className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>Used Today</div>
              </div>
              <div className={cn('text-2xl font-light', isDark ? 'text-slate-600' : 'text-slate-300')}>/</div>
              <div className="text-center">
                <div className={cn('text-3xl font-bold', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
                  {accountStatus.requests.limit_day.toLocaleString()}
                </div>
                <div className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>Daily Limit</div>
              </div>
              <div className="w-32">
                <div className="flex justify-between text-xs mb-1">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    {((accountStatus.requests.current / accountStatus.requests.limit_day) * 100).toFixed(1)}%
                  </span>
                  <span className={cn('font-medium', accountStatus.provider.remainingToday < 100 ? 'text-amber-500' : 'text-emerald-500')}>
                    {accountStatus.provider.remainingToday.toLocaleString()} left
                  </span>
                </div>
                <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-slate-700' : 'bg-slate-200')}>
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      accountStatus.requests.current / accountStatus.requests.limit_day > 0.9
                        ? 'bg-red-500'
                        : accountStatus.requests.current / accountStatus.requests.limit_day > 0.7
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    )}
                    style={{ width: `${Math.min((accountStatus.requests.current / accountStatus.requests.limit_day) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {stats && stats.requestsByEndpoint.length > 0 && (
        <div
          className={cn(
            'p-6 rounded-2xl',
            isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={20} className="text-emerald-500" />
            <h3 className={cn('font-semibold', isDark ? 'text-white' : 'text-slate-900')}>Requests by Endpoint</h3>
          </div>
          <div className="space-y-3">
            {stats.requestsByEndpoint.map((item, index) => {
              const maxCount = stats.requestsByEndpoint[0]?.count || 1;
              const percentage = (item.count / maxCount) * 100;
              return (
                <div key={item.endpoint} className="flex items-center gap-4">
                  <div className={cn('w-28 text-sm font-mono truncate', isDark ? 'text-slate-300' : 'text-slate-700')}>
                    {item.endpoint}
                  </div>
                  <div className="flex-1">
                    <div className={cn('h-6 rounded-full overflow-hidden', isDark ? 'bg-slate-800' : 'bg-slate-100')}>
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${percentage}%` }}
                      >
                        {percentage > 15 && (
                          <span className="text-xs font-medium text-white">{item.count.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {percentage <= 15 && (
                    <span className={cn('text-sm font-medium w-16 text-right', isDark ? 'text-slate-400' : 'text-slate-600')}>
                      {item.count.toLocaleString()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showFilters && (
        <div
          className={cn(
            'p-4 rounded-xl flex flex-wrap gap-4',
            isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200 shadow-sm'
          )}
        >
          <div className="flex flex-col gap-1.5">
            <label className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-slate-600')}>Status</label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-emerald-500/20',
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              )}
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="timeout">Timeout</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-slate-600')}>Endpoint</label>
            <select
              value={filters.endpoint || ''}
              onChange={(e) => handleFilterChange('endpoint', e.target.value)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-emerald-500/20',
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              )}
            >
              <option value="">All Endpoints</option>
              <option value="/fixtures">/fixtures</option>
              <option value="/odds">/odds</option>
              <option value="/odds/live">/odds/live</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-slate-600')}>Start Date</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-emerald-500/20',
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-slate-600')}>End Date</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-emerald-500/20',
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-slate-600')}>Stats Period</label>
            <select
              value={statsDays}
              onChange={(e) => setStatsDays(Number(e.target.value))}
              className={cn(
                'px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-emerald-500/20',
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              )}
            >
              <option value={1}>Last 24h</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>
        </div>
      )}

      <div
        className={cn(
          'rounded-2xl overflow-hidden',
          isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  Time
                </th>
                <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  Endpoint
                </th>
                <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  Status
                </th>
                <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  Response
                </th>
                <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  Size
                </th>
                <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  Results
                </th>
                <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  Params
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {logs.map((log) => (
                <>
                  <tr
                    key={log.id}
                    className={cn(
                      'transition-colors cursor-pointer',
                      isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                    )}
                    onClick={() => setExpandedLogId((prev) => (prev === log.id ? null : log.id))}
                  >
                    <td className={cn('px-4 py-3 text-sm whitespace-nowrap', isDark ? 'text-slate-300' : 'text-slate-700')}>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        {formatDate(log.createdAt)}
                      </div>
                    </td>
                    <td className={cn('px-4 py-3', isDark ? 'text-slate-300' : 'text-slate-700')}>
                      <code className={cn('text-sm px-2 py-1 rounded font-mono', isDark ? 'bg-slate-800' : 'bg-slate-100')}>
                        {log.endpoint}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(log.status)}
                      {log.statusCode && (
                        <span className={cn('ml-2 text-xs', isDark ? 'text-slate-500' : 'text-slate-400')}>
                          ({log.statusCode})
                        </span>
                      )}
                    </td>
                    <td className={cn('px-4 py-3 text-sm whitespace-nowrap', isDark ? 'text-slate-300' : 'text-slate-700')}>
                      <span className={log.responseTime && log.responseTime > 2000 ? 'text-amber-500' : ''}>
                        {formatResponseTime(log.responseTime)}
                      </span>
                    </td>
                    <td className={cn('px-4 py-3 text-sm whitespace-nowrap', isDark ? 'text-slate-400' : 'text-slate-500')}>
                      {formatBytes(log.responseSize)}
                    </td>
                    <td className={cn('px-4 py-3 text-sm whitespace-nowrap', isDark ? 'text-slate-300' : 'text-slate-700')}>
                      {log.resultCount ?? '-'}
                    </td>
                    <td className={cn('px-4 py-3 text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                      <code className="font-mono">
                        {Object.entries(log.params || {})
                          .slice(0, 2)
                          .map(([k, v]) => `${k}=${v}`)
                          .join(', ')}
                        {Object.keys(log.params || {}).length > 2 && '...'}
                      </code>
                      {log.apiErrors && Object.keys(log.apiErrors).length > 0 && (
                        <div className={cn(
                          'mt-1 text-xs px-2 py-1 rounded border inline-flex items-center gap-1',
                          isDark ? 'bg-red-950/50 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
                        )}>
                          <XCircle size={12} />
                          {Object.keys(log.apiErrors)[0]}: {Object.values(log.apiErrors)[0]?.slice(0, 50)}...
                        </div>
                      )}
                      {log.errorMessage && !log.apiErrors && (
                        <div className="text-red-500 mt-1 truncate max-w-xs" title={log.errorMessage}>
                          {log.errorMessage}
                        </div>
                      )}
                    </td>
                  </tr>
                  {expandedLogId === log.id && (
                    <tr className={isDark ? 'bg-slate-900/30' : 'bg-slate-50/50'}>
                      <td colSpan={7} className="px-4 py-4">
                        {log.apiErrors && Object.keys(log.apiErrors).length > 0 && (
                          <div className={cn(
                            'mb-4 p-4 rounded-lg border',
                            isDark ? 'bg-red-950/30 border-red-800' : 'bg-red-50 border-red-200'
                          )}>
                            <div className={cn('text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2', 'text-red-500')}>
                              <XCircle size={14} />
                              API-Football Errors
                            </div>
                            <div className="space-y-2">
                              {Object.entries(log.apiErrors).map(([key, value]) => (
                                <div key={key} className="flex flex-col gap-1">
                                  <span className={cn('text-xs font-medium uppercase', isDark ? 'text-red-400' : 'text-red-600')}>
                                    {key}
                                  </span>
                                  <span className={cn('text-sm', isDark ? 'text-red-300' : 'text-red-700')}>
                                    {value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <div className={cn('text-xs font-semibold uppercase tracking-wider mb-2', isDark ? 'text-slate-400' : 'text-slate-500')}>
                              Request
                            </div>
                            <pre className={cn('text-xs p-3 rounded-lg overflow-auto max-h-64', isDark ? 'bg-slate-950 text-slate-200 border border-slate-800' : 'bg-white text-slate-800 border border-slate-200')}>
                              {formatJsonPreview({ method: log.method, endpoint: log.endpoint, params: log.params, headers: log.headers })}
                            </pre>
                          </div>
                          <div>
                            <div className={cn('text-xs font-semibold uppercase tracking-wider mb-2', isDark ? 'text-slate-400' : 'text-slate-500')}>
                              Response
                            </div>
                            <pre className={cn('text-xs p-3 rounded-lg overflow-auto max-h-64', isDark ? 'bg-slate-950 text-slate-200 border border-slate-800' : 'bg-white text-slate-800 border border-slate-200')}>
                              {formatJsonPreview(log.responseBody)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className={cn('text-sm', isDark ? 'text-slate-500' : 'text-slate-400')}>
                      No logs found. API requests will appear here.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div
            className={cn(
              'px-4 py-3 flex items-center justify-between border-t',
              isDark ? 'border-slate-800' : 'border-slate-100'
            )}
          >
            <div className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={cn(
                  'p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                  isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
                )}
              >
                <ChevronLeft size={18} />
              </button>
              <span className={cn('text-sm font-medium px-3', isDark ? 'text-slate-300' : 'text-slate-700')}>
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={cn(
                  'p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                  isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
                )}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
