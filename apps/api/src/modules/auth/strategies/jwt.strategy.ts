import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const userId = payload?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== UserStatus.active) {
      throw new ForbiddenException('User is not active');
    }

    const permissions = Array.isArray(user.role?.permissions)
      ? (user.role?.permissions as string[])
      : [];

    return {
      sub: user.id,
      id: user.id,
      username: user.username,
      role: user.role
        ? {
            id: user.role.id,
            code: user.role.code,
            name: user.role.name,
            permissions,
          }
        : null,
      permissions,
    };
  }
}
