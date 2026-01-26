import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto';
import { Prisma } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<({
        role: {
            name: string;
            description: string | null;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            code: string;
            permissions: Prisma.JsonValue;
        } | null;
        agent: {
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
        wallet: {
            createdAt: Date;
            id: string;
            updatedAt: Date;
            realBalance: Prisma.Decimal;
            bonusBalance: Prisma.Decimal;
            pendingBalance: Prisma.Decimal;
            currency: string;
            userId: string;
        } | null;
    } & {
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
    }) | null>;
    findByUsername(username: string): Promise<({
        role: {
            name: string;
            description: string | null;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            code: string;
            permissions: Prisma.JsonValue;
        } | null;
    } & {
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
    }) | null>;
    findByEmail(email: string): Promise<({
        role: {
            name: string;
            description: string | null;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            code: string;
            permissions: Prisma.JsonValue;
        } | null;
    } & {
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
    }) | null>;
    create(data: {
        username: string;
        password: string;
        email?: string;
        phone?: string;
        firstName?: string;
        lastName?: string;
    }): Promise<{
        role: {
            name: string;
            description: string | null;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            code: string;
            permissions: Prisma.JsonValue;
        } | null;
        wallet: {
            createdAt: Date;
            id: string;
            updatedAt: Date;
            realBalance: Prisma.Decimal;
            bonusBalance: Prisma.Decimal;
            pendingBalance: Prisma.Decimal;
            currency: string;
            userId: string;
        } | null;
    } & {
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
    }>;
    createUser(createUserDto: CreateUserDto): Promise<{
        role: {
            name: string;
            description: string | null;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            code: string;
            permissions: Prisma.JsonValue;
        } | null;
        agent: {
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
        wallet: {
            createdAt: Date;
            id: string;
            updatedAt: Date;
            realBalance: Prisma.Decimal;
            bonusBalance: Prisma.Decimal;
            pendingBalance: Prisma.Decimal;
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
        bettingLimits: Prisma.JsonValue;
        createdAt: Date;
        id: string;
        avatarUrl: string | null;
        emailVerified: boolean;
        phoneVerified: boolean;
        lastLoginAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    findAllPaginated(query: QueryUserDto): Promise<{
        data: {
            role: {
                name: string;
                description: string | null;
                createdAt: Date;
                id: string;
                updatedAt: Date;
                code: string;
                permissions: Prisma.JsonValue;
            } | null;
            agent: {
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
            wallet: {
                createdAt: Date;
                id: string;
                updatedAt: Date;
                realBalance: Prisma.Decimal;
                bonusBalance: Prisma.Decimal;
                pendingBalance: Prisma.Decimal;
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
            bettingLimits: Prisma.JsonValue;
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
    findAll(params: {
        skip?: number;
        take?: number;
        status?: string;
    }): Promise<({
        role: {
            name: string;
            description: string | null;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            code: string;
            permissions: Prisma.JsonValue;
        } | null;
    } & {
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
    })[]>;
    updateUser(id: string, updateUserDto: UpdateUserDto): Promise<{
        role: {
            name: string;
            description: string | null;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            code: string;
            permissions: Prisma.JsonValue;
        } | null;
        agent: {
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
        wallet: {
            createdAt: Date;
            id: string;
            updatedAt: Date;
            realBalance: Prisma.Decimal;
            bonusBalance: Prisma.Decimal;
            pendingBalance: Prisma.Decimal;
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
        bettingLimits: Prisma.JsonValue;
        createdAt: Date;
        id: string;
        avatarUrl: string | null;
        emailVerified: boolean;
        phoneVerified: boolean;
        lastLoginAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    update(id: string, data: Partial<{
        firstName: string;
        lastName: string;
        phone: string;
    }>): Promise<{
        role: {
            name: string;
            description: string | null;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            code: string;
            permissions: Prisma.JsonValue;
        } | null;
    } & {
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
    }>;
    deleteUser(id: string): Promise<{
        message: string;
    }>;
    blockUser(id: string): Promise<{
        role: {
            name: string;
            description: string | null;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            code: string;
            permissions: Prisma.JsonValue;
        } | null;
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
        avatarUrl: string | null;
        emailVerified: boolean;
        phoneVerified: boolean;
        lastLoginAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    unblockUser(id: string): Promise<{
        role: {
            name: string;
            description: string | null;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            code: string;
            permissions: Prisma.JsonValue;
        } | null;
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
        avatarUrl: string | null;
        emailVerified: boolean;
        phoneVerified: boolean;
        lastLoginAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    suspendUser(id: string): Promise<{
        role: {
            name: string;
            description: string | null;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            code: string;
            permissions: Prisma.JsonValue;
        } | null;
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
        avatarUrl: string | null;
        emailVerified: boolean;
        phoneVerified: boolean;
        lastLoginAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    getUserStats(id: string): Promise<{
        totalBets: number;
        totalStake: number | Prisma.Decimal;
        totalWins: number | Prisma.Decimal;
    }>;
}
