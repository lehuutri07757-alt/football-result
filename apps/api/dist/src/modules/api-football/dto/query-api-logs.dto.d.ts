export declare enum ApiRequestStatusFilter {
    ALL = "all",
    SUCCESS = "success",
    ERROR = "error",
    TIMEOUT = "timeout"
}
export declare class QueryApiLogsDto {
    endpoint?: string;
    status?: ApiRequestStatusFilter;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
