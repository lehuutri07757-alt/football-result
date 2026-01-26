import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        totalUsers: number;
        totalRevenue: number;
        totalBets: number;
        pendingDeposits: number;
        pendingWithdrawals: number;
        activeMatches: number;
        todayBets: number;
        todayRevenue: number;
    }>;
    adjustUserBalance(userId: string, amount: number, type: 'add' | 'subtract', balanceType: 'real' | 'bonus', reason: string): Promise<{
        createdAt: Date;
        id: string;
        updatedAt: Date;
        realBalance: Decimal;
        bonusBalance: Decimal;
        pendingBalance: Decimal;
        currency: string;
        userId: string;
    }>;
}
