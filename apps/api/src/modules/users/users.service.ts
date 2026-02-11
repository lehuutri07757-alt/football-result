import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto';
import { Prisma, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: true, wallet: true, agent: true },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async create(data: {
    username: string;
    password: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  }) {
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

  async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.findByUsername(createUserDto.username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    if (createUserDto.email) {
      const existingEmail = await this.findByEmail(createUserDto.email);
      if (existingEmail) {
        throw new ConflictException('Email already exists');
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
        status: createUserDto.status || UserStatus.active,
        wallet: {
          create: {},
        },
      },
      include: { role: true, wallet: true, agent: true },
    });

    const { passwordHash, ...result } = user;
    return result;
  }

  async findAllPaginated(query: QueryUserDto) {
    const { page = 1, limit = 10, search, status, roleId, agentId, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
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

  async findAll(params: { skip?: number; take?: number; status?: string }) {
    const { skip = 0, take = 10, status } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      where: status ? { status: status as any } : undefined,
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.findByEmail(updateUserDto.email);
      if (existingEmail) {
        throw new ConflictException('Email already exists');
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
        bettingLimits: updateUserDto.bettingLimits as any,
      },
      include: { role: true, wallet: true, agent: true },
    });

    const { passwordHash, ...result } = updated;
    return result;
  }

  async update(id: string, data: Partial<{ firstName: string; lastName: string; phone: string }>) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });
  }

  async deleteUser(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'User deleted successfully' };
  }

  async blockUser(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.blocked },
      include: { role: true },
    });

    const { passwordHash, ...result } = updated;
    return result;
  }

  async unblockUser(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.active },
      include: { role: true },
    });

    const { passwordHash, ...result } = updated;
    return result;
  }

  async suspendUser(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.suspended },
      include: { role: true },
    });

    const { passwordHash, ...result } = updated;
    return result;
  }

  async getUserStats(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
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

  async adminResetPassword(id: string, newPassword: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: hashedPassword },
    });

    return { message: 'Password reset successfully' };
  }
}
