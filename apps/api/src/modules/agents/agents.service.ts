import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAgentDto, UpdateAgentDto, QueryAgentDto } from './dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ROLE_CODES } from '../roles/constants/permissions';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  private generateAgentCode(level: number): string {
    const prefix = level === 1 ? 'MA' : level === 2 ? 'AG' : 'SA';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${random}`;
  }

  async findAll(query: QueryAgentDto) {
    const { page = 1, limit = 10, search, level, status, parentId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AgentWhereInput = {
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

  async findById(id: string) {
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

  async findByUserId(userId: string) {
    return this.prisma.agent.findUnique({
      where: { userId },
      include: {
        user: true,
        parent: true,
        children: true,
      },
    });
  }

  async create(createAgentDto: CreateAgentDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { username: createAgentDto.username },
    });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    if (createAgentDto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: createAgentDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    let level = 1;
    let parentAgent = null;

    if (createAgentDto.parentId) {
      parentAgent = await this.findById(createAgentDto.parentId);
      if (!parentAgent) {
        throw new NotFoundException('Parent agent not found');
      }
      if (parentAgent.level >= 3) {
        throw new BadRequestException('Cannot create agent under level 3 agent');
      }
      level = parentAgent.level + 1;
    }

    const roleCode = level === 1 ? ROLE_CODES.MASTER_AGENT : 
                     level === 2 ? ROLE_CODES.AGENT : ROLE_CODES.SUB_AGENT;
    
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

  async update(id: string, updateAgentDto: UpdateAgentDto) {
    const agent = await this.findById(id);
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return this.prisma.agent.update({
      where: { id },
      data: {
        commissionRate: updateAgentDto.commissionRate,
        status: updateAgentDto.status,
        bettingLimits: updateAgentDto.bettingLimits as any,
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

  async delete(id: string) {
    const agent = await this.findById(id);
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const childrenCount = await this.prisma.agent.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      throw new BadRequestException('Cannot delete agent with sub-agents');
    }

    const downlineCount = await this.prisma.user.count({
      where: { agentId: id },
    });

    if (downlineCount > 0) {
      throw new BadRequestException('Cannot delete agent with downline users');
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

  async getAgentTree(id: string) {
    const agent = await this.findById(id);
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const buildTree = async (agentId: string, depth: number = 0): Promise<any> => {
      if (depth > 5) return null;

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

      if (!currentAgent) return null;

      const childrenTrees = await Promise.all(
        currentAgent.children.map(child => buildTree(child.id, depth + 1))
      );

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

  async getDownlineUsers(id: string, page: number = 1, limit: number = 10) {
    const agent = await this.findById(id);
    if (!agent) {
      throw new NotFoundException('Agent not found');
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

  async getAgentStats(id: string) {
    const agent = await this.findById(id);
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const [
      directDownlineCount,
      totalChildAgents,
      totalBetsFromDownline,
      totalStakeFromDownline,
    ] = await Promise.all([
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
}
