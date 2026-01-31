import api from './api';

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

export interface AdminUser {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  status: string;
  role?: {
    id: string;
    code: string;
    name: string;
  };
  wallet?: {
    realBalance: number;
    bonusBalance: number;
  };
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalRevenue: number;
  totalBets: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  activeMatches: number;
  todayBets: number;
  todayRevenue: number;
}

export interface DepositRequest {
  id: string;
  userId: string;
  user?: AdminUser;
  amount: number;
  paymentMethod: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  transferContent?: string;
  proofImageUrl?: string;
  status: string;
  processedBy?: string;
  processedAt?: string;
  rejectReason?: string;
  notes?: string;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  user?: AdminUser;
  amount: number;
  fee: number;
  netAmount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: string;
  processedBy?: string;
  processedAt?: string;
  rejectReason?: string;
  transactionRef?: string;
  notes?: string;
  createdAt: string;
}

export interface Agent {
  id: string;
  userId: string;
  user?: AdminUser;
  parentId?: string;
  parent?: Agent;
  level: number;
  agentCode: string;
  commissionRate: number;
  status: string;
  createdAt: string;
  downlineCount?: number;
  totalCommission?: number;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  balanceType: string;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  status: string;
  createdAt: string;
}

export interface WalletDetails {
  id: string;
  userId: string;
  realBalance: number;
  bonusBalance: number;
  pendingBalance: number;
  currency: string;
  user?: {
    id: string;
    username: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiRequestLog {
  id: string;
  providerId: string;
  provider?: {
    code: string;
    name: string;
  };
  endpoint: string;
  method: string;
  params: Record<string, string>;
  headers: Record<string, string>;
  status: 'success' | 'error' | 'timeout';
  statusCode?: number;
  responseTime?: number;
  responseSize?: number;
  resultCount?: number;
  responseBody?: unknown;
  errorMessage?: string;
  errorCode?: string;
  apiErrors?: Record<string, string>;
  fixtureIds: string[];
  leagueIds: number[];
  createdAt: string;
}

export interface ApiLogsResponse {
  data: ApiRequestLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiLogsStats {
  period: {
    days: number;
    startDate: string;
  };
  summary: {
    totalRequests: number;
    successCount: number;
    errorCount: number;
    successRate: string;
    avgResponseTime: number;
  };
  requestsByEndpoint: Array<{
    endpoint: string;
    count: number;
  }>;
  requestsByDay: Array<{
    date: string;
    count: number;
  }>;
}

export interface ApiLogsQueryParams {
  endpoint?: string;
  status?: 'all' | 'success' | 'error' | 'timeout';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ApiFootballAccountStatus {
  account: {
    firstname: string;
    lastname: string;
    email: string;
  };
  subscription: {
    plan: string;
    end: string;
    active: boolean;
  };
  requests: {
    current: number;
    limit_day: number;
  };
  provider: {
    dailyUsage: number;
    dailyLimit: number;
    remainingToday: number;
  };
}

export interface ApiFootballSyncConfig {
  fixture: {
    intervalMinutes: number;
    pastDays: number;
    futureDays: number;
    enabled: boolean;
  };
  liveOdds: {
    intervalMinutes: number;
    maxMatchesPerSync: number;
    enabled: boolean;
  };
  upcomingOdds: {
    intervalMinutes: number;
    hoursAhead: number;
    maxMatchesPerSync: number;
    enabled: boolean;
  };
  league: {
    intervalMinutes: number;
    enabled: boolean;
  };
  team: {
    intervalMinutes: number;
    enabled: boolean;
  };
  rateLimit: {
    requestsPerMinute: number;
    dailyLimit: number;
    delayBetweenRequests: number;
  };
}

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const response = await api.get<AdminStats>('/admin/stats');
    return response.data;
  },

  async getUsers(params?: PaginationParams): Promise<PaginatedResponse<AdminUser>> {
    const response = await api.get<PaginatedResponse<AdminUser>>('/admin/users', { params });
    return response.data;
  },

  async getUser(id: string): Promise<AdminUser> {
    const response = await api.get<AdminUser>(`/admin/users/${id}`);
    return response.data;
  },

  async updateUser(id: string, data: Partial<AdminUser> & { bettingLimits?: any }): Promise<AdminUser> {
    const response = await api.put<AdminUser>(`/admin/users/${id}`, data);
    return response.data;
  },

  async updateUserStatus(id: string, status: string): Promise<AdminUser> {
    const response = await api.patch<AdminUser>(`/admin/users/${id}/status`, { status });
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  },

  async getDeposits(params?: PaginationParams): Promise<PaginatedResponse<DepositRequest>> {
    const response = await api.get<PaginatedResponse<DepositRequest>>('/admin/deposits', { params });
    return response.data;
  },

  async approveDeposit(id: string, notes?: string): Promise<DepositRequest> {
    const response = await api.post<DepositRequest>(`/admin/deposits/${id}/approve`, { notes });
    return response.data;
  },

  async rejectDeposit(id: string, reason: string): Promise<DepositRequest> {
    const response = await api.post<DepositRequest>(`/admin/deposits/${id}/reject`, { reason });
    return response.data;
  },

  async getWithdrawals(params?: PaginationParams): Promise<PaginatedResponse<WithdrawalRequest>> {
    const response = await api.get<PaginatedResponse<WithdrawalRequest>>('/admin/withdrawals', { params });
    return response.data;
  },

  async approveWithdrawal(id: string, transactionRef?: string, notes?: string): Promise<WithdrawalRequest> {
    const response = await api.post<WithdrawalRequest>(`/admin/withdrawals/${id}/approve`, { transactionRef, notes });
    return response.data;
  },

  async rejectWithdrawal(id: string, reason: string): Promise<WithdrawalRequest> {
    const response = await api.post<WithdrawalRequest>(`/admin/withdrawals/${id}/reject`, { reason });
    return response.data;
  },

  async getAgents(params?: PaginationParams): Promise<PaginatedResponse<Agent>> {
    const response = await api.get<PaginatedResponse<Agent>>('/agents', { params });
    return response.data;
  },

  async getAgent(id: string): Promise<Agent> {
    const response = await api.get<Agent>(`/agents/${id}`);
    return response.data;
  },

  async createAgent(data: { userId: string; parentId?: string; commissionRate: number }): Promise<Agent> {
    const response = await api.post<Agent>('/agents', data);
    return response.data;
  },

  async updateAgent(id: string, data: Partial<Agent>): Promise<Agent> {
    const response = await api.put<Agent>(`/agents/${id}`, data);
    return response.data;
  },

  async getTransactions(params?: PaginationParams & { userId?: string; type?: string }): Promise<PaginatedResponse<Transaction>> {
    const response = await api.get<PaginatedResponse<Transaction>>('/admin/transactions', { params });
    return response.data;
  },

  async adjustBalance(userId: string, amount: number, type: 'add' | 'subtract', balanceType: 'real' | 'bonus', reason: string): Promise<void> {
    await api.post(`/admin/users/${userId}/adjust-balance`, { amount, type, balanceType, reason });
  },

  // Wallet APIs
  async getUserWallet(userId: string): Promise<WalletDetails> {
    const response = await api.get<WalletDetails>(`/wallet/users/${userId}`);
    return response.data;
  },

  async getUserWalletHistory(userId: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<Transaction>> {
    const response = await api.get<PaginatedResponse<Transaction>>(`/wallet/users/${userId}/history`, {
      params: { page, limit },
    });
    return response.data;
  },

  async adjustUserWalletBalance(
    userId: string,
    amount: number,
    adjustmentType: 'add' | 'subtract',
    balanceType: 'real' | 'bonus',
    description: string
  ): Promise<WalletDetails> {
    const response = await api.post<WalletDetails>(`/wallet/users/${userId}/adjust`, {
      amount,
      adjustmentType,
      balanceType,
      description,
    });
    return response.data;
  },

  async getApiLogs(params?: ApiLogsQueryParams): Promise<ApiLogsResponse> {
    const response = await api.get<ApiLogsResponse>('/api-football/logs', { params });
    return response.data;
  },

  async getApiLogsStats(days: number = 7): Promise<ApiLogsStats> {
    const response = await api.get<ApiLogsStats>('/api-football/logs/stats', { params: { days } });
    return response.data;
  },

  async getApiFootballStatus(): Promise<ApiFootballAccountStatus | null> {
    const response = await api.get<ApiFootballAccountStatus>('/api-football/status');
    return response.data;
  },

  async getSyncConfig(): Promise<ApiFootballSyncConfig> {
    const response = await api.get<ApiFootballSyncConfig>('/api-football/sync/config');
    return response.data;
  },

  async updateSyncConfig(config: Partial<ApiFootballSyncConfig>): Promise<ApiFootballSyncConfig> {
    const response = await api.post<ApiFootballSyncConfig>('/api-football/sync/config', config);
    return response.data;
  },

  async reloadSchedulers(): Promise<{message: string}> {
    const response = await api.post<{message: string}>('/api-football/sync/reload-schedulers');
    return response.data;
  },
};

export default adminService;
