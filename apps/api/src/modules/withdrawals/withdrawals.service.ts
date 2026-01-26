import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWithdrawalDto, ProcessWithdrawalDto, QueryWithdrawalDto, WithdrawalAction } from './dto';
import { TransactionType, TransactionStatus, Prisma } from '@prisma/client';

@Injectable()
export class WithdrawalsService {
  constructor(private prisma: PrismaService) {}

  private readonly WITHDRAWAL_FEE_PERCENT = 0;

  async create(userId: string, createDto: CreateWithdrawalDto) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const availableBalance = Number(wallet.realBalance);
    if (availableBalance < createDto.amount) {
      throw new BadRequestException('Insufficient balance');
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

  async findAll(query: QueryWithdrawalDto) {
    const { page = 1, limit = 10, status, userId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.WithdrawalRequestWhereInput = {
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

  async findById(id: string) {
    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal request not found');
    }

    return withdrawal;
  }

  async findByUser(userId: string, page: number = 1, limit: number = 10) {
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

  async process(id: string, processDto: ProcessWithdrawalDto, processedBy: string) {
    const withdrawal = await this.findById(id);

    if (withdrawal.status !== 'pending') {
      throw new BadRequestException('Withdrawal request is not pending');
    }

    if (processDto.action === WithdrawalAction.APPROVE) {
      return this.approveWithdrawal(withdrawal, processedBy, processDto.transactionRef, processDto.notes);
    } else {
      return this.rejectWithdrawal(withdrawal, processedBy, processDto.rejectReason, processDto.notes);
    }
  }

  private async approveWithdrawal(withdrawal: any, processedBy: string, transactionRef?: string, notes?: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: withdrawal.userId },
    });

    if (!wallet) {
      throw new NotFoundException('User wallet not found');
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
        throw new BadRequestException('Withdrawal already processed');
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
          type: TransactionType.withdrawal,
          amount: Number(withdrawal.amount),
          balanceBefore: Number(wallet.realBalance) + Number(withdrawal.amount),
          balanceAfter: Number(wallet.realBalance),
          balanceType: 'real',
          description: `Withdrawal completed - ${withdrawal.bankName}`,
          status: TransactionStatus.completed,
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

  private async rejectWithdrawal(withdrawal: any, processedBy: string, rejectReason?: string, notes?: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: withdrawal.userId },
    });

    if (!wallet) {
      throw new NotFoundException('User wallet not found');
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
        throw new BadRequestException('Withdrawal already processed');
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

  async cancel(id: string, userId: string) {
    const withdrawal = await this.findById(id);

    if (withdrawal.userId !== userId) {
      throw new BadRequestException('Not authorized to cancel this withdrawal');
    }

    if (withdrawal.status !== 'pending') {
      throw new BadRequestException('Only pending withdrawals can be cancelled');
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
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
}
