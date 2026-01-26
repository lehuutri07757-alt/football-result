import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLE_CODES } from '../../roles/constants/permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const roleCodeFromContext = user?.role?.code;
    const permissionsFromContext = Array.isArray(user?.permissions)
      ? (user.permissions as string[])
      : Array.isArray(user?.role?.permissions)
        ? (user.role.permissions as string[])
        : [];

    if (roleCodeFromContext === ROLE_CODES.SUPER_ADMIN) {
      return true;
    }

    if (permissionsFromContext.length > 0) {
      const hasAllPermissions = requiredPermissions.every(permission =>
        permissionsFromContext.includes(permission)
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException('Insufficient permissions');
      }

      return true;
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      include: { role: true },
    });

    if (!dbUser || !dbUser.role) {
      throw new ForbiddenException('User role not found');
    }

    if (dbUser.role.code === ROLE_CODES.SUPER_ADMIN) {
      return true;
    }

    const userPermissions = dbUser.role.permissions as string[];
    const hasAllPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
