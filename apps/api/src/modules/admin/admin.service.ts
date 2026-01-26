import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalBets,
      pendingDeposits,
      pendingWithdrawals,
      activeMatches,
      depositsTotalAgg,
      withdrawalsTotalAgg,
      todayBets,
      depositsTodayAgg,
      withdrawalsTodayAgg,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.bet.count(),
      this.prisma.depositRequest.count({ where: { status: 'pending' } }),
      this.prisma.withdrawalRequest.count({ where: { status: 'pending' } }),
      this.prisma.match.count({ where: { status: 'live' } }),
      this.prisma.transaction.aggregate({
        where: { type: TransactionType.deposit, status: TransactionStatus.completed },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { type: TransactionType.withdrawal, status: TransactionStatus.completed },
        _sum: { amount: true },
      }),
      this.prisma.bet.count({ where: { placedAt: { gte: startOfToday } } }),
      this.prisma.transaction.aggregate({
        where: {
          type: TransactionType.deposit,
          status: TransactionStatus.completed,
          createdAt: { gte: startOfToday },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          type: TransactionType.withdrawal,
          status: TransactionStatus.completed,
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

  async adjustUserBalance(
    userId: string,
    amount: number,
    type: 'add' | 'subtract',
    balanceType: 'real' | 'bonus',
    reason: string
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      throw new NotFoundException('User or wallet not found');
    }

    const wallet = user.wallet;
    const currentBalance = balanceType === 'real' ? wallet.realBalance : wallet.bonusBalance;
    const adjustmentAmount = type === 'subtract' ? -Math.abs(amount) : Math.abs(amount);
    const newBalance = new Decimal(currentBalance).plus(adjustmentAmount);

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
          type: TransactionType.adjustment,
          amount: Math.abs(amount),
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          balanceType: balanceType,
          description: `Admin adjustment: ${reason}`,
          status: TransactionStatus.completed,
        },
      });

      return updatedWallet;
    });
  }
}
