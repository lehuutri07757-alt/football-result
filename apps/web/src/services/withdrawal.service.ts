import api from "./api";

export interface CreateWithdrawalRequest {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
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

export const withdrawalService = {
  create: async (data: CreateWithdrawalRequest): Promise<WithdrawalRequest> => {
    const response = await api.post<WithdrawalRequest>("/withdrawals", data);
    return response.data;
  },

  getMyWithdrawals: async (
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<WithdrawalRequest>> => {
    const response = await api.get<PaginatedResponse<WithdrawalRequest>>(
      "/withdrawals/me",
      {
        params: { page, limit },
      },
    );
    return response.data;
  },

  cancel: async (id: string): Promise<WithdrawalRequest> => {
    const response = await api.post<WithdrawalRequest>(
      `/withdrawals/${id}/cancel`,
    );
    return response.data;
  },
};

export default withdrawalService;
