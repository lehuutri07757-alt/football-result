import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';
export declare class RolesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        name: string;
        description: string | null;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        code: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    findById(id: string): Promise<{
        name: string;
        description: string | null;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        code: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
    } | null>;
    findByCode(code: string): Promise<{
        name: string;
        description: string | null;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        code: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
    } | null>;
    create(createRoleDto: CreateRoleDto): Promise<{
        name: string;
        description: string | null;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        code: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
    }>;
    update(id: string, updateRoleDto: UpdateRoleDto): Promise<{
        name: string;
        description: string | null;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        code: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
    seedDefaultRoles(): Promise<{
        message: string;
    }>;
    getRoleUsers(roleId: string, page?: number, limit?: number): Promise<{
        data: {
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
}
