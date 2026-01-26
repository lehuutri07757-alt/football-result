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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let TransactionsService = class TransactionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const { page = 1, limit = 20, type, status, userId, walletId, balanceType, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const skip = (page - 1) * limit;
        let walletIds = [];
        if (userId) {
            const wallet = await this.prisma.wallet.findUnique({
                where: { userId },
            });
            if (wallet) {
                walletIds = [wallet.id];
            }
        }
        const where = {
            ...(type && { type }),
            ...(status && { status }),
            ...(walletId && { walletId }),
            ...(userId && walletIds.length > 0 && { walletId: { in: walletIds } }),
            ...(balanceType && { balanceType }),
            ...(startDate || endDate) && {
                createdAt: {
                    ...(startDate && { gte: new Date(startDate) }),
                    ...(endDate && { lte: new Date(endDate) }),
                },
            },
        };
        const [transactions, total] = await Promise.all([
            this.prisma.transaction.findMany({
                skip,
                take: limit,
                where,
                include: {
                    wallet: {
                        include: {
                            user: {
                                select: { id: true, username: true, email: true },
                            },
                        },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.transaction.count({ where }),
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
    async findById(id) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
            include: {
                wallet: {
                    include: {
                        user: {
                            select: { id: true, username: true, email: true },
                        },
                    },
                },
            },
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        return transaction;
    }
    async findByUser(userId, query) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Wallet not found');
        }
        const { page = 1, limit = 20, type, status, balanceType, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const skip = (page - 1) * limit;
        const where = {
            walletId: wallet.id,
            ...(type && { type }),
            ...(status && { status }),
            ...(balanceType && { balanceType }),
            ...(startDate || endDate) && {
                createdAt: {
                    ...(startDate && { gte: new Date(startDate) }),
                    ...(endDate && { lte: new Date(endDate) }),
                },
            },
        };
        const [transactions, total] = await Promise.all([
            this.prisma.transaction.findMany({
                skip,
                take: limit,
                where,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.transaction.count({ where }),
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
    async getStats(userId) {
        let walletId;
        if (userId) {
            const wallet = await this.prisma.wallet.findUnique({
                where: { userId },
            });
            walletId = wallet?.id;
        }
        const baseWhere = walletId ? { walletId } : {};
        const [totalDeposits, totalWithdrawals, totalBetsPlaced, totalBetsWon, depositSum, withdrawalSum, betsPlacedSum, betsWonSum,] = await Promise.all([
            this.prisma.transaction.count({ where: { ...baseWhere, type: client_1.TransactionType.deposit } }),
            this.prisma.transaction.count({ where: { ...baseWhere, type: client_1.TransactionType.withdrawal } }),
            this.prisma.transaction.count({ where: { ...baseWhere, type: client_1.TransactionType.bet_placed } }),
            this.prisma.transaction.count({ where: { ...baseWhere, type: client_1.TransactionType.bet_won } }),
            this.prisma.transaction.aggregate({
                where: { ...baseWhere, type: client_1.TransactionType.deposit },
                _sum: { amount: true },
            }),
            this.prisma.transaction.aggregate({
                where: { ...baseWhere, type: client_1.TransactionType.withdrawal },
                _sum: { amount: true },
            }),
            this.prisma.transaction.aggregate({
                where: { ...baseWhere, type: client_1.TransactionType.bet_placed },
                _sum: { amount: true },
            }),
            this.prisma.transaction.aggregate({
                where: { ...baseWhere, type: client_1.TransactionType.bet_won },
                _sum: { amount: true },
            }),
        ]);
        return {
            counts: {
                deposits: totalDeposits,
                withdrawals: totalWithdrawals,
                betsPlaced: totalBetsPlaced,
                betsWon: totalBetsWon,
            },
            amounts: {
                deposits: depositSum._sum.amount || 0,
                withdrawals: withdrawalSum._sum.amount || 0,
                betsPlaced: betsPlacedSum._sum.amount || 0,
                betsWon: betsWonSum._sum.amount || 0,
            },
        };
    }
    async getDailyReport(startDate, endDate) {
        const transactions = await this.prisma.transaction.groupBy({
            by: ['type'],
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                status: 'completed',
            },
            _sum: { amount: true },
            _count: true,
        });
        return transactions.map(t => ({
            type: t.type,
            count: t._count,
            totalAmount: t._sum.amount || 0,
        }));
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map