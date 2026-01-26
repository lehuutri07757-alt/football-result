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
exports.BettingLimitsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const DEFAULT_BETTING_LIMITS = {
    minBet: 10000,
    maxBet: 10000000,
    dailyLimit: 100000000,
    weeklyLimit: 500000000,
    monthlyLimit: 2000000000,
};
let BettingLimitsService = class BettingLimitsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserBettingLimits(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { agent: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const userLimits = user.bettingLimits;
        if (userLimits && Object.keys(userLimits).length > 0) {
            return { ...DEFAULT_BETTING_LIMITS, ...userLimits };
        }
        if (user.agentId) {
            const agentLimits = await this.getAgentBettingLimits(user.agentId);
            return agentLimits;
        }
        return DEFAULT_BETTING_LIMITS;
    }
    async getAgentBettingLimits(agentId) {
        const agent = await this.prisma.agent.findUnique({
            where: { id: agentId },
            include: { parent: true },
        });
        if (!agent) {
            throw new common_1.NotFoundException('Agent not found');
        }
        const agentLimits = agent.bettingLimits;
        if (agentLimits && Object.keys(agentLimits).length > 0) {
            return { ...DEFAULT_BETTING_LIMITS, ...agentLimits };
        }
        if (agent.parentId) {
            return this.getAgentBettingLimits(agent.parentId);
        }
        return DEFAULT_BETTING_LIMITS;
    }
    async updateUserBettingLimits(userId, updateDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { agent: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.agentId) {
            const agentLimits = await this.getAgentBettingLimits(user.agentId);
            this.validateLimitsAgainstParent(updateDto, agentLimits);
        }
        const currentLimits = user.bettingLimits || {};
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
    async updateAgentBettingLimits(agentId, updateDto) {
        const agent = await this.prisma.agent.findUnique({
            where: { id: agentId },
            include: { parent: true },
        });
        if (!agent) {
            throw new common_1.NotFoundException('Agent not found');
        }
        if (agent.parentId) {
            const parentLimits = await this.getAgentBettingLimits(agent.parentId);
            this.validateLimitsAgainstParent(updateDto, parentLimits);
        }
        const currentLimits = agent.bettingLimits || {};
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
    validateLimitsAgainstParent(updateDto, parentLimits) {
        if (updateDto.maxBet && updateDto.maxBet > parentLimits.maxBet) {
            throw new common_1.BadRequestException(`Max bet cannot exceed parent limit of ${parentLimits.maxBet}`);
        }
        if (updateDto.dailyLimit && updateDto.dailyLimit > parentLimits.dailyLimit) {
            throw new common_1.BadRequestException(`Daily limit cannot exceed parent limit of ${parentLimits.dailyLimit}`);
        }
        if (updateDto.weeklyLimit && updateDto.weeklyLimit > parentLimits.weeklyLimit) {
            throw new common_1.BadRequestException(`Weekly limit cannot exceed parent limit of ${parentLimits.weeklyLimit}`);
        }
        if (updateDto.monthlyLimit && updateDto.monthlyLimit > parentLimits.monthlyLimit) {
            throw new common_1.BadRequestException(`Monthly limit cannot exceed parent limit of ${parentLimits.monthlyLimit}`);
        }
    }
    async validateBetAmount(userId, amount) {
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
    async getUserBettingStats(userId) {
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
};
exports.BettingLimitsService = BettingLimitsService;
exports.BettingLimitsService = BettingLimitsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BettingLimitsService);
//# sourceMappingURL=betting-limits.service.js.map