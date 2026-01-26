import { PrismaService } from '../../prisma/prisma.service';
import { UpdateBettingLimitsDto } from './dto';
export interface BettingLimits {
    minBet: number;
    maxBet: number;
    dailyLimit: number;
    weeklyLimit: number;
    monthlyLimit: number;
}
export declare class BettingLimitsService {
    private prisma;
    constructor(prisma: PrismaService);
    getUserBettingLimits(userId: string): Promise<BettingLimits>;
    getAgentBettingLimits(agentId: string): Promise<BettingLimits>;
    updateUserBettingLimits(userId: string, updateDto: UpdateBettingLimitsDto): Promise<BettingLimits>;
    updateAgentBettingLimits(agentId: string, updateDto: UpdateBettingLimitsDto): Promise<BettingLimits>;
    private validateLimitsAgainstParent;
    validateBetAmount(userId: string, amount: number): Promise<{
        valid: boolean;
        reason?: string;
    }>;
    getUserBettingStats(userId: string): Promise<{
        limits: BettingLimits;
        usage: {
            daily: {
                used: number;
                remaining: number;
            };
            weekly: {
                used: number;
                remaining: number;
            };
            monthly: {
                used: number;
                remaining: number;
            };
        };
    }>;
}
