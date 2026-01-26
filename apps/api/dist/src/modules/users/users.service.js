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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
            include: { role: true, wallet: true, agent: true },
        });
    }
    async findByUsername(username) {
        return this.prisma.user.findUnique({
            where: { username },
            include: { role: true },
        });
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
            include: { role: true },
        });
    }
    async create(data) {
        const user = await this.prisma.user.create({
            data: {
                username: data.username,
                passwordHash: data.password,
                email: data.email,
                phone: data.phone,
                firstName: data.firstName,
                lastName: data.lastName,
                wallet: {
                    create: {},
                },
            },
            include: { role: true, wallet: true },
        });
        return user;
    }
    async createUser(createUserDto) {
        const existingUser = await this.findByUsername(createUserDto.username);
        if (existingUser) {
            throw new common_1.ConflictException('Username already exists');
        }
        if (createUserDto.email) {
            const existingEmail = await this.findByEmail(createUserDto.email);
            if (existingEmail) {
                throw new common_1.ConflictException('Email already exists');
            }
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                username: createUserDto.username,
                passwordHash: hashedPassword,
                email: createUserDto.email,
                phone: createUserDto.phone,
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                roleId: createUserDto.roleId,
                agentId: createUserDto.agentId,
                status: createUserDto.status || client_1.UserStatus.active,
                wallet: {
                    create: {},
                },
            },
            include: { role: true, wallet: true, agent: true },
        });
        const { passwordHash, ...result } = user;
        return result;
    }
    async findAllPaginated(query) {
        const { page = 1, limit = 10, search, status, roleId, agentId, sortBy = 'createdAt', sortOrder = 'desc' } = query;
        const skip = (page - 1) * limit;
        const where = {
            deletedAt: null,
            ...(status && { status }),
            ...(roleId && { roleId }),
            ...(agentId && { agentId }),
            ...(search && {
                OR: [
                    { username: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take: limit,
                where,
                include: { role: true, wallet: true, agent: true },
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.user.count({ where }),
        ]);
        const usersWithoutPassword = users.map(({ passwordHash, ...user }) => user);
        return {
            data: usersWithoutPassword,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findAll(params) {
        const { skip = 0, take = 10, status } = params;
        return this.prisma.user.findMany({
            skip,
            take,
            where: status ? { status: status } : undefined,
            include: { role: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateUser(id, updateUserDto) {
        const user = await this.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingEmail = await this.findByEmail(updateUserDto.email);
            if (existingEmail) {
                throw new common_1.ConflictException('Email already exists');
            }
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                email: updateUserDto.email,
                phone: updateUserDto.phone,
                firstName: updateUserDto.firstName,
                lastName: updateUserDto.lastName,
                roleId: updateUserDto.roleId,
                agentId: updateUserDto.agentId,
                status: updateUserDto.status,
                bettingLimits: updateUserDto.bettingLimits,
            },
            include: { role: true, wallet: true, agent: true },
        });
        const { passwordHash, ...result } = updated;
        return result;
    }
    async update(id, data) {
        return this.prisma.user.update({
            where: { id },
            data,
            include: { role: true },
        });
    }
    async deleteUser(id) {
        const user = await this.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return { message: 'User deleted successfully' };
    }
    async blockUser(id) {
        const user = await this.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: { status: client_1.UserStatus.blocked },
            include: { role: true },
        });
        const { passwordHash, ...result } = updated;
        return result;
    }
    async unblockUser(id) {
        const user = await this.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: { status: client_1.UserStatus.active },
            include: { role: true },
        });
        const { passwordHash, ...result } = updated;
        return result;
    }
    async suspendUser(id) {
        const user = await this.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: { status: client_1.UserStatus.suspended },
            include: { role: true },
        });
        const { passwordHash, ...result } = updated;
        return result;
    }
    async getUserStats(id) {
        const user = await this.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const [betsCount, totalStake, totalWins] = await Promise.all([
            this.prisma.bet.count({ where: { userId: id } }),
            this.prisma.bet.aggregate({
                where: { userId: id },
                _sum: { stake: true },
            }),
            this.prisma.bet.aggregate({
                where: { userId: id, status: 'won' },
                _sum: { actualWin: true },
            }),
        ]);
        return {
            totalBets: betsCount,
            totalStake: totalStake._sum.stake || 0,
            totalWins: totalWins._sum.actualWin || 0,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map