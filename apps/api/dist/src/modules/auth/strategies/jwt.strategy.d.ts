import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: any): Promise<{
        sub: string;
        id: string;
        username: string;
        role: {
            id: string;
            code: string;
            name: string;
            permissions: string[];
        } | null;
        permissions: string[];
    }>;
}
export {};
