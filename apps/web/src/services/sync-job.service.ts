import api from './api';

export type SyncJobType = 'league' | 'team' | 'fixture' | 'odds_upcoming' | 'odds_far' | 'odds_live' | 'standings' | 'full_sync';
export type SyncJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type SyncJobPriority = 'low' | 'normal' | 'high' | 'critical';

export interface SyncJob {
  id: string;
  type: SyncJobType;
  status: SyncJobStatus;
  priority: SyncJobPriority;
  params: Record<string, unknown>;
  progress: number;
  totalItems: number | null;
  processedItems: number;
  result: Record<string, unknown> | null;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  triggeredBy: string | null;
  bullJobId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SyncJobStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  avgDurationMs: number;
  successRate: number;
  recentErrors: Array<{
    id: string;
    type: SyncJobType;
    errorMessage: string;
    createdAt: string;
  }>;
}

export interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface CreateJobResponse {
  jobId: string;
}

export interface SyncJobFilter {
  type?: SyncJobType;
  status?: SyncJobStatus;
  priority?: SyncJobPriority;
  triggeredBy?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const syncJobService = {
  async getJobs(filter?: SyncJobFilter): Promise<PaginatedResponse<SyncJob>> {
    const response = await api.get<PaginatedResponse<SyncJob>>('/sync-jobs', { params: filter });
    return response.data;
  },

  async getJob(id: string): Promise<SyncJob> {
    const response = await api.get<SyncJob>(`/sync-jobs/${id}`);
    return response.data;
  },

  async getStats(): Promise<SyncJobStats> {
    const response = await api.get<SyncJobStats>('/sync-jobs/stats');
    return response.data;
  },

  async getQueueStatus(): Promise<QueueStatus> {
    const response = await api.get<QueueStatus>('/sync-jobs/queue-status');
    return response.data;
  },

  async triggerLeagueSync(): Promise<CreateJobResponse> {
    const response = await api.post<CreateJobResponse>('/sync-jobs/league');
    return response.data;
  },

  async triggerTeamSync(leagueExternalId?: string): Promise<CreateJobResponse> {
    const url = leagueExternalId ? `/sync-jobs/team/${leagueExternalId}` : '/sync-jobs/team';
    const response = await api.post<CreateJobResponse>(url);
    return response.data;
  },

  async triggerFixtureSync(params?: { dateFrom?: string; dateTo?: string; leagueExternalId?: string }): Promise<CreateJobResponse> {
    const response = await api.post<CreateJobResponse>('/sync-jobs/fixture', undefined, { params });
    return response.data;
  },

  async triggerUpcomingOddsSync(hoursAhead?: number): Promise<CreateJobResponse> {
    const response = await api.post<CreateJobResponse>('/sync-jobs/odds/upcoming', undefined, { params: hoursAhead ? { hoursAhead } : undefined });
    return response.data;
  },

  async triggerFarOddsSync(maxDaysAhead?: number): Promise<CreateJobResponse> {
    const response = await api.post<CreateJobResponse>('/sync-jobs/odds/far', undefined, { params: maxDaysAhead ? { maxDaysAhead } : undefined });
    return response.data;
  },

  async triggerLiveOddsSync(): Promise<CreateJobResponse> {
    const response = await api.post<CreateJobResponse>('/sync-jobs/odds/live');
    return response.data;
  },

  async triggerStandingsSync(externalLeagueId?: string): Promise<CreateJobResponse> {
    const url = externalLeagueId ? `/sync-jobs/standings/${externalLeagueId}` : '/sync-jobs/standings';
    const response = await api.post<CreateJobResponse>(url);
    return response.data;
  },

  async triggerFullSync(params?: { syncLeagues?: boolean; syncTeams?: boolean; syncFixtures?: boolean; syncOdds?: boolean }): Promise<CreateJobResponse> {
    const response = await api.post<CreateJobResponse>('/sync-jobs/full', params);
    return response.data;
  },

  async cancelJob(id: string): Promise<void> {
    await api.delete(`/sync-jobs/${id}`);
  },

  async retryJob(id: string): Promise<CreateJobResponse> {
    const response = await api.post<CreateJobResponse>(`/sync-jobs/${id}/retry`);
    return response.data;
  },

  async cleanupOldJobs(olderThanDays?: number): Promise<{ deleted: number }> {
    const response = await api.delete<{ deleted: number }>('/sync-jobs/cleanup/old', { params: { olderThanDays } });
    return response.data;
  },

  async forceReleaseJob(id: string): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>(`/sync-jobs/${id}/force-release`);
    return response.data;
  },

  async forceReleaseByType(type: SyncJobType): Promise<{ released: number }> {
    const response = await api.post<{ released: number }>(`/sync-jobs/force-release/type/${type}`);
    return response.data;
  },
};

export default syncJobService;
