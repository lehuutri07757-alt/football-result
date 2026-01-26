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
exports.DepositsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const dto_1 = require("./dto");
const client_1 = require("@prisma/client");
let DepositsService = class DepositsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, createDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const transferContent = createDto.transferContent || this.generateTransferContent(userId);
        return this.prisma.depositRequest.create({
            data: {
                userId,
                amount: createDto.amount,
                paymentMethod: createDto.paymentMethod,
                bankName: createDto.bankName,
                accountNumber: createDto.accountNumber,
                accountName: createDto.accountName,
                transferContent,
                proofImageUrl: createDto.proofImageUrl,
                notes: createDto.notes,
                status: 'pending',
            },
            include: {
                user: {
                    select: { id: true, username: true, email: true },
                },
            },
        });
    }
    generateTransferContent(userId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const userPart = userId.slice(0, 6).toUpperCase();
        return `NAP${userPart}${timestamp}`;
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
        const [deposits, total] = await Promise.all([
            this.prisma.depositRequest.findMany({
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
            this.prisma.depositRequest.count({ where }),
        ]);
        return {
            data: deposits,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findById(id) {
        const deposit = await this.prisma.depositRequest.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, username: true, email: true, firstName: true, lastName: true },
                },
            },
        });
        if (!deposit) {
            throw new common_1.NotFoundException('Deposit request not found');
        }
        return deposit;
    }
    async findByUser(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [deposits, total] = await Promise.all([
            this.prisma.depositRequest.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.depositRequest.count({ where: { userId } }),
        ]);
        return {
            data: deposits,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async process(id, processDto, processedBy) {
        const deposit = await this.findById(id);
        if (deposit.status !== 'pending') {
            throw new common_1.BadRequestException('Deposit request is not pending');
        }
        if (processDto.action === dto_1.DepositAction.APPROVE) {
            return this.approveDeposit(deposit, processedBy, processDto.notes);
        }
        else {
            return this.rejectDeposit(deposit, processedBy, processDto.rejectReason, processDto.notes);
        }
    }
    async approveDeposit(deposit, processedBy, notes) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId: deposit.userId },
        });
        if (!wallet) {
            throw new common_1.NotFoundException('User wallet not found');
        }
        const currentBalance = Number(wallet.realBalance);
        await this.prisma.$transaction(async (tx) => {
            const updatedCount = await tx.depositRequest.updateMany({
                where: { id: deposit.id, status: 'pending' },
                data: {
                    status: 'approved',
                    processedBy,
                    processedAt: new Date(),
                    notes,
                },
            });
            if (updatedCount.count === 0) {
                throw new common_1.BadRequestException('Deposit already processed');
            }
            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: { realBalance: { increment: Number(deposit.amount) } },
            });
            const newBalance = Number(updatedWallet.realBalance);
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: client_1.TransactionType.deposit,
                    amount: Number(deposit.amount),
                    balanceBefore: currentBalance,
                    balanceAfter: newBalance,
                    balanceType: 'real',
                    description: `Deposit approved - ${deposit.paymentMethod}`,
                    status: client_1.TransactionStatus.completed,
                    referenceType: 'deposit_request',
                    referenceId: deposit.id,
                },
            });
        });
        return this.findById(deposit.id);
    }
    async rejectDeposit(deposit, processedBy, rejectReason, notes) {
        return this.prisma.depositRequest.update({
            where: { id: deposit.id },
            data: {
                status: 'rejected',
                processedBy,
                processedAt: new Date(),
                rejectReason,
                notes,
            },
        });
    }
    async cancel(id, userId) {
        const deposit = await this.findById(id);
        if (deposit.userId !== userId) {
            throw new common_1.BadRequestException('Not authorized to cancel this deposit');
        }
        if (deposit.status !== 'pending') {
            throw new common_1.BadRequestException('Only pending deposits can be cancelled');
        }
        return this.prisma.depositRequest.update({
            where: { id },
            data: { status: 'cancelled' },
        });
    }
    async getStats() {
        const [pending, approved, rejected, totalAmount] = await Promise.all([
            this.prisma.depositRequest.count({ where: { status: 'pending' } }),
            this.prisma.depositRequest.count({ where: { status: 'approved' } }),
            this.prisma.depositRequest.count({ where: { status: 'rejected' } }),
            this.prisma.depositRequest.aggregate({
                where: { status: 'approved' },
                _sum: { amount: true },
            }),
        ]);
        return {
            pending,
            approved,
            rejected,
            totalApprovedAmount: totalAmount._sum.amount || 0,
        };
    }
};
exports.DepositsService = DepositsService;
exports.DepositsService = DepositsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepositsService);
//# sourceMappingURL=deposits.service.js.map