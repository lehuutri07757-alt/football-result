import { AgentsService } from './agents.service';
import { CreateAgentDto, UpdateAgentDto, QueryAgentDto } from './dto';
export declare class AgentsController {
    private agentsService;
    constructor(agentsService: AgentsService);
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
                bettingLimits: import("@prisma/client/runtime/library").JsonValue;
                createdAt: Date;
                id: string;
                updatedAt: Date;
                userId: string;
                parentId: string | null;
                level: number;
                agentCode: string;
                commissionRate: import("@prisma/client/runtime/library").Decimal;
            }) | null;
        } & {
            status: string;
            bettingLimits: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            userId: string;
            parentId: string | null;
            level: number;
            agentCode: string;
            commissionRate: import("@prisma/client/runtime/library").Decimal;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
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
            bettingLimits: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            userId: string;
            parentId: string | null;
            level: number;
            agentCode: string;
            commissionRate: import("@prisma/client/runtime/library").Decimal;
        }) | null;
    } & {
        status: string;
        bettingLimits: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        userId: string;
        parentId: string | null;
        level: number;
        agentCode: string;
        commissionRate: import("@prisma/client/runtime/library").Decimal;
    }>;
    findOne(id: string): Promise<({
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
            bettingLimits: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            userId: string;
            parentId: string | null;
            level: number;
            agentCode: string;
            commissionRate: import("@prisma/client/runtime/library").Decimal;
        }) | null;
        children: ({
            user: {
                username: string;
                email: string | null;
            };
        } & {
            status: string;
            bettingLimits: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            userId: string;
            parentId: string | null;
            level: number;
            agentCode: string;
            commissionRate: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        status: string;
        bettingLimits: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        userId: string;
        parentId: string | null;
        level: number;
        agentCode: string;
        commissionRate: import("@prisma/client/runtime/library").Decimal;
    }) | null>;
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
        bettingLimits: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        userId: string;
        parentId: string | null;
        level: number;
        agentCode: string;
        commissionRate: import("@prisma/client/runtime/library").Decimal;
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
    getTree(id: string): Promise<any>;
    getDownline(id: string, page?: string, limit?: string): Promise<{
        data: {
            wallet: {
                realBalance: import("@prisma/client/runtime/library").Decimal;
                bonusBalance: import("@prisma/client/runtime/library").Decimal;
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
    getStats(id: string): Promise<{
        directDownlineCount: number;
        totalChildAgents: number;
        totalBetsFromDownline: number;
        totalStakeFromDownline: number | import("@prisma/client/runtime/library").Decimal;
    }>;
}
