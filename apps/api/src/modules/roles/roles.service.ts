import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import { DEFAULT_ROLE_PERMISSIONS, ROLE_CODES } from './constants/permissions';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string) {
    return this.prisma.role.findUnique({
      where: { code },
    });
  }

  async create(createRoleDto: CreateRoleDto) {
    const existingName = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    });
    if (existingName) {
      throw new ConflictException('Role name already exists');
    }

    const existingCode = await this.findByCode(createRoleDto.code);
    if (existingCode) {
      throw new ConflictException('Role code already exists');
    }

    return this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        code: createRoleDto.code,
        description: createRoleDto.description,
        permissions: createRoleDto.permissions || [],
      },
    });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingName = await this.prisma.role.findUnique({
        where: { name: updateRoleDto.name },
      });
      if (existingName) {
        throw new ConflictException('Role name already exists');
      }
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: updateRoleDto.name,
        description: updateRoleDto.description,
        permissions: updateRoleDto.permissions,
      },
    });
  }

  async delete(id: string) {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const usersWithRole = await this.prisma.user.count({
      where: { roleId: id },
    });

    if (usersWithRole > 0) {
      throw new ConflictException(`Cannot delete role. ${usersWithRole} users are assigned to this role.`);
    }

    await this.prisma.role.delete({
      where: { id },
    });

    return { message: 'Role deleted successfully' };
  }

  async seedDefaultRoles() {
    const roles = [
      {
        name: 'Super Admin',
        code: ROLE_CODES.SUPER_ADMIN,
        description: 'Full system access',
        permissions: DEFAULT_ROLE_PERMISSIONS[ROLE_CODES.SUPER_ADMIN],
      },
      {
        name: 'Master Agent',
        code: ROLE_CODES.MASTER_AGENT,
        description: 'Top level agent with full agent capabilities',
        permissions: DEFAULT_ROLE_PERMISSIONS[ROLE_CODES.MASTER_AGENT],
      },
      {
        name: 'Agent',
        code: ROLE_CODES.AGENT,
        description: 'Level 1 agent',
        permissions: DEFAULT_ROLE_PERMISSIONS[ROLE_CODES.AGENT],
      },
      {
        name: 'Sub Agent',
        code: ROLE_CODES.SUB_AGENT,
        description: 'Level 2 agent',
        permissions: DEFAULT_ROLE_PERMISSIONS[ROLE_CODES.SUB_AGENT],
      },
      {
        name: 'User',
        code: ROLE_CODES.USER,
        description: 'Regular player',
        permissions: DEFAULT_ROLE_PERMISSIONS[ROLE_CODES.USER],
      },
    ];

    for (const role of roles) {
      await this.prisma.role.upsert({
        where: { code: role.code },
        update: {
          name: role.name,
          description: role.description,
          permissions: role.permissions,
        },
        create: role,
      });
    }

    return { message: 'Default roles seeded successfully' };
  }

  async getRoleUsers(roleId: string, page: number = 1, limit: number = 10) {
    const role = await this.findById(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { roleId, deletedAt: null },
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
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { roleId, deletedAt: null } }),
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
}
