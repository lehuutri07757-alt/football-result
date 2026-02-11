import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionStatus, TransactionType, BetStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    // Build 7-day date range
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

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
      // Yesterday comparison data
      yesterdayUsers,
      yesterdayBets,
      depositsYesterdayAgg,
      withdrawalsYesterdayAgg,
      yesterdayActiveMatches,
      // Extra stats
      newUsersToday,
      betsWon,
      betsLost,
      betsPending,
      totalPlatformBalanceAgg,
      totalDepositsAgg,
      totalWithdrawalsAgg,
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
      // Yesterday users registered
      this.prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: startOfYesterday, lt: startOfToday },
        },
      }),
      // Yesterday bets
      this.prisma.bet.count({
        where: {
          placedAt: { gte: startOfYesterday, lt: startOfToday },
        },
      }),
      // Yesterday deposits
      this.prisma.transaction.aggregate({
        where: {
          type: TransactionType.deposit,
          status: TransactionStatus.completed,
          createdAt: { gte: startOfYesterday, lt: startOfToday },
        },
        _sum: { amount: true },
      }),
      // Yesterday withdrawals
      this.prisma.transaction.aggregate({
        where: {
          type: TransactionType.withdrawal,
          status: TransactionStatus.completed,
          createdAt: { gte: startOfYesterday, lt: startOfToday },
        },
        _sum: { amount: true },
      }),
      // Yesterday active matches (scheduled for yesterday)
      this.prisma.match.count({
        where: {
          startTime: { gte: startOfYesterday, lt: startOfToday },
        },
      }),
      // New users today
      this.prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: startOfToday },
        },
      }),
      // Bet breakdown
      this.prisma.bet.count({ where: { status: BetStatus.won } }),
      this.prisma.bet.count({ where: { status: BetStatus.lost } }),
      this.prisma.bet.count({ where: { status: BetStatus.pending } }),
      // Total platform balance
      this.prisma.wallet.aggregate({ _sum: { realBalance: true } }),
      // Total deposits (raw sum)
      this.prisma.depositRequest.aggregate({
        where: { status: 'approved' },
        _sum: { amount: true },
      }),
      // Total withdrawals (raw sum)
      this.prisma.withdrawalRequest.aggregate({
        where: { status: 'approved' },
        _sum: { amount: true },
      }),
    ]);

    const depositsTotal = Number(depositsTotalAgg._sum.amount ?? 0);
    const withdrawalsTotal = Number(withdrawalsTotalAgg._sum.amount ?? 0);

    const depositsToday = Number(depositsTodayAgg._sum.amount ?? 0);
    const withdrawalsToday = Number(withdrawalsTodayAgg._sum.amount ?? 0);

    const depositsYesterday = Number(depositsYesterdayAgg._sum.amount ?? 0);
    const withdrawalsYesterday = Number(withdrawalsYesterdayAgg._sum.amount ?? 0);
    const yesterdayRevenue = depositsYesterday - withdrawalsYesterday;
    const todayRevenue = depositsToday - withdrawalsToday;

    // Compute trend percentages (today vs yesterday)
    const calcChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const revenueChange = calcChange(todayRevenue, yesterdayRevenue);
    const usersChange = calcChange(newUsersToday, yesterdayUsers);
    const betsChange = calcChange(todayBets, yesterdayBets);
    // For matches, show diff as absolute number
    const matchesDiff = activeMatches - yesterdayActiveMatches;

    // Recent activities: last 10 transactions with user info
    const recentTransactions = await this.prisma.transaction.findMany({
      where: {
        type: {
          in: [TransactionType.deposit, TransactionType.withdrawal, TransactionType.bet_placed, TransactionType.bet_won],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        wallet: {
          include: {
            user: {
              select: { username: true },
            },
          },
        },
      },
    });

    const recentActivities = recentTransactions.map((tx) => {
      let activityType: 'deposit' | 'withdrawal' | 'bet' = 'deposit';
      if (tx.type === TransactionType.withdrawal) activityType = 'withdrawal';
      else if (tx.type === TransactionType.bet_placed || tx.type === TransactionType.bet_won)
        activityType = 'bet';

      return {
        id: tx.id,
        type: activityType,
        user: tx.wallet?.user?.username || 'Unknown',
        amount: Number(tx.amount),
        status: tx.status,
        time: tx.createdAt.toISOString(),
      };
    });

    // Last 7 days revenue
    const last7DaysRevenue: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(startOfToday);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const [dayDeposits, dayWithdrawals] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: {
            type: TransactionType.deposit,
            status: TransactionStatus.completed,
            createdAt: { gte: dayStart, lt: dayEnd },
          },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: {
            type: TransactionType.withdrawal,
            status: TransactionStatus.completed,
            createdAt: { gte: dayStart, lt: dayEnd },
          },
          _sum: { amount: true },
        }),
      ]);

      last7DaysRevenue.push({
        date: dayStart.toISOString().slice(0, 10),
        revenue: Number(dayDeposits._sum.amount ?? 0) - Number(dayWithdrawals._sum.amount ?? 0),
      });
    }

    return {
      totalUsers,
      totalRevenue: depositsTotal - withdrawalsTotal,
      totalBets,
      pendingDeposits,
      pendingWithdrawals,
      activeMatches,
      todayBets,
      todayRevenue,
      // Trend data
      revenueChange,
      usersChange,
      betsChange,
      matchesDiff,
      // Extra stats
      newUsersToday,
      betsWon,
      betsLost,
      betsPending,
      totalPlatformBalance: Number(totalPlatformBalanceAgg._sum.realBalance ?? 0),
      totalDeposits: Number(totalDepositsAgg._sum.amount ?? 0),
      totalWithdrawals: Number(totalWithdrawalsAgg._sum.amount ?? 0),
      // Recent activities
      recentActivities,
      // Chart data
      last7DaysRevenue,
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
