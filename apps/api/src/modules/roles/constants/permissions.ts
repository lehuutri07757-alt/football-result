export const PERMISSIONS = {
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
} as const;

export const ALL_PERMISSIONS = Object.values(PERMISSIONS).flatMap(group => Object.values(group));

export const ROLE_CODES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  MASTER_AGENT: 'MASTER_AGENT',
  AGENT: 'AGENT',
  SUB_AGENT: 'SUB_AGENT',
  USER: 'USER',
} as const;

export const DEFAULT_ROLE_PERMISSIONS = {
  [ROLE_CODES.SUPER_ADMIN]: ALL_PERMISSIONS,
  [ROLE_CODES.MASTER_AGENT]: [
    PERMISSIONS.USERS.READ,
    PERMISSIONS.USERS.CREATE,
    PERMISSIONS.USERS.UPDATE,
    PERMISSIONS.AGENTS.READ,
    PERMISSIONS.AGENTS.CREATE,
    PERMISSIONS.AGENTS.MANAGE_DOWNLINE,
    PERMISSIONS.BETS.READ,
    PERMISSIONS.WALLET.READ,
    PERMISSIONS.WALLET.DEPOSIT,
    PERMISSIONS.DEPOSITS.READ,
    PERMISSIONS.WITHDRAWALS.READ,
    PERMISSIONS.REPORTS.VIEW,
  ],
  [ROLE_CODES.AGENT]: [
    PERMISSIONS.USERS.READ,
    PERMISSIONS.USERS.CREATE,
    PERMISSIONS.AGENTS.READ,
    PERMISSIONS.AGENTS.MANAGE_DOWNLINE,
    PERMISSIONS.BETS.READ,
    PERMISSIONS.WALLET.READ,
    PERMISSIONS.DEPOSITS.READ,
    PERMISSIONS.WITHDRAWALS.READ,
    PERMISSIONS.REPORTS.VIEW,
  ],
  [ROLE_CODES.SUB_AGENT]: [
    PERMISSIONS.USERS.READ,
    PERMISSIONS.BETS.READ,
    PERMISSIONS.WALLET.READ,
    PERMISSIONS.REPORTS.VIEW,
  ],
  [ROLE_CODES.USER]: [
    PERMISSIONS.BETS.READ,
    PERMISSIONS.WALLET.READ,
  ],
};
