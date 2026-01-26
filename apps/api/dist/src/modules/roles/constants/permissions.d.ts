export declare const PERMISSIONS: {
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
export declare const ALL_PERMISSIONS: ("users.read" | "users.create" | "users.update" | "users.delete" | "users.block" | "agents.read" | "agents.create" | "agents.update" | "agents.delete" | "agents.manage_downline" | "roles.read" | "roles.create" | "roles.update" | "roles.delete" | "bets.read" | "bets.manage" | "bets.settle" | "bets.void" | "matches.read" | "matches.create" | "matches.update" | "matches.delete" | "matches.manage_odds" | "wallet.read" | "wallet.deposit" | "wallet.withdraw" | "wallet.adjust" | "deposits.read" | "deposits.approve" | "deposits.reject" | "withdrawals.read" | "withdrawals.approve" | "withdrawals.reject" | "settings.read" | "settings.update" | "reports.view" | "reports.export")[];
export declare const ROLE_CODES: {
    readonly SUPER_ADMIN: "SUPER_ADMIN";
    readonly MASTER_AGENT: "MASTER_AGENT";
    readonly AGENT: "AGENT";
    readonly SUB_AGENT: "SUB_AGENT";
    readonly USER: "USER";
};
export declare const DEFAULT_ROLE_PERMISSIONS: {
    SUPER_ADMIN: ("users.read" | "users.create" | "users.update" | "users.delete" | "users.block" | "agents.read" | "agents.create" | "agents.update" | "agents.delete" | "agents.manage_downline" | "roles.read" | "roles.create" | "roles.update" | "roles.delete" | "bets.read" | "bets.manage" | "bets.settle" | "bets.void" | "matches.read" | "matches.create" | "matches.update" | "matches.delete" | "matches.manage_odds" | "wallet.read" | "wallet.deposit" | "wallet.withdraw" | "wallet.adjust" | "deposits.read" | "deposits.approve" | "deposits.reject" | "withdrawals.read" | "withdrawals.approve" | "withdrawals.reject" | "settings.read" | "settings.update" | "reports.view" | "reports.export")[];
    MASTER_AGENT: ("users.read" | "users.create" | "users.update" | "agents.read" | "agents.create" | "agents.manage_downline" | "bets.read" | "wallet.read" | "wallet.deposit" | "deposits.read" | "withdrawals.read" | "reports.view")[];
    AGENT: ("users.read" | "users.create" | "agents.read" | "agents.manage_downline" | "bets.read" | "wallet.read" | "deposits.read" | "withdrawals.read" | "reports.view")[];
    SUB_AGENT: ("users.read" | "bets.read" | "wallet.read" | "reports.view")[];
    USER: ("bets.read" | "wallet.read")[];
};
