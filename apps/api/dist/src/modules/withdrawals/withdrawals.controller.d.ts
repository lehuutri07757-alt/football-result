import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto, ProcessWithdrawalDto, QueryWithdrawalDto } from './dto';
export declare class WithdrawalsController {
    private withdrawalsService;
    constructor(withdrawalsService: WithdrawalsService);
    findAll(query: QueryWithdrawalDto): Promise<{
        data: ({
            user: {
                username: string;
                email: string | null;
                id: string;
            };
        } & {
            status: string;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            userId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            bankName: string;
            accountNumber: string;
            accountName: string;
            notes: string | null;
            rejectReason: string | null;
            processedBy: string | null;
            processedAt: Date | null;
            transactionRef: string | null;
            fee: import("@prisma/client/runtime/library").Decimal;
            netAmount: import("@prisma/client/runtime/library").Decimal;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getStats(): Promise<{
        pending: number;
        completed: number;
        rejected: number;
        totalCompletedAmount: number | import("@prisma/client/runtime/library").Decimal;
    }>;
    getMyWithdrawals(req: any, page?: string, limit?: string): Promise<{
        data: {
            status: string;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            userId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            bankName: string;
            accountNumber: string;
            accountName: string;
            notes: string | null;
            rejectReason: string | null;
            processedBy: string | null;
            processedAt: Date | null;
            transactionRef: string | null;
            fee: import("@prisma/client/runtime/library").Decimal;
            netAmount: import("@prisma/client/runtime/library").Decimal;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    create(req: any, createDto: CreateWithdrawalDto): Promise<{
        status: string;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        userId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        bankName: string;
        accountNumber: string;
        accountName: string;
        notes: string | null;
        rejectReason: string | null;
        processedBy: string | null;
        processedAt: Date | null;
        transactionRef: string | null;
        fee: import("@prisma/client/runtime/library").Decimal;
        netAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    findOne(id: string): Promise<{
        user: {
            username: string;
            email: string | null;
            firstName: string | null;
            lastName: string | null;
            id: string;
        };
    } & {
        status: string;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        userId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        bankName: string;
        accountNumber: string;
        accountName: string;
        notes: string | null;
        rejectReason: string | null;
        processedBy: string | null;
        processedAt: Date | null;
        transactionRef: string | null;
        fee: import("@prisma/client/runtime/library").Decimal;
        netAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    process(req: any, id: string, processDto: ProcessWithdrawalDto): Promise<{
        user: {
            username: string;
            email: string | null;
            firstName: string | null;
            lastName: string | null;
            id: string;
        };
    } & {
        status: string;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        userId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        bankName: string;
        accountNumber: string;
        accountName: string;
        notes: string | null;
        rejectReason: string | null;
        processedBy: string | null;
        processedAt: Date | null;
        transactionRef: string | null;
        fee: import("@prisma/client/runtime/library").Decimal;
        netAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    cancel(req: any, id: string): Promise<{
        status: string;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        userId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        bankName: string;
        accountNumber: string;
        accountName: string;
        notes: string | null;
        rejectReason: string | null;
        processedBy: string | null;
        processedAt: Date | null;
        transactionRef: string | null;
        fee: import("@prisma/client/runtime/library").Decimal;
        netAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
}
