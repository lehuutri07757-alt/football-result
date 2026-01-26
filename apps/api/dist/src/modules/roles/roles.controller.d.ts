import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';
export declare class RolesController {
    private rolesService;
    constructor(rolesService: RolesService);
    findAll(): Promise<{
        name: string;
        description: string | null;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        code: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    getPermissions(): Promise<{
        permissions: {
            readonly USERS: {
                readonly READ: "users.read";
                readonly CREATE: "users.create";
                readonly UPDATE: "users.update";
                readonly DELETE: "users.delete";
                readonly BLOCK: "users.block";
            };
            readonly AGENTS: {
                readonly READ: "agents.read";
                readonly CREATE: "agents.create";
                readonly UPDATE: "agents.update";
                readonly DELETE: "agents.delete";
                readonly MANAGE_DOWNLINE: "agents.manage_downline";
            };
            readonly ROLES: {
                readonly READ: "roles.read";
                readonly CREATE: "roles.create";
                readonly UPDATE: "roles.update";
                readonly DELETE: "roles.delete";
            };
            readonly BETS: {
                readonly READ: "bets.read";
                readonly MANAGE: "bets.manage";
                readonly SETTLE: "bets.settle";
                readonly VOID: "bets.void";
            };
            readonly MATCHES: {
                readonly READ: "matches.read";
                readonly CREATE: "matches.create";
                readonly UPDATE: "matches.update";
                readonly DELETE: "matches.delete";
                readonly MANAGE_ODDS: "matches.manage_odds";
            };
            readonly WALLET: {
                readonly READ: "wallet.read";
                readonly DEPOSIT: "wallet.deposit";
                readonly WITHDRAW: "wallet.withdraw";
                readonly ADJUST: "wallet.adjust";
            };
            readonly DEPOSITS: {
                readonly READ: "deposits.read";
                readonly APPROVE: "deposits.approve";
                readonly REJECT: "deposits.reject";
            };
            readonly WITHDRAWALS: {
                readonly READ: "withdrawals.read";
                readonly APPROVE: "withdrawals.approve";
                readonly REJECT: "withdrawals.reject";
            };
            readonly SETTINGS: {
                readonly READ: "settings.read";
                readonly UPDATE: "settings.update";
            };
            readonly REPORTS: {
                readonly VIEW: "reports.view";
                readonly EXPORT: "reports.export";
            };
        };
        allPermissions: ("users.read" | "users.create" | "users.update" | "users.delete" | "users.block" | "agents.read" | "agents.create" | "agents.update" | "agents.delete" | "agents.manage_downline" | "roles.read" | "roles.create" | "roles.update" | "roles.delete" | "bets.read" | "bets.manage" | "bets.settle" | "bets.void" | "matches.read" | "matches.create" | "matches.update" | "matches.delete" | "matches.manage_odds" | "wallet.read" | "wallet.deposit" | "wallet.withdraw" | "wallet.adjust" | "deposits.read" | "deposits.approve" | "deposits.reject" | "withdrawals.read" | "withdrawals.approve" | "withdrawals.reject" | "settings.read" | "settings.update" | "reports.view" | "reports.export")[];
    }>;
    seedRoles(): Promise<{
        message: string;
    }>;
    findOne(id: string): Promise<{
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
    getRoleUsers(id: string, page?: string, limit?: string): Promise<{
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
