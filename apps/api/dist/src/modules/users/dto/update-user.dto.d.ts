import { UserStatus } from '@prisma/client';
export declare class UpdateUserDto {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    roleId?: string;
    agentId?: string;
    status?: UserStatus;
    bettingLimits?: {
        minBet?: number;
        maxBet?: number;
        dailyLimit?: number;
        weeklyLimit?: number;
        monthlyLimit?: number;
    };
}
