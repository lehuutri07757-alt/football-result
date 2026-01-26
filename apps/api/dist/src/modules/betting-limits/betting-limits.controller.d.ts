import { BettingLimitsService } from './betting-limits.service';
import { UpdateBettingLimitsDto } from './dto';
export declare class BettingLimitsController {
    private bettingLimitsService;
    constructor(bettingLimitsService: BettingLimitsService);
    getMyLimits(req: any): Promise<import("./betting-limits.service").BettingLimits>;
    getMyStats(req: any): Promise<{
        limits: import("./betting-limits.service").BettingLimits;
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
    validateBet(req: any, amount: string): Promise<{
        valid: boolean;
        reason?: string;
    }>;
    getUserLimits(userId: string): Promise<import("./betting-limits.service").BettingLimits>;
    updateUserLimits(userId: string, updateDto: UpdateBettingLimitsDto): Promise<import("./betting-limits.service").BettingLimits>;
    getUserStats(userId: string): Promise<{
        limits: import("./betting-limits.service").BettingLimits;
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
    getAgentLimits(agentId: string): Promise<import("./betting-limits.service").BettingLimits>;
    updateAgentLimits(agentId: string, updateDto: UpdateBettingLimitsDto): Promise<import("./betting-limits.service").BettingLimits>;
}
