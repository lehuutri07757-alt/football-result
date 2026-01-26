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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats() {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const [totalUsers, totalBets, pendingDeposits, pendingWithdrawals, activeMatches, depositsTotalAgg, withdrawalsTotalAgg, todayBets, depositsTodayAgg, withdrawalsTodayAgg,] = await Promise.all([
            this.prisma.user.count({ where: { deletedAt: null } }),
            this.prisma.bet.count(),
            this.prisma.depositRequest.count({ where: { status: 'pending' } }),
            this.prisma.withdrawalRequest.count({ where: { status: 'pending' } }),
            this.prisma.match.count({ where: { status: 'live' } }),
            this.prisma.transaction.aggregate({
                where: { type: client_1.TransactionType.deposit, status: client_1.TransactionStatus.completed },
                _sum: { amount: true },
            }),
            this.prisma.transaction.aggregate({
                where: { type: client_1.TransactionType.withdrawal, status: client_1.TransactionStatus.completed },
                _sum: { amount: true },
            }),
            this.prisma.bet.count({ where: { placedAt: { gte: startOfToday } } }),
            this.prisma.transaction.aggregate({
                where: {
                    type: client_1.TransactionType.deposit,
                    status: client_1.TransactionStatus.completed,
                    createdAt: { gte: startOfToday },
                },
                _sum: { amount: true },
            }),
            this.prisma.transaction.aggregate({
                where: {
                    type: client_1.TransactionType.withdrawal,
                    status: client_1.TransactionStatus.completed,
                    createdAt: { gte: startOfToday },
                },
                _sum: { amount: true },
            }),
        ]);
        const depositsTotal = Number(depositsTotalAgg._sum.amount ?? 0);
        const withdrawalsTotal = Number(withdrawalsTotalAgg._sum.amount ?? 0);
        const depositsToday = Number(depositsTodayAgg._sum.amount ?? 0);
        const withdrawalsToday = Number(withdrawalsTodayAgg._sum.amount ?? 0);
        return {
            totalUsers,
            totalRevenue: depositsTotal - withdrawalsTotal,
            totalBets,
            pendingDeposits,
            pendingWithdrawals,
            activeMatches,
            todayBets,
            todayRevenue: depositsToday - withdrawalsToday,
        };
    }
    async adjustUserBalance(userId, amount, type, balanceType, reason) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true },
        });
        if (!user || !user.wallet) {
            throw new common_1.NotFoundException('User or wallet not found');
        }
        const wallet = user.wallet;
        const currentBalance = balanceType === 'real' ? wallet.realBalance : wallet.bonusBalance;
        const adjustmentAmount = type === 'subtract' ? -Math.abs(amount) : Math.abs(amount);
        const newBalance = new library_1.Decimal(currentBalance).plus(adjustmentAmount);
        if (newBalance.lessThan(0)) {
            throw new Error('Insufficient balance');
        }
        return await this.prisma.$transaction(async (prisma) => {
            const updatedWallet = await prisma.wallet.update({
                where: { id: wallet.id },
                data: {
                    [balanceType === 'real' ? 'realBalance' : 'bonusBalance']: newBalance,
                },
            });
            await prisma.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: client_1.TransactionType.adjustment,
                    amount: Math.abs(amount),
                    balanceBefore: currentBalance,
                    balanceAfter: newBalance,
                    balanceType: balanceType,
                    description: `Admin adjustment: ${reason}`,
                    status: client_1.TransactionStatus.completed,
                },
            });
            return updatedWallet;
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map