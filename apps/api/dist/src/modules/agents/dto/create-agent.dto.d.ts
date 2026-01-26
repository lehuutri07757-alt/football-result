export declare class CreateAgentDto {
    username: string;
    email?: string;
    phone?: string;
    password: string;
    firstName?: string;
    lastName?: string;
    parentId?: string;
    commissionRate?: number;
    bettingLimits?: {
        minBet?: number;
        maxBet?: number;
        dailyLimit?: number;
        weeklyLimit?: number;
        monthlyLimit?: number;
    };
}
