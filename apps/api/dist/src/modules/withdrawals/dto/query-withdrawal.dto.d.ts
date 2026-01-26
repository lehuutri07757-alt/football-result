export declare enum WithdrawalStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    REJECTED = "rejected",
    CANCELLED = "cancelled"
}
export declare class QueryWithdrawalDto {
    page?: number;
    limit?: number;
    status?: WithdrawalStatus;
    userId?: string;
    startDate?: string;
    endDate?: string;
}
