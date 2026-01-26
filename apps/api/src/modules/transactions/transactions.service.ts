import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryTransactionDto } from './dto';
import { Prisma, TransactionType } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryTransactionDto) {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      status, 
      userId, 
      walletId, 
      balanceType,
      startDate, 
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    let walletIds: string[] = [];
    if (userId) {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });
      if (wallet) {
        walletIds = [wallet.id];
      }
    }

    const where: Prisma.TransactionWhereInput = {
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

  async findById(id: string) {
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
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async findByUser(userId: string, query: QueryTransactionDto) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const { 
      page = 1, 
      limit = 20, 
      type, 
      status, 
      balanceType,
      startDate, 
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {
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

  async getStats(userId?: string) {
    let walletId: string | undefined;
    
    if (userId) {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });
      walletId = wallet?.id;
    }

    const baseWhere = walletId ? { walletId } : {};

    const [
      totalDeposits,
      totalWithdrawals,
      totalBetsPlaced,
      totalBetsWon,
      depositSum,
      withdrawalSum,
      betsPlacedSum,
      betsWonSum,
    ] = await Promise.all([
      this.prisma.transaction.count({ where: { ...baseWhere, type: TransactionType.deposit } }),
      this.prisma.transaction.count({ where: { ...baseWhere, type: TransactionType.withdrawal } }),
      this.prisma.transaction.count({ where: { ...baseWhere, type: TransactionType.bet_placed } }),
      this.prisma.transaction.count({ where: { ...baseWhere, type: TransactionType.bet_won } }),
      this.prisma.transaction.aggregate({
        where: { ...baseWhere, type: TransactionType.deposit },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...baseWhere, type: TransactionType.withdrawal },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...baseWhere, type: TransactionType.bet_placed },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...baseWhere, type: TransactionType.bet_won },
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

  async getDailyReport(startDate: Date, endDate: Date) {
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
}
