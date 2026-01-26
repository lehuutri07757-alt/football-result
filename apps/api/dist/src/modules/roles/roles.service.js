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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const permissions_1 = require("./constants/permissions");
let RolesService = class RolesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.role.findMany({
            orderBy: { createdAt: 'asc' },
        });
    }
    async findById(id) {
        return this.prisma.role.findUnique({
            where: { id },
        });
    }
    async findByCode(code) {
        return this.prisma.role.findUnique({
            where: { code },
        });
    }
    async create(createRoleDto) {
        const existingName = await this.prisma.role.findUnique({
            where: { name: createRoleDto.name },
        });
        if (existingName) {
            throw new common_1.ConflictException('Role name already exists');
        }
        const existingCode = await this.findByCode(createRoleDto.code);
        if (existingCode) {
            throw new common_1.ConflictException('Role code already exists');
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
    async update(id, updateRoleDto) {
        const role = await this.findById(id);
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        if (updateRoleDto.name && updateRoleDto.name !== role.name) {
            const existingName = await this.prisma.role.findUnique({
                where: { name: updateRoleDto.name },
            });
            if (existingName) {
                throw new common_1.ConflictException('Role name already exists');
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
    async delete(id) {
        const role = await this.findById(id);
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        const usersWithRole = await this.prisma.user.count({
            where: { roleId: id },
        });
        if (usersWithRole > 0) {
            throw new common_1.ConflictException(`Cannot delete role. ${usersWithRole} users are assigned to this role.`);
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
                code: permissions_1.ROLE_CODES.SUPER_ADMIN,
                description: 'Full system access',
                permissions: permissions_1.DEFAULT_ROLE_PERMISSIONS[permissions_1.ROLE_CODES.SUPER_ADMIN],
            },
            {
                name: 'Master Agent',
                code: permissions_1.ROLE_CODES.MASTER_AGENT,
                description: 'Top level agent with full agent capabilities',
                permissions: permissions_1.DEFAULT_ROLE_PERMISSIONS[permissions_1.ROLE_CODES.MASTER_AGENT],
            },
            {
                name: 'Agent',
                code: permissions_1.ROLE_CODES.AGENT,
                description: 'Level 1 agent',
                permissions: permissions_1.DEFAULT_ROLE_PERMISSIONS[permissions_1.ROLE_CODES.AGENT],
            },
            {
                name: 'Sub Agent',
                code: permissions_1.ROLE_CODES.SUB_AGENT,
                description: 'Level 2 agent',
                permissions: permissions_1.DEFAULT_ROLE_PERMISSIONS[permissions_1.ROLE_CODES.SUB_AGENT],
            },
            {
                name: 'User',
                code: permissions_1.ROLE_CODES.USER,
                description: 'Regular player',
                permissions: permissions_1.DEFAULT_ROLE_PERMISSIONS[permissions_1.ROLE_CODES.USER],
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
    async getRoleUsers(roleId, page = 1, limit = 10) {
        const role = await this.findById(roleId);
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
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
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map