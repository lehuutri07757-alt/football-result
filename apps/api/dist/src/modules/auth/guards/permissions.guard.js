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
exports.PermissionsGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../../prisma/prisma.service");
const permissions_decorator_1 = require("../decorators/permissions.decorator");
const permissions_1 = require("../../roles/constants/permissions");
let PermissionsGuard = class PermissionsGuard {
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const requiredPermissions = this.reflector.getAllAndOverride(permissions_decorator_1.PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const roleCodeFromContext = user?.role?.code;
        const permissionsFromContext = Array.isArray(user?.permissions)
            ? user.permissions
            : Array.isArray(user?.role?.permissions)
                ? user.role.permissions
                : [];
        if (roleCodeFromContext === permissions_1.ROLE_CODES.SUPER_ADMIN) {
            return true;
        }
        if (permissionsFromContext.length > 0) {
            const hasAllPermissions = requiredPermissions.every(permission => permissionsFromContext.includes(permission));
            if (!hasAllPermissions) {
                throw new common_1.ForbiddenException('Insufficient permissions');
            }
            return true;
        }
        const dbUser = await this.prisma.user.findUnique({
            where: { id: user.sub },
            include: { role: true },
        });
        if (!dbUser || !dbUser.role) {
            throw new common_1.ForbiddenException('User role not found');
        }
        if (dbUser.role.code === permissions_1.ROLE_CODES.SUPER_ADMIN) {
            return true;
        }
        const userPermissions = dbUser.role.permissions;
        const hasAllPermissions = requiredPermissions.every(permission => userPermissions.includes(permission));
        if (!hasAllPermissions) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        return true;
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map