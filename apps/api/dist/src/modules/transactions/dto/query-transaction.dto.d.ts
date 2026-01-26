import { TransactionType, TransactionStatus } from '@prisma/client';
export declare class QueryTransactionDto {
    page?: number;
    limit?: number;
    type?: TransactionType;
    status?: TransactionStatus;
    userId?: string;
    walletId?: string;
    balanceType?: 'real' | 'bonus';
    startDate?: string;
    endDate?: string;
    sortBy?: 'createdAt' | 'amount';
    sortOrder?: 'asc' | 'desc';
}
