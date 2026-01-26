import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepositDto, ProcessDepositDto, QueryDepositDto, DepositAction, DepositStatus } from './dto';
import { TransactionType, TransactionStatus, Prisma } from '@prisma/client';

@Injectable()
export class DepositsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDto: CreateDepositDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
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

  private generateTransferContent(userId: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const userPart = userId.slice(0, 6).toUpperCase();
    return `NAP${userPart}${timestamp}`;
  }

  async findAll(query: QueryDepositDto) {
    const { page = 1, limit = 10, status, userId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DepositRequestWhereInput = {
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

  async findById(id: string) {
    const deposit = await this.prisma.depositRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!deposit) {
      throw new NotFoundException('Deposit request not found');
    }

    return deposit;
  }

  async findByUser(userId: string, page: number = 1, limit: number = 10) {
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

  async process(id: string, processDto: ProcessDepositDto, processedBy: string) {
    const deposit = await this.findById(id);

    if (deposit.status !== 'pending') {
      throw new BadRequestException('Deposit request is not pending');
    }

    if (processDto.action === DepositAction.APPROVE) {
      return this.approveDeposit(deposit, processedBy, processDto.notes);
    } else {
      return this.rejectDeposit(deposit, processedBy, processDto.rejectReason, processDto.notes);
    }
  }

  private async approveDeposit(deposit: any, processedBy: string, notes?: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: deposit.userId },
    });

    if (!wallet) {
      throw new NotFoundException('User wallet not found');
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
        throw new BadRequestException('Deposit already processed');
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { realBalance: { increment: Number(deposit.amount) } },
      });

      const newBalance = Number(updatedWallet.realBalance);

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.deposit,
          amount: Number(deposit.amount),
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          balanceType: 'real',
          description: `Deposit approved - ${deposit.paymentMethod}`,
          status: TransactionStatus.completed,
          referenceType: 'deposit_request',
          referenceId: deposit.id,
        },
      });
    });

    return this.findById(deposit.id);
  }

  private async rejectDeposit(deposit: any, processedBy: string, rejectReason?: string, notes?: string) {
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

  async cancel(id: string, userId: string) {
    const deposit = await this.findById(id);

    if (deposit.userId !== userId) {
      throw new BadRequestException('Not authorized to cancel this deposit');
    }

    if (deposit.status !== 'pending') {
      throw new BadRequestException('Only pending deposits can be cancelled');
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
}
