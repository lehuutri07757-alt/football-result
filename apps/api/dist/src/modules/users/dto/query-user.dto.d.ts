import { UserStatus } from '@prisma/client';
export declare class QueryUserDto {
    page?: number;
    limit?: number;
    search?: string;
    status?: UserStatus;
    roleId?: string;
    agentId?: string;
    sortBy?: 'createdAt' | 'username' | 'email';
    sortOrder?: 'asc' | 'desc';
}
