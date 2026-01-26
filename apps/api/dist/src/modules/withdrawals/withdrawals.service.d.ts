import { PrismaService } from '../../prisma/prisma.service';
import { CreateWithdrawalDto, ProcessWithdrawalDto, QueryWithdrawalDto } from './dto';
import { Prisma } from '@prisma/client';
export declare class WithdrawalsService {
    private prisma;
    constructor(prisma: PrismaService);
    private readonly WITHDRAWAL_FEE_PERCENT;
    create(userId: string, createDto: CreateWithdrawalDto): Promise<{
        status: string;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        userId: string;
        amount: Prisma.Decimal;
        bankName: string;
        accountNumber: string;
        accountName: string;
        notes: string | null;
        rejectReason: string | null;
        processedBy: string | null;
        processedAt: Date | null;
        transactionRef: string | null;
        fee: Prisma.Decimal;
        netAmount: Prisma.Decimal;
    }>;
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
            amount: Prisma.Decimal;
            bankName: string;
            accountNumber: string;
            accountName: string;
            notes: string | null;
            rejectReason: string | null;
            processedBy: string | null;
            processedAt: Date | null;
            transactionRef: string | null;
            fee: Prisma.Decimal;
            netAmount: Prisma.Decimal;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findById(id: string): Promise<{
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
        amount: Prisma.Decimal;
        bankName: string;
        accountNumber: string;
        accountName: string;
        notes: string | null;
        rejectReason: string | null;
        processedBy: string | null;
        processedAt: Date | null;
        transactionRef: string | null;
        fee: Prisma.Decimal;
        netAmount: Prisma.Decimal;
    }>;
    findByUser(userId: string, page?: number, limit?: number): Promise<{
        data: {
            status: string;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            userId: string;
            amount: Prisma.Decimal;
            bankName: string;
            accountNumber: string;
            accountName: string;
            notes: string | null;
            rejectReason: string | null;
            processedBy: string | null;
            processedAt: Date | null;
            transactionRef: string | null;
            fee: Prisma.Decimal;
            netAmount: Prisma.Decimal;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    process(id: string, processDto: ProcessWithdrawalDto, processedBy: string): Promise<{
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
        amount: Prisma.Decimal;
        bankName: string;
        accountNumber: string;
        accountName: string;
        notes: string | null;
        rejectReason: string | null;
        processedBy: string | null;
        processedAt: Date | null;
        transactionRef: string | null;
        fee: Prisma.Decimal;
        netAmount: Prisma.Decimal;
    }>;
    private approveWithdrawal;
    private rejectWithdrawal;
    cancel(id: string, userId: string): Promise<{
        status: string;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        userId: string;
        amount: Prisma.Decimal;
        bankName: string;
        accountNumber: string;
        accountName: string;
        notes: string | null;
        rejectReason: string | null;
        processedBy: string | null;
        processedAt: Date | null;
        transactionRef: string | null;
        fee: Prisma.Decimal;
        netAmount: Prisma.Decimal;
    }>;
    getStats(): Promise<{
        pending: number;
        completed: number;
        rejected: number;
        totalCompletedAmount: number | Prisma.Decimal;
    }>;
}
