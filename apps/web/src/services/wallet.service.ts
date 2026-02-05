import api from './api';

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  BET_PLACED = 'bet_placed',
  BET_WON = 'bet_won',
  BET_REFUND = 'bet_refund',
  BONUS = 'bonus',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType | string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  balanceType: 'real' | 'bonus';
  referenceType?: string;
  referenceId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  status: TransactionStatus | string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletBalance {
  realBalance: number;
  bonusBalance: number;
  pendingBalance: number;
  totalAvailable: number;
  currency: string;
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

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TransactionQuery {
  page?: number;
  limit?: number;
  type?: TransactionType | string;
}

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  [TransactionType.DEPOSIT]: 'Deposit',
  [TransactionType.WITHDRAWAL]: 'Withdrawal',
  [TransactionType.BET_PLACED]: 'Bet Placed',
  [TransactionType.BET_WON]: 'Bet Won',
  [TransactionType.BET_REFUND]: 'Bet Refund',
  [TransactionType.BONUS]: 'Bonus',
  [TransactionType.TRANSFER]: 'Transfer',
  [TransactionType.ADJUSTMENT]: 'Adjustment',
};

export const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  [TransactionStatus.PENDING]: 'Pending',
  [TransactionStatus.COMPLETED]: 'Completed',
  [TransactionStatus.FAILED]: 'Failed',
  [TransactionStatus.CANCELLED]: 'Cancelled',
};

export const isPositiveTransaction = (type: string): boolean => {
  return [
    TransactionType.DEPOSIT,
    TransactionType.BET_WON,
    TransactionType.BET_REFUND,
    TransactionType.BONUS,
  ].includes(type as TransactionType);
};

export const walletService = {
  getMyWallet: async (): Promise<WalletDetails> => {
    const response = await api.get<WalletDetails>('/wallet/me');
    return response.data;
  },

  getMyBalance: async (): Promise<WalletBalance> => {
    const response = await api.get<WalletBalance>('/wallet/me/balance');
    return response.data;
  },

  getMyHistory: async (params?: TransactionQuery): Promise<PaginatedResponse<Transaction>> => {
    const response = await api.get<PaginatedResponse<Transaction>>('/wallet/me/history', {
      params,
    });
    return response.data;
  },

  transfer: async (toUserId: string, amount: number, description?: string): Promise<void> => {
    await api.post('/wallet/me/transfer', {
      toUserId,
      amount,
      description,
    });
  },
};

export default walletService;
