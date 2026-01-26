import { UserStatus } from '@prisma/client';
export declare class CreateUserDto {
    username: string;
    email?: string;
    phone?: string;
    password: string;
    firstName?: string;
    lastName?: string;
    roleId?: string;
    agentId?: string;
    status?: UserStatus;
}
