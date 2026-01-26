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
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const dto_1 = require("./dto");
const client_1 = require("@prisma/client");
let WalletService = class WalletService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getWalletByUserId(userId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Wallet not found');
        }
        return wallet;
    }
    async getWalletById(walletId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { id: walletId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Wallet not found');
        }
        return wallet;
    }
    async getBalance(userId) {
        const wallet = await this.getWalletByUserId(userId);
        return {
            realBalance: wallet.realBalance,
            bonusBalance: wallet.bonusBalance,
            pendingBalance: wallet.pendingBalance,
            totalAvailable: Number(wallet.realBalance) + Number(wallet.bonusBalance),
            currency: wallet.currency,
        };
    }
    async adjustBalance(userId, adjustDto, adjustedBy) {
        const wallet = await this.getWalletByUserId(userId);
        const balanceField = adjustDto.balanceType === dto_1.BalanceType.REAL ? 'realBalance' : 'bonusBalance';
        const currentBalance = Number(wallet[balanceField]);
        let newBalance;
        let transactionAmount;
        if (adjustDto.adjustmentType === dto_1.AdjustmentType.ADD) {
            newBalance = currentBalance + adjustDto.amount;
            transactionAmount = adjustDto.amount;
        }
        else {
            if (currentBalance < adjustDto.amount) {
                throw new common_1.BadRequestException('Insufficient balance');
            }
            newBalance = currentBalance - adjustDto.amount;
            transactionAmount = -adjustDto.amount;
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    [balanceField]: newBalance,
                },
            });
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: client_1.TransactionType.adjustment,
                    amount: Math.abs(transactionAmount),
                    balanceBefore: currentBalance,
                    balanceAfter: newBalance,
                    balanceType: adjustDto.balanceType,
                    description: adjustDto.description || `Balance ${adjustDto.adjustmentType} by admin`,
                    status: client_1.TransactionStatus.completed,
                    metadata: {
                        adjustedBy,
                        adjustmentType: adjustDto.adjustmentType,
                    },
                },
            });
            return updatedWallet;
        });
        return result;
    }
    async transfer(fromUserId, transferDto) {
        if (fromUserId === transferDto.toUserId) {
            throw new common_1.BadRequestException('Cannot transfer to yourself');
        }
        const fromWallet = await this.getWalletByUserId(fromUserId);
        const toWallet = await this.getWalletByUserId(transferDto.toUserId);
        const fromBalance = Number(fromWallet.realBalance);
        if (fromBalance < transferDto.amount) {
            throw new common_1.BadRequestException('Insufficient balance');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const updatedFromWallet = await tx.wallet.update({
                where: { id: fromWallet.id },
                data: {
                    realBalance: { decrement: transferDto.amount },
                },
            });
            const updatedToWallet = await tx.wallet.update({
                where: { id: toWallet.id },
                data: {
                    realBalance: { increment: transferDto.amount },
                },
            });
            await tx.transaction.create({
                data: {
                    walletId: fromWallet.id,
                    type: client_1.TransactionType.transfer,
                    amount: transferDto.amount,
                    balanceBefore: fromBalance,
                    balanceAfter: fromBalance - transferDto.amount,
                    balanceType: 'real',
                    description: transferDto.description || `Transfer to ${toWallet.user?.username}`,
                    status: client_1.TransactionStatus.completed,
                    referenceType: 'transfer_out',
                    referenceId: toWallet.userId,
                },
            });
            await tx.transaction.create({
                data: {
                    walletId: toWallet.id,
                    type: client_1.TransactionType.transfer,
                    amount: transferDto.amount,
                    balanceBefore: Number(toWallet.realBalance),
                    balanceAfter: Number(toWallet.realBalance) + transferDto.amount,
                    balanceType: 'real',
                    description: transferDto.description || `Transfer from ${fromWallet.user?.username}`,
                    status: client_1.TransactionStatus.completed,
                    referenceType: 'transfer_in',
                    referenceId: fromWallet.userId,
                },
            });
            return { fromWallet: updatedFromWallet, toWallet: updatedToWallet };
        });
        return result;
    }
    async addBonus(userId, amount, description) {
        const wallet = await this.getWalletByUserId(userId);
        const currentBalance = Number(wallet.bonusBalance);
        const newBalance = currentBalance + amount;
        const result = await this.prisma.$transaction(async (tx) => {
            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    bonusBalance: newBalance,
                },
            });
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: client_1.TransactionType.bonus,
                    amount,
                    balanceBefore: currentBalance,
                    balanceAfter: newBalance,
                    balanceType: 'bonus',
                    description: description || 'Bonus credit',
                    status: client_1.TransactionStatus.completed,
                },
            });
            return updatedWallet;
        });
        return result;
    }
    async getBalanceHistory(userId, page = 1, limit = 20) {
        const wallet = await this.getWalletByUserId(userId);
        const skip = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where: { walletId: wallet.id },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.transaction.count({ where: { walletId: wallet.id } }),
        ]);
        return {
            data: transactions,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async createWalletForUser(userId) {
        const existingWallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });
        if (existingWallet) {
            return existingWallet;
        }
        return this.prisma.wallet.create({
            data: { userId },
        });
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map