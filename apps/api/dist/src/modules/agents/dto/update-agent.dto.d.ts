export declare class UpdateAgentDto {
    commissionRate?: number;
    status?: string;
    bettingLimits?: {
        minBet?: number;
        maxBet?: number;
        dailyLimit?: number;
        weeklyLimit?: number;
        monthlyLimit?: number;
    };
}
