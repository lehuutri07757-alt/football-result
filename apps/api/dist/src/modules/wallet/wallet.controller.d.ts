import { WalletService } from './wallet.service';
import { AdjustBalanceDto, TransferDto } from './dto';
export declare class WalletController {
    private walletService;
    constructor(walletService: WalletService);
    getMyWallet(req: any): Promise<{
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
        realBalance: import("@prisma/client/runtime/library").Decimal;
        bonusBalance: import("@prisma/client/runtime/library").Decimal;
        pendingBalance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        userId: string;
    }>;
    getMyBalance(req: any): Promise<{
        realBalance: import("@prisma/client/runtime/library").Decimal;
        bonusBalance: import("@prisma/client/runtime/library").Decimal;
        pendingBalance: import("@prisma/client/runtime/library").Decimal;
        totalAvailable: number;
        currency: string;
    }>;
    getMyHistory(req: any, page?: string, limit?: string): Promise<{
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
    transfer(req: any, transferDto: TransferDto): Promise<{
        fromWallet: {
            createdAt: Date;
            id: string;
            updatedAt: Date;
            realBalance: import("@prisma/client/runtime/library").Decimal;
            bonusBalance: import("@prisma/client/runtime/library").Decimal;
            pendingBalance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            userId: string;
        };
        toWallet: {
            createdAt: Date;
            id: string;
            updatedAt: Date;
            realBalance: import("@prisma/client/runtime/library").Decimal;
            bonusBalance: import("@prisma/client/runtime/library").Decimal;
            pendingBalance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            userId: string;
        };
    }>;
    getUserWallet(userId: string): Promise<{
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
        realBalance: import("@prisma/client/runtime/library").Decimal;
        bonusBalance: import("@prisma/client/runtime/library").Decimal;
        pendingBalance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        userId: string;
    }>;
    getUserBalance(userId: string): Promise<{
        realBalance: import("@prisma/client/runtime/library").Decimal;
        bonusBalance: import("@prisma/client/runtime/library").Decimal;
        pendingBalance: import("@prisma/client/runtime/library").Decimal;
        totalAvailable: number;
        currency: string;
    }>;
    adjustBalance(req: any, userId: string, adjustDto: AdjustBalanceDto): Promise<{
        createdAt: Date;
        id: string;
        updatedAt: Date;
        realBalance: import("@prisma/client/runtime/library").Decimal;
        bonusBalance: import("@prisma/client/runtime/library").Decimal;
        pendingBalance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        userId: string;
    }>;
    addBonus(userId: string, body: {
        amount: number;
        description?: string;
    }): Promise<{
        createdAt: Date;
        id: string;
        updatedAt: Date;
        realBalance: import("@prisma/client/runtime/library").Decimal;
        bonusBalance: import("@prisma/client/runtime/library").Decimal;
        pendingBalance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        userId: string;
    }>;
    getUserHistory(userId: string, page?: string, limit?: string): Promise<{
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
}
