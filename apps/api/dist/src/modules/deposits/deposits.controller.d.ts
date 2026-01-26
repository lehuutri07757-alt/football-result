import { DepositsService } from './deposits.service';
import { CreateDepositDto, ProcessDepositDto, QueryDepositDto } from './dto';
export declare class DepositsController {
    private depositsService;
    constructor(depositsService: DepositsService);
    findAll(query: QueryDepositDto): Promise<{
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
            paymentMethod: string;
            bankName: string | null;
            accountNumber: string | null;
            accountName: string | null;
            transferContent: string | null;
            proofImageUrl: string | null;
            notes: string | null;
            rejectReason: string | null;
            processedBy: string | null;
            processedAt: Date | null;
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
        approved: number;
        rejected: number;
        totalApprovedAmount: number | import("@prisma/client/runtime/library").Decimal;
    }>;
    getMyDeposits(req: any, page?: string, limit?: string): Promise<{
        data: {
            status: string;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            userId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: string;
            bankName: string | null;
            accountNumber: string | null;
            accountName: string | null;
            transferContent: string | null;
            proofImageUrl: string | null;
            notes: string | null;
            rejectReason: string | null;
            processedBy: string | null;
            processedAt: Date | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    create(req: any, createDto: CreateDepositDto): Promise<{
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
        paymentMethod: string;
        bankName: string | null;
        accountNumber: string | null;
        accountName: string | null;
        transferContent: string | null;
        proofImageUrl: string | null;
        notes: string | null;
        rejectReason: string | null;
        processedBy: string | null;
        processedAt: Date | null;
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
        paymentMethod: string;
        bankName: string | null;
        accountNumber: string | null;
        accountName: string | null;
        transferContent: string | null;
        proofImageUrl: string | null;
        notes: string | null;
        rejectReason: string | null;
        processedBy: string | null;
        processedAt: Date | null;
    }>;
    process(req: any, id: string, processDto: ProcessDepositDto): Promise<{
        status: string;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        userId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: string;
        bankName: string | null;
        accountNumber: string | null;
        accountName: string | null;
        transferContent: string | null;
        proofImageUrl: string | null;
        notes: string | null;
        rejectReason: string | null;
        processedBy: string | null;
        processedAt: Date | null;
    }>;
    cancel(req: any, id: string): Promise<{
        status: string;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        userId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: string;
        bankName: string | null;
        accountNumber: string | null;
        accountName: string | null;
        transferContent: string | null;
        proofImageUrl: string | null;
        notes: string | null;
        rejectReason: string | null;
        processedBy: string | null;
        processedAt: Date | null;
    }>;
}
