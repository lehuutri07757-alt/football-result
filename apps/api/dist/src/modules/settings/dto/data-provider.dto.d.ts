export declare enum DataProviderStatus {
    active = "active",
    inactive = "inactive",
    error = "error",
    maintenance = "maintenance"
}
export declare enum DataProviderType {
    odds = "odds",
    fixtures = "fixtures",
    live_scores = "live_scores",
    statistics = "statistics",
    leagues = "leagues",
    teams = "teams"
}
export declare class CreateDataProviderDto {
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
export declare class UpdateDataProviderDto {
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
export declare class QueryDataProviderDto {
    status?: DataProviderStatus;
    type?: DataProviderType;
}
