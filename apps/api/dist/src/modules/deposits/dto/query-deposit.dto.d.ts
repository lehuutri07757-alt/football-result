export declare enum DepositStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    CANCELLED = "cancelled"
}
export declare class QueryDepositDto {
    page?: number;
    limit?: number;
    status?: DepositStatus;
    userId?: string;
    startDate?: string;
    endDate?: string;
}
