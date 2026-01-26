import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { QueryUserDto, UpdateUserDto } from '../users/dto';
export declare class AdminController {
    private adminService;
    private usersService;
    constructor(adminService: AdminService, usersService: UsersService);
    getStats(): Promise<{
        totalUsers: number;
        totalRevenue: number;
        totalBets: number;
        pendingDeposits: number;
        pendingWithdrawals: number;
        activeMatches: number;
        todayBets: number;
        todayRevenue: number;
    }>;
    getUsers(query: QueryUserDto): Promise<{
        data: {
            role: {
                name: string;
                description: string | null;
                createdAt: Date;
                id: string;
                updatedAt: Date;
                code: string;
                permissions: import("@prisma/client/runtime/library").JsonValue;
            } | null;
            agent: {
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
            } | null;
            wallet: {
                createdAt: Date;
                id: string;
                updatedAt: Date;
                realBalance: import("@prisma/client/runtime/library").Decimal;
                bonusBalance: import("@prisma/client/runtime/library").Decimal;
                pendingBalance: import("@prisma/client/runtime/library").Decimal;
                currency: string;
                userId: string;
            } | null;
            username: string;
            email: string | null;
            phone: string | null;
            firstName: string | null;
            lastName: string | null;
            roleId: string | null;
            agentId: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
            bettingLimits: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
            id: string;
            avatarUrl: string | null;
            emailVerified: boolean;
            phoneVerified: boolean;
            lastLoginAt: Date | null;
            updatedAt: Date;
            deletedAt: Date | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getUser(id: string): Promise<{
        role: {
            name: string;
            description: string | null;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            code: string;
            permissions: import("@prisma/client/runtime/library").JsonValue;
        } | null;
        agent: {
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
        } | null;
        wallet: {
            createdAt: Date;
            id: string;
            updatedAt: Date;
            realBalance: import("@prisma/client/runtime/library").Decimal;
            bonusBalance: import("@prisma/client/runtime/library").Decimal;
            pendingBalance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            userId: string;
        } | null;
        username: string;
        email: string | null;
        phone: string | null;
        firstName: string | null;
        lastName: string | null;
        roleId: string | null;
        agentId: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        bettingLimits: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        id: string;
        avatarUrl: string | null;
        emailVerified: boolean;
        phoneVerified: boolean;
        lastLoginAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
    } | null>;
    updateUser(id: string, updateUserDto: UpdateUserDto): Promise<{
        role: {
            name: string;
            description: string | null;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            code: string;
            permissions: import("@prisma/client/runtime/library").JsonValue;
        } | null;
        agent: {
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
        } | null;
        wallet: {
            createdAt: Date;
            id: string;
            updatedAt: Date;
            realBalance: import("@prisma/client/runtime/library").Decimal;
            bonusBalance: import("@prisma/client/runtime/library").Decimal;
            pendingBalance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            userId: string;
        } | null;
        username: string;
        email: string | null;
        phone: string | null;
        firstName: string | null;
        lastName: string | null;
        roleId: string | null;
        agentId: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        bettingLimits: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        id: string;
        avatarUrl: string | null;
        emailVerified: boolean;
        phoneVerified: boolean;
        lastLoginAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    updateUserStatus(id: string, body: {
        status: string;
    }): Promise<{
        role: {
            name: string;
            description: string | null;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            code: string;
            permissions: import("@prisma/client/runtime/library").JsonValue;
        } | null;
        agent: {
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
        } | null;
        wallet: {
            createdAt: Date;
            id: string;
            updatedAt: Date;
            realBalance: import("@prisma/client/runtime/library").Decimal;
            bonusBalance: import("@prisma/client/runtime/library").Decimal;
            pendingBalance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            userId: string;
        } | null;
        username: string;
        email: string | null;
        phone: string | null;
        firstName: string | null;
        lastName: string | null;
        roleId: string | null;
        agentId: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        bettingLimits: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        id: string;
        avatarUrl: string | null;
        emailVerified: boolean;
        phoneVerified: boolean;
        lastLoginAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    adjustBalance(id: string, body: {
        amount: number;
        type: 'add' | 'subtract';
        balanceType: 'real' | 'bonus';
        reason: string;
    }): Promise<{
        createdAt: Date;
        id: string;
        updatedAt: Date;
        realBalance: import("@prisma/client/runtime/library").Decimal;
        bonusBalance: import("@prisma/client/runtime/library").Decimal;
        pendingBalance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        userId: string;
    }>;
}
