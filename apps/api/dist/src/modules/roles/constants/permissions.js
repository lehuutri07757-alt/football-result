"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ROLE_PERMISSIONS = exports.ROLE_CODES = exports.ALL_PERMISSIONS = exports.PERMISSIONS = void 0;
exports.PERMISSIONS = {
    USERS: {
        READ: 'users.read',
        CREATE: 'users.create',
        UPDATE: 'users.update',
        DELETE: 'users.delete',
        BLOCK: 'users.block',
    },
    AGENTS: {
        READ: 'agents.read',
        CREATE: 'agents.create',
        UPDATE: 'agents.update',
        DELETE: 'agents.delete',
        MANAGE_DOWNLINE: 'agents.manage_downline',
    },
    ROLES: {
        READ: 'roles.read',
        CREATE: 'roles.create',
        UPDATE: 'roles.update',
        DELETE: 'roles.delete',
    },
    BETS: {
        READ: 'bets.read',
        MANAGE: 'bets.manage',
        SETTLE: 'bets.settle',
        VOID: 'bets.void',
    },
    MATCHES: {
        READ: 'matches.read',
        CREATE: 'matches.create',
        UPDATE: 'matches.update',
        DELETE: 'matches.delete',
        MANAGE_ODDS: 'matches.manage_odds',
    },
    WALLET: {
        READ: 'wallet.read',
        DEPOSIT: 'wallet.deposit',
        WITHDRAW: 'wallet.withdraw',
        ADJUST: 'wallet.adjust',
    },
    DEPOSITS: {
        READ: 'deposits.read',
        APPROVE: 'deposits.approve',
        REJECT: 'deposits.reject',
    },
    WITHDRAWALS: {
        READ: 'withdrawals.read',
        APPROVE: 'withdrawals.approve',
        REJECT: 'withdrawals.reject',
    },
    SETTINGS: {
        READ: 'settings.read',
        UPDATE: 'settings.update',
    },
    REPORTS: {
        VIEW: 'reports.view',
        EXPORT: 'reports.export',
    },
};
exports.ALL_PERMISSIONS = Object.values(exports.PERMISSIONS).flatMap(group => Object.values(group));
exports.ROLE_CODES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    MASTER_AGENT: 'MASTER_AGENT',
    AGENT: 'AGENT',
    SUB_AGENT: 'SUB_AGENT',
    USER: 'USER',
};
exports.DEFAULT_ROLE_PERMISSIONS = {
    [exports.ROLE_CODES.SUPER_ADMIN]: exports.ALL_PERMISSIONS,
    [exports.ROLE_CODES.MASTER_AGENT]: [
        exports.PERMISSIONS.USERS.READ,
        exports.PERMISSIONS.USERS.CREATE,
        exports.PERMISSIONS.USERS.UPDATE,
        exports.PERMISSIONS.AGENTS.READ,
        exports.PERMISSIONS.AGENTS.CREATE,
        exports.PERMISSIONS.AGENTS.MANAGE_DOWNLINE,
        exports.PERMISSIONS.BETS.READ,
        exports.PERMISSIONS.WALLET.READ,
        exports.PERMISSIONS.WALLET.DEPOSIT,
        exports.PERMISSIONS.DEPOSITS.READ,
        exports.PERMISSIONS.WITHDRAWALS.READ,
        exports.PERMISSIONS.REPORTS.VIEW,
    ],
    [exports.ROLE_CODES.AGENT]: [
        exports.PERMISSIONS.USERS.READ,
        exports.PERMISSIONS.USERS.CREATE,
        exports.PERMISSIONS.AGENTS.READ,
        exports.PERMISSIONS.AGENTS.MANAGE_DOWNLINE,
        exports.PERMISSIONS.BETS.READ,
        exports.PERMISSIONS.WALLET.READ,
        exports.PERMISSIONS.DEPOSITS.READ,
        exports.PERMISSIONS.WITHDRAWALS.READ,
        exports.PERMISSIONS.REPORTS.VIEW,
    ],
    [exports.ROLE_CODES.SUB_AGENT]: [
        exports.PERMISSIONS.USERS.READ,
        exports.PERMISSIONS.BETS.READ,
        exports.PERMISSIONS.WALLET.READ,
        exports.PERMISSIONS.REPORTS.VIEW,
    ],
    [exports.ROLE_CODES.USER]: [
        exports.PERMISSIONS.BETS.READ,
        exports.PERMISSIONS.WALLET.READ,
    ],
};
//# sourceMappingURL=permissions.js.map