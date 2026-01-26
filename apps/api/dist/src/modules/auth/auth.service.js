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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const users_service_1 = require("../users/users.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const settings_service_1 = require("../settings/settings.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService, prisma, settingsService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.prisma = prisma;
        this.settingsService = settingsService;
    }
    async validateUser(username, password) {
        const user = await this.usersService.findByUsername(username);
        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }
    async register(registerDto) {
        const isRegistrationEnabled = await this.settingsService.isRegistrationEnabled();
        if (!isRegistrationEnabled) {
            throw new common_1.ForbiddenException('Registration is currently disabled');
        }
        const existingUser = await this.usersService.findByUsername(registerDto.username);
        if (existingUser) {
            throw new common_1.ConflictException('Username already exists');
        }
        if (registerDto.email) {
            const existingEmail = await this.usersService.findByEmail(registerDto.email);
            if (existingEmail) {
                throw new common_1.ConflictException('Email already exists');
            }
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.usersService.create({
            ...registerDto,
            password: hashedPassword,
        });
        const { passwordHash, ...result } = user;
        return result;
    }
    async login(user, ipAddress, deviceInfo) {
        const payload = { sub: user.id };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = await this.createRefreshToken(user.id, ipAddress, deviceInfo);
        await this.recordLoginHistory(user.id, ipAddress, deviceInfo, 'success');
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
            accessToken,
            refreshToken,
        };
    }
    parseUserAgent(userAgent) {
        if (!userAgent)
            return { browser: null, os: null, deviceType: null };
        let browser = 'Unknown';
        let os = 'Unknown';
        let deviceType = 'desktop';
        if (userAgent.includes('Chrome'))
            browser = 'Chrome';
        else if (userAgent.includes('Firefox'))
            browser = 'Firefox';
        else if (userAgent.includes('Safari'))
            browser = 'Safari';
        else if (userAgent.includes('Edge'))
            browser = 'Edge';
        if (userAgent.includes('Windows'))
            os = 'Windows';
        else if (userAgent.includes('Mac'))
            os = 'macOS';
        else if (userAgent.includes('Linux'))
            os = 'Linux';
        else if (userAgent.includes('Android')) {
            os = 'Android';
            deviceType = 'mobile';
        }
        else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
            os = 'iOS';
            deviceType = 'mobile';
        }
        return { browser, os, deviceType };
    }
    async recordLoginHistory(userId, ipAddress, userAgent, status = 'success', failureReason) {
        const { browser, os, deviceType } = this.parseUserAgent(userAgent);
        await this.prisma.loginHistory.create({
            data: {
                userId,
                ipAddress,
                userAgent,
                browser,
                os,
                deviceType,
                status,
                failureReason,
            },
        });
    }
    async recordFailedLogin(username, ipAddress, userAgent, reason) {
        const user = await this.usersService.findByUsername(username);
        if (user) {
            await this.recordLoginHistory(user.id, ipAddress, userAgent, 'failed', reason);
        }
    }
    async getLoginHistory(userId, limit = 10) {
        return this.prisma.loginHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async createRefreshToken(userId, ipAddress, deviceInfo) {
        const token = crypto.randomBytes(64).toString('hex');
        const expiresInDays = parseInt(this.configService.get('REFRESH_TOKEN_EXPIRES_DAYS') || '30');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        await this.prisma.refreshToken.create({
            data: {
                userId,
                token,
                ipAddress,
                deviceInfo,
                expiresAt,
            },
        });
        return token;
    }
    async refreshTokens(refreshToken, ipAddress, deviceInfo) {
        const tokenRecord = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });
        if (!tokenRecord) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (tokenRecord.revokedAt) {
            throw new common_1.UnauthorizedException('Refresh token has been revoked');
        }
        if (new Date() > tokenRecord.expiresAt) {
            throw new common_1.UnauthorizedException('Refresh token has expired');
        }
        await this.prisma.refreshToken.update({
            where: { id: tokenRecord.id },
            data: { revokedAt: new Date() },
        });
        const user = await this.usersService.findById(tokenRecord.userId);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const payload = { sub: user.id };
        const newAccessToken = this.jwtService.sign(payload);
        const newRefreshToken = await this.createRefreshToken(user.id, ipAddress, deviceInfo);
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }
    async logout(refreshToken) {
        const tokenRecord = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });
        if (tokenRecord && !tokenRecord.revokedAt) {
            await this.prisma.refreshToken.update({
                where: { id: tokenRecord.id },
                data: { revokedAt: new Date() },
            });
        }
        return { message: 'Logged out successfully' };
    }
    async revokeAllUserTokens(userId) {
        await this.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async getProfile(userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const { passwordHash, ...result } = user;
        return result;
    }
    async forgotPassword(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return { message: 'If email exists, reset link has been sent' };
        }
        await this.prisma.passwordResetToken.updateMany({
            where: { userId: user.id, usedAt: null },
            data: { usedAt: new Date() },
        });
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        await this.prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
            },
        });
        return {
            message: 'If email exists, reset link has been sent',
            resetToken: token,
        };
    }
    async resetPassword(token, newPassword) {
        const tokenRecord = await this.prisma.passwordResetToken.findUnique({
            where: { token },
        });
        if (!tokenRecord) {
            throw new common_1.BadRequestException('Invalid reset token');
        }
        if (tokenRecord.usedAt) {
            throw new common_1.BadRequestException('Reset token has already been used');
        }
        if (new Date() > tokenRecord.expiresAt) {
            throw new common_1.BadRequestException('Reset token has expired');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: tokenRecord.userId },
                data: { passwordHash: hashedPassword },
            }),
            this.prisma.passwordResetToken.update({
                where: { id: tokenRecord.id },
                data: { usedAt: new Date() },
            }),
        ]);
        await this.revokeAllUserTokens(tokenRecord.userId);
        return { message: 'Password has been reset successfully' };
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: hashedPassword },
        });
        await this.revokeAllUserTokens(userId);
        return { message: 'Password changed successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService,
        settings_service_1.SettingsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map