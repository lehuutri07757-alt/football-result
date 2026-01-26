import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepositDto, ProcessDepositDto, QueryDepositDto } from './dto';
import { Prisma } from '@prisma/client';
export declare class DepositsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, createDto: CreateDepositDto): Promise<{
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
    private generateTransferContent;
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
            amount: Prisma.Decimal;
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
    findByUser(userId: string, page?: number, limit?: number): Promise<{
        data: {
            status: string;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            userId: string;
            amount: Prisma.Decimal;
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
    process(id: string, processDto: ProcessDepositDto, processedBy: string): Promise<{
        status: string;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        userId: string;
        amount: Prisma.Decimal;
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
    private approveDeposit;
    private rejectDeposit;
    cancel(id: string, userId: string): Promise<{
        status: string;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        userId: string;
        amount: Prisma.Decimal;
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
    getStats(): Promise<{
        pending: number;
        approved: number;
        rejected: number;
        totalApprovedAmount: number | Prisma.Decimal;
    }>;
}
