"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const dto_1 = require("./dto");
const client_1 = require("@prisma/client");
let WithdrawalsService = class WithdrawalsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.WITHDRAWAL_FEE_PERCENT = 0;
    }
    async create(userId, createDto) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Wallet not found');
        }
        const availableBalance = Number(wallet.realBalance);
        if (availableBalance < createDto.amount) {
            throw new common_1.BadRequestException('Insufficient balance');
        }
        const fee = (createDto.amount * this.WITHDRAWAL_FEE_PERCENT) / 100;
        const netAmount = createDto.amount - fee;
        const result = await this.prisma.$transaction(async (tx) => {
            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    realBalance: { decrement: createDto.amount },
                    pendingBalance: { increment: createDto.amount },
                },
            });
            const withdrawal = await tx.withdrawalRequest.create({
                data: {
                    userId,
                    amount: createDto.amount,
                    fee,
                    netAmount,
                    bankName: createDto.bankName,
                    accountNumber: createDto.accountNumber,
                    accountName: createDto.accountName,
                    status: 'pending',
                },
            });
            return withdrawal;
        });
        return result;
    }
    async findAll(query) {
        const { page = 1, limit = 10, status, userId, startDate, endDate } = query;
        const skip = (page - 1) * limit;
        const where = {
            ...(status && { status }),
            ...(userId && { userId }),
            ...(startDate || endDate) && {
                createdAt: {
                    ...(startDate && { gte: new Date(startDate) }),
                    ...(endDate && { lte: new Date(endDate) }),
                },
            },
        };
        const [withdrawals, total] = await Promise.all([
            this.prisma.withdrawalRequest.findMany({
                skip,
                take: limit,
                where,
                include: {
                    user: {
                        select: { id: true, username: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.withdrawalRequest.count({ where }),
        ]);
        return {
            data: withdrawals,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findById(id) {
        const withdrawal = await this.prisma.withdrawalRequest.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, username: true, email: true, firstName: true, lastName: true },
                },
            },
        });
        if (!withdrawal) {
            throw new common_1.NotFoundException('Withdrawal request not found');
        }
        return withdrawal;
    }
    async findByUser(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [withdrawals, total] = await Promise.all([
            this.prisma.withdrawalRequest.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.withdrawalRequest.count({ where: { userId } }),
        ]);
        return {
            data: withdrawals,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async process(id, processDto, processedBy) {
        const withdrawal = await this.findById(id);
        if (withdrawal.status !== 'pending') {
            throw new common_1.BadRequestException('Withdrawal request is not pending');
        }
        if (processDto.action === dto_1.WithdrawalAction.APPROVE) {
            return this.approveWithdrawal(withdrawal, processedBy, processDto.transactionRef, processDto.notes);
        }
        else {
            return this.rejectWithdrawal(withdrawal, processedBy, processDto.rejectReason, processDto.notes);
        }
    }
    async approveWithdrawal(withdrawal, processedBy, transactionRef, notes) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId: withdrawal.userId },
        });
        if (!wallet) {
            throw new common_1.NotFoundException('User wallet not found');
        }
        await this.prisma.$transaction(async (tx) => {
            const updatedCount = await tx.withdrawalRequest.updateMany({
                where: { id: withdrawal.id, status: 'pending' },
                data: {
                    status: 'completed',
                    processedBy,
                    processedAt: new Date(),
                    transactionRef,
                    notes,
                },
            });
            if (updatedCount.count === 0) {
                throw new common_1.BadRequestException('Withdrawal already processed');
            }
            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    pendingBalance: { decrement: Number(withdrawal.amount) },
                },
            });
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: client_1.TransactionType.withdrawal,
                    amount: Number(withdrawal.amount),
                    balanceBefore: Number(wallet.realBalance) + Number(withdrawal.amount),
                    balanceAfter: Number(wallet.realBalance),
                    balanceType: 'real',
                    description: `Withdrawal completed - ${withdrawal.bankName}`,
                    status: client_1.TransactionStatus.completed,
                    referenceType: 'withdrawal_request',
                    referenceId: withdrawal.id,
                    metadata: {
                        bankName: withdrawal.bankName,
                        accountNumber: withdrawal.accountNumber,
                        transactionRef,
                    },
                },
            });
        });
        return this.findById(withdrawal.id);
    }
    async rejectWithdrawal(withdrawal, processedBy, rejectReason, notes) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId: withdrawal.userId },
        });
        if (!wallet) {
            throw new common_1.NotFoundException('User wallet not found');
        }
        await this.prisma.$transaction(async (tx) => {
            const updatedCount = await tx.withdrawalRequest.updateMany({
                where: { id: withdrawal.id, status: 'pending' },
                data: {
                    status: 'rejected',
                    processedBy,
                    processedAt: new Date(),
                    rejectReason,
                    notes,
                },
            });
            if (updatedCount.count === 0) {
                throw new common_1.BadRequestException('Withdrawal already processed');
            }
            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    realBalance: { increment: Number(withdrawal.amount) },
                    pendingBalance: { decrement: Number(withdrawal.amount) },
                },
            });
        });
        return this.findById(withdrawal.id);
    }
    async cancel(id, userId) {
        const withdrawal = await this.findById(id);
        if (withdrawal.userId !== userId) {
            throw new common_1.BadRequestException('Not authorized to cancel this withdrawal');
        }
        if (withdrawal.status !== 'pending') {
            throw new common_1.BadRequestException('Only pending withdrawals can be cancelled');
        }
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Wallet not found');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const updatedWithdrawal = await tx.withdrawalRequest.update({
                where: { id },
                data: { status: 'cancelled' },
            });
            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    realBalance: { increment: Number(withdrawal.amount) },
                    pendingBalance: { decrement: Number(withdrawal.amount) },
                },
            });
            return updatedWithdrawal;
        });
        return result;
    }
    async getStats() {
        const [pending, completed, rejected, totalAmount] = await Promise.all([
            this.prisma.withdrawalRequest.count({ where: { status: 'pending' } }),
            this.prisma.withdrawalRequest.count({ where: { status: 'completed' } }),
            this.prisma.withdrawalRequest.count({ where: { status: 'rejected' } }),
            this.prisma.withdrawalRequest.aggregate({
                where: { status: 'completed' },
                _sum: { netAmount: true },
            }),
        ]);
        return {
            pending,
            completed,
            rejected,
            totalCompletedAmount: totalAmount._sum.netAmount || 0,
        };
    }
};
exports.WithdrawalsService = WithdrawalsService;
exports.WithdrawalsService = WithdrawalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WithdrawalsService);
//# sourceMappingURL=withdrawals.service.js.map