export enum DataProviderStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
}

export enum DataProviderType {
  ODDS = 'odds',
  FIXTURES = 'fixtures',
  LIVE_SCORES = 'live_scores',
  STATISTICS = 'statistics',
  LEAGUES = 'leagues',
  TEAMS = 'teams',
}

export interface DataProvider {
  id: string;
  code: string;
  name: string;
  description?: string;
  types: DataProviderType[];
  baseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  headers?: Record<string, string>;
  config?: Record<string, unknown>;
  status: DataProviderStatus;
  priority: number;
  healthScore: number;
  dailyLimit?: number;
  dailyUsage: number;
  monthlyLimit?: number;
  monthlyUsage: number;
  lastSyncAt?: string;
  lastErrorAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDataProviderPayload {
  code: string;
  name: string;
  description?: string;
  types: DataProviderType[];
  baseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  headers?: Record<string, string>;
  config?: Record<string, unknown>;
  status?: DataProviderStatus;
  priority?: number;
  dailyLimit?: number;
  monthlyLimit?: number;
}

export interface UpdateDataProviderPayload {
  name?: string;
  description?: string;
  types?: DataProviderType[];
  baseUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  headers?: Record<string, string>;
  config?: Record<string, unknown>;
  status?: DataProviderStatus;
  priority?: number;
  dailyLimit?: number;
  monthlyLimit?: number;
}

export interface DataProviderQuery {
  status?: DataProviderStatus;
  type?: DataProviderType;
}

export const PROVIDER_STATUS_LABELS: Record<DataProviderStatus, string> = {
  [DataProviderStatus.ACTIVE]: 'Active',
  [DataProviderStatus.INACTIVE]: 'Inactive',
  [DataProviderStatus.ERROR]: 'Error',
  [DataProviderStatus.MAINTENANCE]: 'Maintenance',
};

export const PROVIDER_STATUS_COLORS: Record<DataProviderStatus, string> = {
  [DataProviderStatus.ACTIVE]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  [DataProviderStatus.INACTIVE]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
  [DataProviderStatus.ERROR]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  [DataProviderStatus.MAINTENANCE]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export const PROVIDER_TYPE_LABELS: Record<DataProviderType, string> = {
  [DataProviderType.ODDS]: 'Odds',
  [DataProviderType.FIXTURES]: 'Fixtures',
  [DataProviderType.LIVE_SCORES]: 'Live Scores',
  [DataProviderType.STATISTICS]: 'Statistics',
  [DataProviderType.LEAGUES]: 'Leagues',
  [DataProviderType.TEAMS]: 'Teams',
};
