import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private usersService;
    private jwtService;
    private configService;
    private prisma;
    private settingsService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, prisma: PrismaService, settingsService: SettingsService);
    validateUser(username: string, password: string): Promise<{
        role: {
            name: string;
            description: string | null;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            code: string;
            permissions: import("@prisma/client/runtime/library").JsonValue;
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
    register(registerDto: RegisterDto): Promise<{
        role: {
            name: string;
            description: string | null;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            code: string;
            permissions: import("@prisma/client/runtime/library").JsonValue;
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
    login(user: any, ipAddress?: string, deviceInfo?: string): Promise<{
        user: {
            id: any;
            username: any;
            email: any;
            role: any;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    private parseUserAgent;
    private recordLoginHistory;
    recordFailedLogin(username: string, ipAddress?: string, userAgent?: string, reason?: string): Promise<void>;
    getLoginHistory(userId: string, limit?: number): Promise<{
        status: string;
        createdAt: Date;
        id: string;
        userId: string;
        browser: string | null;
        os: string | null;
        deviceType: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        deviceName: string | null;
        location: string | null;
        countryCode: string | null;
        failureReason: string | null;
    }[]>;
    private createRefreshToken;
    refreshTokens(refreshToken: string, ipAddress?: string, deviceInfo?: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(refreshToken: string): Promise<{
        message: string;
    }>;
    revokeAllUserTokens(userId: string): Promise<void>;
    getProfile(userId: string): Promise<{
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
    forgotPassword(email: string): Promise<{
        message: string;
        resetToken?: undefined;
    } | {
        message: string;
        resetToken: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
}
