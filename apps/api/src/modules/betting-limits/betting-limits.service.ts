import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateBettingLimitsDto } from './dto';

export interface BettingLimits {
  minBet: number;
  maxBet: number;
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
}

const DEFAULT_BETTING_LIMITS: BettingLimits = {
  minBet: 1,
  maxBet: 10000,
  dailyLimit: 50000,
  weeklyLimit: 200000,
  monthlyLimit: 500000,
};

@Injectable()
export class BettingLimitsService {
  constructor(private prisma: PrismaService) {}

  async getUserBettingLimits(userId: string): Promise<BettingLimits> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { agent: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userLimits = user.bettingLimits as BettingLimits | null;
    
    if (userLimits && Object.keys(userLimits).length > 0) {
      return { ...DEFAULT_BETTING_LIMITS, ...userLimits };
    }

    if (user.agentId) {
      const agentLimits = await this.getAgentBettingLimits(user.agentId);
      return agentLimits;
    }

    return DEFAULT_BETTING_LIMITS;
  }

  async getAgentBettingLimits(agentId: string): Promise<BettingLimits> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: { parent: true },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const agentLimits = agent.bettingLimits as BettingLimits | null;

    if (agentLimits && Object.keys(agentLimits).length > 0) {
      return { ...DEFAULT_BETTING_LIMITS, ...agentLimits };
    }

    if (agent.parentId) {
      return this.getAgentBettingLimits(agent.parentId);
    }

    return DEFAULT_BETTING_LIMITS;
  }

  async updateUserBettingLimits(userId: string, updateDto: UpdateBettingLimitsDto): Promise<BettingLimits> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { agent: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.agentId) {
      const agentLimits = await this.getAgentBettingLimits(user.agentId);
      this.validateLimitsAgainstParent(updateDto, agentLimits);
    }

    const currentLimits = (user.bettingLimits as unknown as BettingLimits) || {};
    const newLimits = {
      ...currentLimits,
      ...updateDto,
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { bettingLimits: newLimits },
    });

    return { ...DEFAULT_BETTING_LIMITS, ...newLimits };
  }

  async updateAgentBettingLimits(agentId: string, updateDto: UpdateBettingLimitsDto): Promise<BettingLimits> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: { parent: true },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    if (agent.parentId) {
      const parentLimits = await this.getAgentBettingLimits(agent.parentId);
      this.validateLimitsAgainstParent(updateDto, parentLimits);
    }

    const currentLimits = (agent.bettingLimits as unknown as BettingLimits) || {};
    const newLimits = {
      ...currentLimits,
      ...updateDto,
    };

    await this.prisma.agent.update({
      where: { id: agentId },
      data: { bettingLimits: newLimits },
    });

    return { ...DEFAULT_BETTING_LIMITS, ...newLimits };
  }

  private validateLimitsAgainstParent(updateDto: UpdateBettingLimitsDto, parentLimits: BettingLimits): void {
    if (updateDto.maxBet && updateDto.maxBet > parentLimits.maxBet) {
      throw new BadRequestException(`Max bet cannot exceed parent limit of ${parentLimits.maxBet}`);
    }

    if (updateDto.dailyLimit && updateDto.dailyLimit > parentLimits.dailyLimit) {
      throw new BadRequestException(`Daily limit cannot exceed parent limit of ${parentLimits.dailyLimit}`);
    }

    if (updateDto.weeklyLimit && updateDto.weeklyLimit > parentLimits.weeklyLimit) {
      throw new BadRequestException(`Weekly limit cannot exceed parent limit of ${parentLimits.weeklyLimit}`);
    }

    if (updateDto.monthlyLimit && updateDto.monthlyLimit > parentLimits.monthlyLimit) {
      throw new BadRequestException(`Monthly limit cannot exceed parent limit of ${parentLimits.monthlyLimit}`);
    }
  }

  async validateBetAmount(userId: string, amount: number): Promise<{ valid: boolean; reason?: string }> {
    const limits = await this.getUserBettingLimits(userId);

    if (amount < limits.minBet) {
      return { valid: false, reason: `Minimum bet is ${limits.minBet}` };
    }

    if (amount > limits.maxBet) {
      return { valid: false, reason: `Maximum bet is ${limits.maxBet}` };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [dailyTotal, weeklyTotal, monthlyTotal] = await Promise.all([
      this.prisma.bet.aggregate({
        where: {
          userId,
          placedAt: { gte: today },
        },
        _sum: { stake: true },
      }),
      this.prisma.bet.aggregate({
        where: {
          userId,
          placedAt: { gte: startOfWeek },
        },
        _sum: { stake: true },
      }),
      this.prisma.bet.aggregate({
        where: {
          userId,
          placedAt: { gte: startOfMonth },
        },
        _sum: { stake: true },
      }),
    ]);

    const dailySum = Number(dailyTotal._sum.stake || 0) + amount;
    const weeklySum = Number(weeklyTotal._sum.stake || 0) + amount;
    const monthlySum = Number(monthlyTotal._sum.stake || 0) + amount;

    if (dailySum > limits.dailyLimit) {
      return { valid: false, reason: `Daily limit of ${limits.dailyLimit} would be exceeded` };
    }

    if (weeklySum > limits.weeklyLimit) {
      return { valid: false, reason: `Weekly limit of ${limits.weeklyLimit} would be exceeded` };
    }

    if (monthlySum > limits.monthlyLimit) {
      return { valid: false, reason: `Monthly limit of ${limits.monthlyLimit} would be exceeded` };
    }

    return { valid: true };
  }

  async getUserBettingStats(userId: string) {
    const limits = await this.getUserBettingLimits(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [dailyTotal, weeklyTotal, monthlyTotal] = await Promise.all([
      this.prisma.bet.aggregate({
        where: { userId, placedAt: { gte: today } },
        _sum: { stake: true },
      }),
      this.prisma.bet.aggregate({
        where: { userId, placedAt: { gte: startOfWeek } },
        _sum: { stake: true },
      }),
      this.prisma.bet.aggregate({
        where: { userId, placedAt: { gte: startOfMonth } },
        _sum: { stake: true },
      }),
    ]);

    return {
      limits,
      usage: {
        daily: {
          used: Number(dailyTotal._sum.stake || 0),
          remaining: limits.dailyLimit - Number(dailyTotal._sum.stake || 0),
        },
        weekly: {
          used: Number(weeklyTotal._sum.stake || 0),
          remaining: limits.weeklyLimit - Number(weeklyTotal._sum.stake || 0),
        },
        monthly: {
          used: Number(monthlyTotal._sum.stake || 0),
          remaining: limits.monthlyLimit - Number(monthlyTotal._sum.stake || 0),
        },
      },
    };
  }
}
