import { PrismaService } from '../../prisma/prisma.service';
import { QueryTransactionDto } from './dto';
import { Prisma } from '@prisma/client';
export declare class TransactionsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: QueryTransactionDto): Promise<{
        data: ({
            wallet: {
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
            };
        } & {
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
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findById(id: string): Promise<{
        wallet: {
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
        };
    } & {
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
    }>;
    findByUser(userId: string, query: QueryTransactionDto): Promise<{
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
    getStats(userId?: string): Promise<{
        counts: {
            deposits: number;
            withdrawals: number;
            betsPlaced: number;
            betsWon: number;
        };
        amounts: {
            deposits: number | Prisma.Decimal;
            withdrawals: number | Prisma.Decimal;
            betsPlaced: number | Prisma.Decimal;
            betsWon: number | Prisma.Decimal;
        };
    }>;
    getDailyReport(startDate: Date, endDate: Date): Promise<{
        type: import("@prisma/client").$Enums.TransactionType;
        count: number;
        totalAmount: number | Prisma.Decimal;
    }[]>;
}
