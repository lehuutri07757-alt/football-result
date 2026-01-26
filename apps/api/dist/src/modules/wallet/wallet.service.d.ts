import { PrismaService } from '../../prisma/prisma.service';
import { AdjustBalanceDto, TransferDto } from './dto';
import { Prisma } from '@prisma/client';
export declare class WalletService {
    private prisma;
    constructor(prisma: PrismaService);
    getWalletByUserId(userId: string): Promise<{
        user: {
            username: string;
            email: string | null;
            firstName: string | null;
            lastName: string | null;
            id: string;
        };
    } & {
        createdAt: Date;
        id: string;
        updatedAt: Date;
        realBalance: Prisma.Decimal;
        bonusBalance: Prisma.Decimal;
        pendingBalance: Prisma.Decimal;
        currency: string;
        userId: string;
    }>;
    getWalletById(walletId: string): Promise<{
        user: {
            username: string;
            email: string | null;
            id: string;
        };
    } & {
        createdAt: Date;
        id: string;
        updatedAt: Date;
        realBalance: Prisma.Decimal;
        bonusBalance: Prisma.Decimal;
        pendingBalance: Prisma.Decimal;
        currency: string;
        userId: string;
    }>;
    getBalance(userId: string): Promise<{
        realBalance: Prisma.Decimal;
        bonusBalance: Prisma.Decimal;
        pendingBalance: Prisma.Decimal;
        totalAvailable: number;
        currency: string;
    }>;
    adjustBalance(userId: string, adjustDto: AdjustBalanceDto, adjustedBy?: string): Promise<{
        createdAt: Date;
        id: string;
        updatedAt: Date;
        realBalance: Prisma.Decimal;
        bonusBalance: Prisma.Decimal;
        pendingBalance: Prisma.Decimal;
        currency: string;
        userId: string;
    }>;
    transfer(fromUserId: string, transferDto: TransferDto): Promise<{
        fromWallet: {
            createdAt: Date;
            id: string;
            updatedAt: Date;
            realBalance: Prisma.Decimal;
            bonusBalance: Prisma.Decimal;
            pendingBalance: Prisma.Decimal;
            currency: string;
            userId: string;
        };
        toWallet: {
            createdAt: Date;
            id: string;
            updatedAt: Date;
            realBalance: Prisma.Decimal;
            bonusBalance: Prisma.Decimal;
            pendingBalance: Prisma.Decimal;
            currency: string;
            userId: string;
        };
    }>;
    addBonus(userId: string, amount: number, description?: string): Promise<{
        createdAt: Date;
        id: string;
        updatedAt: Date;
        realBalance: Prisma.Decimal;
        bonusBalance: Prisma.Decimal;
        pendingBalance: Prisma.Decimal;
        currency: string;
        userId: string;
    }>;
    getBalanceHistory(userId: string, page?: number, limit?: number): Promise<{
        data: {
            type: import("@prisma/client").$Enums.TransactionType;
            description: string | null;
            status: import("@prisma/client").$Enums.TransactionStatus;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            amount: Prisma.Decimal;
            balanceType: string;
            walletId: string;
            balanceBefore: Prisma.Decimal;
            balanceAfter: Prisma.Decimal;
            referenceType: string | null;
            referenceId: string | null;
            metadata: Prisma.JsonValue;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    createWalletForUser(userId: string): Promise<{
        createdAt: Date;
        id: string;
        updatedAt: Date;
        realBalance: Prisma.Decimal;
        bonusBalance: Prisma.Decimal;
        pendingBalance: Prisma.Decimal;
        currency: string;
        userId: string;
    }>;
}
