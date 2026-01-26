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
exports.AgentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = require("bcrypt");
const permissions_1 = require("../roles/constants/permissions");
let AgentsService = class AgentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    generateAgentCode(level) {
        const prefix = level === 1 ? 'MA' : level === 2 ? 'AG' : 'SA';
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}${random}`;
    }
    async findAll(query) {
        const { page = 1, limit = 10, search, level, status, parentId } = query;
        const skip = (page - 1) * limit;
        const where = {
            ...(level && { level }),
            ...(status && { status }),
            ...(parentId && { parentId }),
            ...(search && {
                OR: [
                    { agentCode: { contains: search, mode: 'insensitive' } },
                    { user: { username: { contains: search, mode: 'insensitive' } } },
                    { user: { email: { contains: search, mode: 'insensitive' } } },
                ],
            }),
        };
        const [agents, total] = await Promise.all([
            this.prisma.agent.findMany({
                skip,
                take: limit,
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            status: true,
                            createdAt: true,
                        },
                    },
                    parent: {
                        include: {
                            user: {
                                select: { username: true },
                            },
                        },
                    },
                    _count: {
                        select: { children: true, downlineUsers: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.agent.count({ where }),
        ]);
        return {
            data: agents,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findById(id) {
        return this.prisma.agent.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        status: true,
                        createdAt: true,
                    },
                },
                parent: {
                    include: {
                        user: { select: { username: true } },
                    },
                },
                children: {
                    include: {
                        user: { select: { username: true, email: true } },
                    },
                },
                _count: {
                    select: { children: true, downlineUsers: true },
                },
            },
        });
    }
    async findByUserId(userId) {
        return this.prisma.agent.findUnique({
            where: { userId },
            include: {
                user: true,
                parent: true,
                children: true,
            },
        });
    }
    async create(createAgentDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { username: createAgentDto.username },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Username already exists');
        }
        if (createAgentDto.email) {
            const existingEmail = await this.prisma.user.findUnique({
                where: { email: createAgentDto.email },
            });
            if (existingEmail) {
                throw new common_1.ConflictException('Email already exists');
            }
        }
        let level = 1;
        let parentAgent = null;
        if (createAgentDto.parentId) {
            parentAgent = await this.findById(createAgentDto.parentId);
            if (!parentAgent) {
                throw new common_1.NotFoundException('Parent agent not found');
            }
            if (parentAgent.level >= 3) {
                throw new common_1.BadRequestException('Cannot create agent under level 3 agent');
            }
            level = parentAgent.level + 1;
        }
        const roleCode = level === 1 ? permissions_1.ROLE_CODES.MASTER_AGENT :
            level === 2 ? permissions_1.ROLE_CODES.AGENT : permissions_1.ROLE_CODES.SUB_AGENT;
        const role = await this.prisma.role.findUnique({
            where: { code: roleCode },
        });
        const hashedPassword = await bcrypt.hash(createAgentDto.password, 10);
        const agentCode = this.generateAgentCode(level);
        const result = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    username: createAgentDto.username,
                    passwordHash: hashedPassword,
                    email: createAgentDto.email,
                    phone: createAgentDto.phone,
                    firstName: createAgentDto.firstName,
                    lastName: createAgentDto.lastName,
                    roleId: role?.id,
                    wallet: {
                        create: {},
                    },
                },
            });
            const agent = await tx.agent.create({
                data: {
                    userId: user.id,
                    parentId: createAgentDto.parentId,
                    level,
                    agentCode,
                    commissionRate: createAgentDto.commissionRate || 0,
                    bettingLimits: createAgentDto.bettingLimits || {},
                },
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
                    parent: {
                        include: {
                            user: { select: { username: true } },
                        },
                    },
                },
            });
            return agent;
        });
        return result;
    }
    async update(id, updateAgentDto) {
        const agent = await this.findById(id);
        if (!agent) {
            throw new common_1.NotFoundException('Agent not found');
        }
        return this.prisma.agent.update({
            where: { id },
            data: {
                commissionRate: updateAgentDto.commissionRate,
                status: updateAgentDto.status,
                bettingLimits: updateAgentDto.bettingLimits,
            },
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
    }
    async delete(id) {
        const agent = await this.findById(id);
        if (!agent) {
            throw new common_1.NotFoundException('Agent not found');
        }
        const childrenCount = await this.prisma.agent.count({
            where: { parentId: id },
        });
        if (childrenCount > 0) {
            throw new common_1.BadRequestException('Cannot delete agent with sub-agents');
        }
        const downlineCount = await this.prisma.user.count({
            where: { agentId: id },
        });
        if (downlineCount > 0) {
            throw new common_1.BadRequestException('Cannot delete agent with downline users');
        }
        await this.prisma.$transaction([
            this.prisma.agent.delete({ where: { id } }),
            this.prisma.user.update({
                where: { id: agent.user.id },
                data: { deletedAt: new Date() },
            }),
        ]);
        return { message: 'Agent deleted successfully' };
    }
    async getAgentTree(id) {
        const agent = await this.findById(id);
        if (!agent) {
            throw new common_1.NotFoundException('Agent not found');
        }
        const buildTree = async (agentId, depth = 0) => {
            if (depth > 5)
                return null;
            const currentAgent = await this.prisma.agent.findUnique({
                where: { id: agentId },
                include: {
                    user: {
                        select: { username: true, email: true, firstName: true, lastName: true },
                    },
                    children: {
                        include: {
                            user: { select: { username: true } },
                        },
                    },
                    _count: { select: { downlineUsers: true } },
                },
            });
            if (!currentAgent)
                return null;
            const childrenTrees = await Promise.all(currentAgent.children.map(child => buildTree(child.id, depth + 1)));
            return {
                id: currentAgent.id,
                agentCode: currentAgent.agentCode,
                level: currentAgent.level,
                user: currentAgent.user,
                downlineUsersCount: currentAgent._count.downlineUsers,
                children: childrenTrees.filter(Boolean),
            };
        };
        return buildTree(id);
    }
    async getDownlineUsers(id, page = 1, limit = 10) {
        const agent = await this.findById(id);
        if (!agent) {
            throw new common_1.NotFoundException('Agent not found');
        }
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where: { agentId: id, deletedAt: null },
                skip,
                take: limit,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    status: true,
                    createdAt: true,
                    wallet: {
                        select: { realBalance: true, bonusBalance: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where: { agentId: id, deletedAt: null } }),
        ]);
        return {
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getAgentStats(id) {
        const agent = await this.findById(id);
        if (!agent) {
            throw new common_1.NotFoundException('Agent not found');
        }
        const [directDownlineCount, totalChildAgents, totalBetsFromDownline, totalStakeFromDownline,] = await Promise.all([
            this.prisma.user.count({ where: { agentId: id, deletedAt: null } }),
            this.prisma.agent.count({ where: { parentId: id } }),
            this.prisma.bet.count({
                where: { user: { agentId: id } },
            }),
            this.prisma.bet.aggregate({
                where: { user: { agentId: id } },
                _sum: { stake: true },
            }),
        ]);
        return {
            directDownlineCount,
            totalChildAgents,
            totalBetsFromDownline,
            totalStakeFromDownline: totalStakeFromDownline._sum.stake || 0,
        };
    }
};
exports.AgentsService = AgentsService;
exports.AgentsService = AgentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AgentsService);
//# sourceMappingURL=agents.service.js.map