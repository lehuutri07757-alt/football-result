import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdjustBalanceDto, BalanceType, AdjustmentType, TransferDto } from './dto';
import { TransactionType, TransactionStatus, Prisma } from '@prisma/client';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getWalletByUserId(userId: string) {
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
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async getWalletById(walletId: string) {
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
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async getBalance(userId: string) {
    const wallet = await this.getWalletByUserId(userId);

    return {
      realBalance: wallet.realBalance,
      bonusBalance: wallet.bonusBalance,
      pendingBalance: wallet.pendingBalance,
      totalAvailable: Number(wallet.realBalance) + Number(wallet.bonusBalance),
      currency: wallet.currency,
    };
  }

  async adjustBalance(userId: string, adjustDto: AdjustBalanceDto, adjustedBy?: string) {
    const wallet = await this.getWalletByUserId(userId);

    const balanceField = adjustDto.balanceType === BalanceType.REAL ? 'realBalance' : 'bonusBalance';
    const currentBalance = Number(wallet[balanceField]);

    let newBalance: number;
    let transactionAmount: number;

    if (adjustDto.adjustmentType === AdjustmentType.ADD) {
      newBalance = currentBalance + adjustDto.amount;
      transactionAmount = adjustDto.amount;
    } else {
      if (currentBalance < adjustDto.amount) {
        throw new BadRequestException('Insufficient balance');
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
          type: TransactionType.adjustment,
          amount: Math.abs(transactionAmount),
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          balanceType: adjustDto.balanceType,
          description: adjustDto.description || `Balance ${adjustDto.adjustmentType} by admin`,
          status: TransactionStatus.completed,
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

  async transfer(fromUserId: string, transferDto: TransferDto) {
    if (fromUserId === transferDto.toUserId) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    const fromWallet = await this.getWalletByUserId(fromUserId);
    const toWallet = await this.getWalletByUserId(transferDto.toUserId);

    const fromBalance = Number(fromWallet.realBalance);
    if (fromBalance < transferDto.amount) {
      throw new BadRequestException('Insufficient balance');
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
          type: TransactionType.transfer,
          amount: transferDto.amount,
          balanceBefore: fromBalance,
          balanceAfter: fromBalance - transferDto.amount,
          balanceType: 'real',
          description: transferDto.description || `Transfer to ${toWallet.user?.username}`,
          status: TransactionStatus.completed,
          referenceType: 'transfer_out',
          referenceId: toWallet.userId,
        },
      });

      await tx.transaction.create({
        data: {
          walletId: toWallet.id,
          type: TransactionType.transfer,
          amount: transferDto.amount,
          balanceBefore: Number(toWallet.realBalance),
          balanceAfter: Number(toWallet.realBalance) + transferDto.amount,
          balanceType: 'real',
          description: transferDto.description || `Transfer from ${fromWallet.user?.username}`,
          status: TransactionStatus.completed,
          referenceType: 'transfer_in',
          referenceId: fromWallet.userId,
        },
      });

      return { fromWallet: updatedFromWallet, toWallet: updatedToWallet };
    });

    return result;
  }

  async addBonus(userId: string, amount: number, description?: string) {
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
          type: TransactionType.bonus,
          amount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          balanceType: 'bonus',
          description: description || 'Bonus credit',
          status: TransactionStatus.completed,
        },
      });

      return updatedWallet;
    });

    return result;
  }

  async getBalanceHistory(userId: string, page: number = 1, limit: number = 20) {
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

  async createWalletForUser(userId: string) {
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
}
