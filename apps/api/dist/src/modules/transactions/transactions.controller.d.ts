import { TransactionsService } from './transactions.service';
import { QueryTransactionDto } from './dto';
export declare class TransactionsController {
    private transactionsService;
    constructor(transactionsService: TransactionsService);
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
                realBalance: import("@prisma/client/runtime/library").Decimal;
                bonusBalance: import("@prisma/client/runtime/library").Decimal;
                pendingBalance: import("@prisma/client/runtime/library").Decimal;
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
            amount: import("@prisma/client/runtime/library").Decimal;
            balanceType: string;
            walletId: string;
            balanceBefore: import("@prisma/client/runtime/library").Decimal;
            balanceAfter: import("@prisma/client/runtime/library").Decimal;
            referenceType: string | null;
            referenceId: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue;
        })[];
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
            deposits: number | import("@prisma/client/runtime/library").Decimal;
            withdrawals: number | import("@prisma/client/runtime/library").Decimal;
            betsPlaced: number | import("@prisma/client/runtime/library").Decimal;
            betsWon: number | import("@prisma/client/runtime/library").Decimal;
        };
    }>;
    getDailyReport(startDate: string, endDate: string): Promise<{
        type: import("@prisma/client").$Enums.TransactionType;
        count: number;
        totalAmount: number | import("@prisma/client/runtime/library").Decimal;
    }[]>;
    getMyTransactions(req: any, query: QueryTransactionDto): Promise<{
        data: {
            type: import("@prisma/client").$Enums.TransactionType;
            description: string | null;
            status: import("@prisma/client").$Enums.TransactionStatus;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            balanceType: string;
            walletId: string;
            balanceBefore: import("@prisma/client/runtime/library").Decimal;
            balanceAfter: import("@prisma/client/runtime/library").Decimal;
            referenceType: string | null;
            referenceId: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getMyStats(req: any): Promise<{
        counts: {
            deposits: number;
            withdrawals: number;
            betsPlaced: number;
            betsWon: number;
        };
        amounts: {
            deposits: number | import("@prisma/client/runtime/library").Decimal;
            withdrawals: number | import("@prisma/client/runtime/library").Decimal;
            betsPlaced: number | import("@prisma/client/runtime/library").Decimal;
            betsWon: number | import("@prisma/client/runtime/library").Decimal;
        };
    }>;
    findOne(id: string): Promise<{
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
            realBalance: import("@prisma/client/runtime/library").Decimal;
            bonusBalance: import("@prisma/client/runtime/library").Decimal;
            pendingBalance: import("@prisma/client/runtime/library").Decimal;
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
        amount: import("@prisma/client/runtime/library").Decimal;
        balanceType: string;
        walletId: string;
        balanceBefore: import("@prisma/client/runtime/library").Decimal;
        balanceAfter: import("@prisma/client/runtime/library").Decimal;
        referenceType: string | null;
        referenceId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
