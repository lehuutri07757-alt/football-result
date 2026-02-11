import api from './api';

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  E_WALLET = 'e_wallet',
  CRYPTO = 'crypto',
}

export interface CreateDepositRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  transferContent?: string;
  proofImageUrl?: string;
  notes?: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
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

export const depositService = {
  create: async (data: CreateDepositRequest): Promise<DepositRequest> => {
    const response = await api.post<DepositRequest>('/deposits', data);
    return response.data;
  },

  getMyDeposits: async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<DepositRequest>> => {
    const response = await api.get<PaginatedResponse<DepositRequest>>('/deposits/me', {
      params: { page, limit },
    });
    return response.data;
  },

  cancel: async (id: string): Promise<DepositRequest> => {
    const response = await api.post<DepositRequest>(`/deposits/${id}/cancel`);
    return response.data;
  },
};

export default depositService;
