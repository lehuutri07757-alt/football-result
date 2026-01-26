import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
    login(req: any, loginDto: LoginDto, ip: string, userAgent: string): Promise<{
        user: {
            id: any;
            username: any;
            email: any;
            role: any;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(refreshTokenDto: RefreshTokenDto, ip: string, userAgent: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(refreshTokenDto: RefreshTokenDto): Promise<{
        message: string;
    }>;
    getProfile(req: any): Promise<{
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
    getLoginHistory(req: any): Promise<{
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
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
        resetToken?: undefined;
    } | {
        message: string;
        resetToken: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(req: any, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
