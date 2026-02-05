'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  AlertTriangle,
  Activity,
  Zap,
  Database,
  Trophy,
  Users,
  TrendingUp,
  BarChart3,
  Loader2,
  RotateCcw,
  Trash2,
  Timer,
  Server,
  X,
  Eye,
  FileText,
  Hash,
  Calendar,
  ArrowRight,
  Unlock,
  ListOrdered,
} from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { AdminLoading } from '@/components/admin/AdminLoading';
import { syncJobService, SyncJob, SyncJobStats, QueueStatus, SyncJobType, SyncJobStatus } from '@/services/sync-job.service';
import { cn } from '@/lib/utils';

const JOB_TYPE_CONFIG: Record<SyncJobType, { label: string; icon: React.ElementType; color: string }> = {
  league: { label: 'Leagues', icon: Trophy, color: 'text-purple-500' },
  team: { label: 'Teams', icon: Users, color: 'text-blue-500' },
  fixture: { label: 'Fixtures', icon: Activity, color: 'text-emerald-500' },
  odds_upcoming: { label: 'Upcoming Odds', icon: TrendingUp, color: 'text-amber-500' },
  odds_live: { label: 'Live Odds', icon: Zap, color: 'text-red-500' },
  standings: { label: 'Standings', icon: ListOrdered, color: 'text-cyan-500' },
  full_sync: { label: 'Full Sync', icon: Database, color: 'text-indigo-500' },
};

const STATUS_CONFIG: Record<SyncJobStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-slate-500', bgColor: 'bg-slate-100 dark:bg-slate-800' },
  processing: { label: 'Processing', color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-500/20' },
  completed: { label: 'Completed', color: 'text-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-500/20' },
  failed: { label: 'Failed', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-500/20' },
  cancelled: { label: 'Cancelled', color: 'text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-800' },
};

function JobDetailModal({ job, onClose, isDark }: { job: SyncJob; onClose: () => void; isDark: boolean }) {
  const typeConfig = JOB_TYPE_CONFIG[job.type];
  const statusConfig = STATUS_CONFIG[job.status];
  const TypeIcon = typeConfig?.icon || Activity;

  const duration = job.startedAt && job.completedAt
    ? new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
    : null;

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const renderResult = (result: Record<string, unknown> | null) => {
    if (!result) return null;
    return (
      <div className="space-y-2">
        {Object.entries(result).map(([key, value]) => {
          if (key === 'errors' && Array.isArray(value) && value.length === 0) return null;
          if (typeof value === 'object' && value !== null) {
            return (
              <div key={key}>
                <div className={cn('text-xs font-medium uppercase mb-1', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  {key.replace(/_/g, ' ')}
                </div>
                <pre className={cn(
                  'text-xs p-3 rounded-lg overflow-x-auto',
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                )}>
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            );
          }
          return (
            <div key={key} className="flex items-center justify-between py-1">
              <span className={cn('text-sm capitalize', isDark ? 'text-slate-400' : 'text-slate-500')}>
                {key.replace(/_/g, ' ')}
              </span>
              <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-slate-900')}>
                {String(value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className={cn(
        'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl',
        isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
      )}>
        <div className={cn(
          'sticky top-0 flex items-center justify-between px-6 py-4 border-b z-10',
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl', isDark ? 'bg-slate-800' : 'bg-slate-100')}>
              <TypeIcon size={20} className={typeConfig?.color || 'text-slate-500'} />
            </div>
            <div>
              <h2 className={cn('font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                {typeConfig?.label || job.type} Job
              </h2>
              <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                {job.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            )}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className={cn('p-4 rounded-xl', isDark ? 'bg-slate-800' : 'bg-slate-50')}>
              <div className={cn('text-xs font-medium uppercase mb-2', isDark ? 'text-slate-400' : 'text-slate-500')}>
                Status
              </div>
              <div className={cn('flex items-center gap-2', statusConfig?.color)}>
                {job.status === 'completed' && <CheckCircle2 size={18} />}
                {job.status === 'failed' && <XCircle size={18} />}
                {job.status === 'processing' && <Loader2 size={18} className="animate-spin" />}
                {job.status === 'pending' && <Clock size={18} />}
                {job.status === 'cancelled' && <Pause size={18} />}
                <span className="font-semibold capitalize">{job.status}</span>
              </div>
            </div>

            <div className={cn('p-4 rounded-xl', isDark ? 'bg-slate-800' : 'bg-slate-50')}>
              <div className={cn('text-xs font-medium uppercase mb-2', isDark ? 'text-slate-400' : 'text-slate-500')}>
                Priority
              </div>
              <div className={cn('font-semibold capitalize', isDark ? 'text-white' : 'text-slate-900')}>
                {job.priority}
              </div>
            </div>

            <div className={cn('p-4 rounded-xl', isDark ? 'bg-slate-800' : 'bg-slate-50')}>
              <div className={cn('text-xs font-medium uppercase mb-2', isDark ? 'text-slate-400' : 'text-slate-500')}>
                Progress
              </div>
              <div className="flex items-center gap-2">
                <div className={cn('flex-1 h-2 rounded-full', isDark ? 'bg-slate-700' : 'bg-slate-200')}>
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      job.status === 'completed' ? 'bg-emerald-500' :
                      job.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                    )}
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
                <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-slate-900')}>
                  {job.progress}%
                </span>
              </div>
            </div>

            <div className={cn('p-4 rounded-xl', isDark ? 'bg-slate-800' : 'bg-slate-50')}>
              <div className={cn('text-xs font-medium uppercase mb-2', isDark ? 'text-slate-400' : 'text-slate-500')}>
                Duration
              </div>
              <div className={cn('font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                {duration ? formatDuration(duration) : '-'}
              </div>
            </div>
          </div>

          <div className={cn('p-4 rounded-xl', isDark ? 'bg-slate-800' : 'bg-slate-50')}>
            <div className={cn('text-xs font-medium uppercase mb-3', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Timeline
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', isDark ? 'bg-slate-700' : 'bg-slate-200')}>
                  <Calendar size={14} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                </div>
                <div className="flex-1">
                  <div className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>Created</div>
                  <div className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-slate-900')}>
                    {formatDateTime(job.createdAt)}
                  </div>
                </div>
              </div>
              {job.startedAt && (
                <div className="flex items-center gap-3">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', isDark ? 'bg-blue-500/20' : 'bg-blue-100')}>
                    <ArrowRight size={14} className="text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>Started</div>
                    <div className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-slate-900')}>
                      {formatDateTime(job.startedAt)}
                    </div>
                  </div>
                </div>
              )}
              {job.completedAt && (
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    job.status === 'completed' ? (isDark ? 'bg-emerald-500/20' : 'bg-emerald-100') :
                    job.status === 'failed' ? (isDark ? 'bg-red-500/20' : 'bg-red-100') :
                    (isDark ? 'bg-slate-700' : 'bg-slate-200')
                  )}>
                    {job.status === 'completed' ? <CheckCircle2 size={14} className="text-emerald-500" /> :
                     job.status === 'failed' ? <XCircle size={14} className="text-red-500" /> :
                     <Clock size={14} className={isDark ? 'text-slate-400' : 'text-slate-500'} />}
                  </div>
                  <div className="flex-1">
                    <div className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>Completed</div>
                    <div className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-slate-900')}>
                      {formatDateTime(job.completedAt)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={cn('p-4 rounded-xl', isDark ? 'bg-slate-800' : 'bg-slate-50')}>
              <div className={cn('text-xs font-medium uppercase mb-2', isDark ? 'text-slate-400' : 'text-slate-500')}>
                Triggered By
              </div>
              <div className={cn('font-medium capitalize', isDark ? 'text-white' : 'text-slate-900')}>
                {job.triggeredBy || 'Unknown'}
              </div>
            </div>

            <div className={cn('p-4 rounded-xl', isDark ? 'bg-slate-800' : 'bg-slate-50')}>
              <div className={cn('text-xs font-medium uppercase mb-2', isDark ? 'text-slate-400' : 'text-slate-500')}>
                Retry Count
              </div>
              <div className={cn('font-medium', isDark ? 'text-white' : 'text-slate-900')}>
                {job.retryCount} / {job.maxRetries}
              </div>
            </div>
          </div>

          {Object.keys(job.params).length > 0 && (
            <div className={cn('p-4 rounded-xl', isDark ? 'bg-slate-800' : 'bg-slate-50')}>
              <div className={cn('text-xs font-medium uppercase mb-3', isDark ? 'text-slate-400' : 'text-slate-500')}>
                Parameters
              </div>
              <pre className={cn(
                'text-xs p-3 rounded-lg overflow-x-auto',
                isDark ? 'bg-slate-900 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'
              )}>
                {JSON.stringify(job.params, null, 2)}
              </pre>
            </div>
          )}

          {job.result && (
            <div className={cn('p-4 rounded-xl', isDark ? 'bg-slate-800' : 'bg-slate-50')}>
              <div className={cn('text-xs font-medium uppercase mb-3', isDark ? 'text-slate-400' : 'text-slate-500')}>
                Result
              </div>
              {renderResult(job.result)}
            </div>
          )}

          {job.errorMessage && (
            <div className={cn('p-4 rounded-xl', isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200')}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-red-500" />
                <span className={cn('text-sm font-medium', isDark ? 'text-red-400' : 'text-red-600')}>
                  Error Message
                </span>
              </div>
              <p className={cn('text-sm', isDark ? 'text-red-300' : 'text-red-700')}>
                {job.errorMessage}
              </p>
            </div>
          )}

          {job.bullJobId && (
            <div className={cn('p-4 rounded-xl', isDark ? 'bg-slate-800' : 'bg-slate-50')}>
              <div className={cn('text-xs font-medium uppercase mb-2', isDark ? 'text-slate-400' : 'text-slate-500')}>
                Bull Job ID
              </div>
              <code className={cn('text-xs', isDark ? 'text-slate-300' : 'text-slate-700')}>
                {job.bullJobId}
              </code>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function SyncDashboardPage() {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';

  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [stats, setStats] = useState<SyncJobStats | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<SyncJobType | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedJob, setSelectedJob] = useState<SyncJob | null>(null);
  const hasFetchedInitially = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const [jobsData, statsData, queueData] = await Promise.all([
        syncJobService.getJobs({ limit: 20 }),
        syncJobService.getStats(),
        syncJobService.getQueueStatus(),
      ]);
      setJobs(jobsData);
      setStats(statsData);
      setQueueStatus(queueData);
    } catch (error) {
      console.error('Failed to fetch sync data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetchedInitially.current) return;
    hasFetchedInitially.current = true;
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const handleTriggerJob = async (type: SyncJobType) => {
    setTriggering(type);
    try {
      switch (type) {
        case 'league':
          await syncJobService.triggerLeagueSync();
          break;
        case 'team':
          await syncJobService.triggerTeamSync();
          break;
        case 'fixture':
          await syncJobService.triggerFixtureSync();
          break;
        case 'odds_upcoming':
          await syncJobService.triggerUpcomingOddsSync();
          break;
        case 'odds_live':
          await syncJobService.triggerLiveOddsSync();
          break;
        case 'standings':
          await syncJobService.triggerStandingsSync();
          break;
        case 'full_sync':
          await syncJobService.triggerFullSync();
          break;
      }
      await fetchData();
    } catch (error) {
      console.error('Failed to trigger job:', error);
    } finally {
      setTriggering(null);
    }
  };

  const handleRetryJob = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await syncJobService.retryJob(id);
      await fetchData();
    } catch (error) {
      console.error('Failed to retry job:', error);
    }
  };

  const handleCancelJob = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await syncJobService.cancelJob(id);
      await fetchData();
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  };

  const handleForceReleaseJob = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await syncJobService.forceReleaseJob(id);
      await fetchData();
    } catch (error) {
      console.error('Failed to force release job:', error);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: SyncJobStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      case 'processing':
        return <Loader2 size={16} className="text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock size={16} className="text-slate-400" />;
      case 'cancelled':
        return <Pause size={16} className="text-slate-400" />;
    }
  };

  if (loading) {
    return <AdminLoading text="Loading sync dashboard..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {selectedJob && (
        <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} isDark={isDark} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={cn('text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
            Sync Dashboard
          </h1>
          <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
            Manage and monitor data synchronization jobs
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
              Auto-refresh (5s)
            </span>
          </label>
          <button
            onClick={fetchData}
            className={cn(
              'px-4 py-2.5 rounded-lg transition-all active:scale-95 flex items-center gap-2 font-medium',
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
            )}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {queueStatus && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Waiting', value: queueStatus.waiting, color: 'text-slate-500' },
            { label: 'Active', value: queueStatus.active, color: 'text-blue-500' },
            { label: 'Completed', value: queueStatus.completed, color: 'text-emerald-500' },
            { label: 'Failed', value: queueStatus.failed, color: 'text-red-500' },
            { label: 'Delayed', value: queueStatus.delayed, color: 'text-amber-500' },
          ].map((item) => (
            <div
              key={item.label}
              className={cn(
                'p-4 rounded-xl',
                isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'
              )}
            >
              <div className={cn('text-2xl font-bold', item.color)}>{item.value}</div>
              <div className={cn('text-xs font-medium mt-1', isDark ? 'text-slate-400' : 'text-slate-500')}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={cn(
        'p-6 rounded-2xl',
        isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'
      )}>
        <div className="flex items-center gap-2 mb-4">
          <Zap size={20} className="text-emerald-500" />
          <h3 className={cn('font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
            Quick Actions
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.keys(JOB_TYPE_CONFIG) as SyncJobType[]).map((type) => {
            const config = JOB_TYPE_CONFIG[type];
            const Icon = config.icon;
            const isTriggering = triggering === type;
            return (
              <button
                key={type}
                onClick={() => handleTriggerJob(type)}
                disabled={triggering !== null}
                className={cn(
                  'p-4 rounded-xl text-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50',
                  isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'
                )}
              >
                {isTriggering ? (
                  <Loader2 size={24} className="mx-auto mb-2 animate-spin text-emerald-500" />
                ) : (
                  <Icon size={24} className={cn('mx-auto mb-2', config.color)} />
                )}
                <div className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-slate-700')}>
                  {config.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={cn(
            'p-5 rounded-2xl',
            isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'
          )}>
            <div className="flex items-start justify-between mb-3">
              <div className={cn('p-3 rounded-xl', isDark ? 'bg-emerald-500/10' : 'bg-emerald-50')}>
                <BarChart3 size={22} className="text-emerald-500" />
              </div>
              <div className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                stats.successRate >= 90 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                stats.successRate >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
              )}>
                {stats.successRate.toFixed(1)}%
              </div>
            </div>
            <h3 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>
              {stats.total}
            </h3>
            <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Total Jobs
            </p>
          </div>

          <div className={cn(
            'p-5 rounded-2xl',
            isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'
          )}>
            <div className="flex items-start justify-between mb-3">
              <div className={cn('p-3 rounded-xl', isDark ? 'bg-blue-500/10' : 'bg-blue-50')}>
                <Timer size={22} className="text-blue-500" />
              </div>
            </div>
            <h3 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>
              {formatDuration(stats.avgDurationMs)}
            </h3>
            <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Avg Duration
            </p>
          </div>

          <div className={cn(
            'p-5 rounded-2xl',
            isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'
          )}>
            <div className="flex items-start justify-between mb-3">
              <div className={cn('p-3 rounded-xl', isDark ? 'bg-purple-500/10' : 'bg-purple-50')}>
                <Server size={22} className="text-purple-500" />
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="text-center">
                  <div className={cn('text-lg font-bold', STATUS_CONFIG[status as SyncJobStatus]?.color || 'text-slate-500')}>
                    {count}
                  </div>
                  <div className={cn('text-xs capitalize', isDark ? 'text-slate-500' : 'text-slate-400')}>
                    {status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={cn(
        'rounded-2xl overflow-hidden',
        isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className={cn('font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
            Recent Jobs
          </h3>
          <span className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
            Click on a job to view details
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={cn(
                'text-xs uppercase tracking-wider',
                isDark ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50 text-slate-500'
              )}>
                <th className="px-6 py-3 text-left font-medium">Type</th>
                <th className="px-6 py-3 text-left font-medium">Status</th>
                <th className="px-6 py-3 text-left font-medium">Progress</th>
                <th className="px-6 py-3 text-left font-medium">Duration</th>
                <th className="px-6 py-3 text-left font-medium">Started</th>
                <th className="px-6 py-3 text-left font-medium">Triggered By</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className={cn('px-6 py-12 text-center', isDark ? 'text-slate-400' : 'text-slate-500')}>
                    No sync jobs found
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const typeConfig = JOB_TYPE_CONFIG[job.type];
                  const statusConfig = STATUS_CONFIG[job.status];
                  const TypeIcon = typeConfig?.icon || Activity;
                  const duration = job.startedAt && job.completedAt
                    ? new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
                    : null;

                  return (
                    <tr
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={cn(
                        'transition-colors cursor-pointer',
                        isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <TypeIcon size={16} className={typeConfig?.color || 'text-slate-500'} />
                          <span className={cn('font-medium', isDark ? 'text-white' : 'text-slate-900')}>
                            {typeConfig?.label || job.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <span className={cn('text-sm font-medium', statusConfig?.color)}>
                            {statusConfig?.label || job.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {job.status === 'processing' ? (
                          <div className="flex items-center gap-2">
                            <div className={cn('w-20 h-2 rounded-full', isDark ? 'bg-slate-700' : 'bg-slate-200')}>
                              <div
                                className="h-full rounded-full bg-blue-500 transition-all"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                            <span className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                              {job.progress}%
                            </span>
                          </div>
                        ) : job.status === 'completed' ? (
                          <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                            {job.processedItems || '-'}
                          </span>
                        ) : (
                          <span className={cn('text-sm', isDark ? 'text-slate-500' : 'text-slate-400')}>-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                          {duration ? formatDuration(duration) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                          {job.startedAt ? formatDate(job.startedAt) : formatDate(job.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium capitalize',
                          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                        )}>
                          {job.triggeredBy || 'unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-blue-400' : 'hover:bg-slate-100 text-slate-500 hover:text-blue-600'
                            )}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          {job.status === 'failed' && (
                            <button
                              onClick={(e) => handleRetryJob(job.id, e)}
                              className={cn(
                                'p-1.5 rounded-lg transition-colors',
                                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-emerald-400' : 'hover:bg-slate-100 text-slate-500 hover:text-emerald-600'
                              )}
                              title="Retry"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}
                          {job.status === 'pending' && (
                            <button
                              onClick={(e) => handleCancelJob(job.id, e)}
                              className={cn(
                                'p-1.5 rounded-lg transition-colors',
                                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-red-400' : 'hover:bg-slate-100 text-slate-500 hover:text-red-600'
                              )}
                              title="Cancel"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          {(job.status === 'pending' || job.status === 'processing') && (
                            <button
                              onClick={(e) => handleForceReleaseJob(job.id, e)}
                              className={cn(
                                'p-1.5 rounded-lg transition-colors',
                                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-amber-400' : 'hover:bg-slate-100 text-slate-500 hover:text-amber-600'
                              )}
                              title="Force Release"
                            >
                              <Unlock size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {stats && stats.recentErrors.length > 0 && (
        <div className={cn(
          'p-6 rounded-2xl',
          isDark ? 'bg-slate-900 border border-red-500/20' : 'bg-white border border-red-200 shadow-sm'
        )}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-red-500" />
            <h3 className={cn('font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
              Recent Errors
            </h3>
          </div>
          <div className="space-y-3">
            {stats.recentErrors.map((error) => (
              <div
                key={error.id}
                className={cn(
                  'p-4 rounded-xl',
                  isDark ? 'bg-red-500/10' : 'bg-red-50'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('text-sm font-medium', isDark ? 'text-red-400' : 'text-red-600')}>
                    {JOB_TYPE_CONFIG[error.type]?.label || error.type}
                  </span>
                  <span className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-400')}>
                    {formatDate(error.createdAt)}
                  </span>
                </div>
                <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-700')}>
                  {error.errorMessage}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
