import { PrismaService } from '../../prisma/prisma.service';
import { CreateAgentDto, UpdateAgentDto, QueryAgentDto } from './dto';
import { Prisma } from '@prisma/client';
export declare class AgentsService {
    private prisma;
    constructor(prisma: PrismaService);
    private generateAgentCode;
    findAll(query: QueryAgentDto): Promise<{
        data: ({
            user: {
                username: string;
                email: string | null;
                phone: string | null;
                firstName: string | null;
                lastName: string | null;
                status: import("@prisma/client").$Enums.UserStatus;
                createdAt: Date;
                id: string;
            };
            _count: {
                children: number;
                downlineUsers: number;
            };
            parent: ({
                user: {
                    username: string;
                };
            } & {
                status: string;
                bettingLimits: Prisma.JsonValue;
                createdAt: Date;
                id: string;
                updatedAt: Date;
                userId: string;
                parentId: string | null;
                level: number;
                agentCode: string;
                commissionRate: Prisma.Decimal;
            }) | null;
        } & {
            status: string;
            bettingLimits: Prisma.JsonValue;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            userId: string;
            parentId: string | null;
            level: number;
            agentCode: string;
            commissionRate: Prisma.Decimal;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findById(id: string): Promise<({
        user: {
            username: string;
            email: string | null;
            phone: string | null;
            firstName: string | null;
            lastName: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
            createdAt: Date;
            id: string;
        };
        _count: {
            children: number;
            downlineUsers: number;
        };
        parent: ({
            user: {
                username: string;
            };
        } & {
            status: string;
            bettingLimits: Prisma.JsonValue;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            userId: string;
            parentId: string | null;
            level: number;
            agentCode: string;
            commissionRate: Prisma.Decimal;
        }) | null;
        children: ({
            user: {
                username: string;
                email: string | null;
            };
        } & {
            status: string;
            bettingLimits: Prisma.JsonValue;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            userId: string;
            parentId: string | null;
            level: number;
            agentCode: string;
            commissionRate: Prisma.Decimal;
        })[];
    } & {
        status: string;
        bettingLimits: Prisma.JsonValue;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        userId: string;
        parentId: string | null;
        level: number;
        agentCode: string;
        commissionRate: Prisma.Decimal;
    }) | null>;
    findByUserId(userId: string): Promise<({
        user: {
            username: string;
            email: string | null;
            phone: string | null;
            firstName: string | null;
            lastName: string | null;
            roleId: string | null;
            agentId: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
            bettingLimits: Prisma.JsonValue;
            createdAt: Date;
            id: string;
            passwordHash: string;
            avatarUrl: string | null;
            emailVerified: boolean;
            phoneVerified: boolean;
            lastLoginAt: Date | null;
            updatedAt: Date;
            deletedAt: Date | null;
        };
        parent: {
            status: string;
            bettingLimits: Prisma.JsonValue;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            userId: string;
            parentId: string | null;
            level: number;
            agentCode: string;
            commissionRate: Prisma.Decimal;
        } | null;
        children: {
            status: string;
            bettingLimits: Prisma.JsonValue;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            userId: string;
            parentId: string | null;
            level: number;
            agentCode: string;
            commissionRate: Prisma.Decimal;
        }[];
    } & {
        status: string;
        bettingLimits: Prisma.JsonValue;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        userId: string;
        parentId: string | null;
        level: number;
        agentCode: string;
        commissionRate: Prisma.Decimal;
    }) | null>;
    create(createAgentDto: CreateAgentDto): Promise<{
        user: {
            username: string;
            email: string | null;
            firstName: string | null;
            lastName: string | null;
            id: string;
        };
        parent: ({
            user: {
                username: string;
            };
        } & {
            status: string;
            bettingLimits: Prisma.JsonValue;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            userId: string;
            parentId: string | null;
            level: number;
            agentCode: string;
            commissionRate: Prisma.Decimal;
        }) | null;
    } & {
        status: string;
        bettingLimits: Prisma.JsonValue;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        userId: string;
        parentId: string | null;
        level: number;
        agentCode: string;
        commissionRate: Prisma.Decimal;
    }>;
    update(id: string, updateAgentDto: UpdateAgentDto): Promise<{
        user: {
            username: string;
            email: string | null;
            firstName: string | null;
            lastName: string | null;
            id: string;
        };
    } & {
        status: string;
        bettingLimits: Prisma.JsonValue;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        userId: string;
        parentId: string | null;
        level: number;
        agentCode: string;
        commissionRate: Prisma.Decimal;
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
    getAgentTree(id: string): Promise<any>;
    getDownlineUsers(id: string, page?: number, limit?: number): Promise<{
        data: {
            wallet: {
                realBalance: Prisma.Decimal;
                bonusBalance: Prisma.Decimal;
            } | null;
            username: string;
            email: string | null;
            firstName: string | null;
            lastName: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
            createdAt: Date;
            id: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getAgentStats(id: string): Promise<{
        directDownlineCount: number;
        totalChildAgents: number;
        totalBetsFromDownline: number;
        totalStakeFromDownline: number | Prisma.Decimal;
    }>;
}
