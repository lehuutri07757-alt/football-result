import type { Language } from '@/stores/language.store';

export type I18nKey =
  | 'nav.sports'
  | 'nav.results'
  | 'auth.login'
  | 'auth.register'
  | 'menu.account'
  | 'menu.wallet'
  | 'menu.admin'
  | 'menu.logout'
  | 'label.language'
  // Sidebar
  | 'sidebar.sports'
  | 'sidebar.football'
  | 'sidebar.vipClub'
  | 'sidebar.vipDesc'
  | 'sidebar.viewStatus'
  // Match detail
  | 'match.changeMatch'
  | 'match.loadError'
  | 'match.noData'
  | 'match.back'
  | 'match.retry'
  // Tabs
  | 'tab.popular'
  | 'tab.custom'
  | 'tab.handicapOU'
  | 'tab.goals'
  | 'tab.intervals'
  | 'tab.corners'
  | 'tab.all'
  // Markets
  | 'market.main'
  | 'market.over'
  | 'market.under'
  | 'market.1x2'
  | 'market.teamOU'
  | 'market.bothScore'
  | 'market.yes'
  | 'market.no'
  | 'market.updating'
  | 'market.checkBack'
  | 'market.noOdds'
  // Results page
  | 'results.title'
  | 'results.subtitle'
  | 'results.standings'
  | 'results.matchResults'
  | 'results.noResults'
  | 'results.loading'
  | 'results.team'
  | 'results.played'
  | 'results.won'
  | 'results.drawn'
  | 'results.lost'
  | 'results.goalsFor'
  | 'results.goalsAgainst'
  | 'results.goalDiff'
  | 'results.points'
  | 'results.selectLeague'
  | 'results.allLeagues'
  | 'results.selectLeagueForStandings'
  | 'results.ft'
  | 'results.searchLeagues'
  | 'results.loadMore'
  | 'results.noLeaguesFound'
  | 'results.form'
  | 'common.loading'
  // ===== ADMIN =====
  // Admin nav
  | 'admin.nav.dashboard'
  | 'admin.nav.userManagement'
  | 'admin.nav.users'
  | 'admin.nav.agents'
  | 'admin.nav.finance'
  | 'admin.nav.deposits'
  | 'admin.nav.withdrawals'
  | 'admin.nav.bets'
  | 'admin.nav.transactions'
  | 'admin.nav.sports'
  | 'admin.nav.leagues'
  | 'admin.nav.teams'
  | 'admin.nav.matches'
  | 'admin.nav.standings'
  | 'admin.nav.featuredMatches'
  | 'admin.nav.system'
  | 'admin.nav.syncDashboard'
  | 'admin.nav.apiHealth'
  | 'admin.nav.apiLogs'
  | 'admin.nav.syncSettings'
  | 'admin.nav.settings'
  | 'admin.nav.logout'
  | 'admin.signedInAs'
  | 'admin.profileSettings'
  | 'admin.signOut'
  // Admin common
  | 'admin.common.search'
  | 'admin.common.filter'
  | 'admin.common.actions'
  | 'admin.common.status'
  | 'admin.common.created'
  | 'admin.common.save'
  | 'admin.common.cancel'
  | 'admin.common.delete'
  | 'admin.common.edit'
  | 'admin.common.view'
  | 'admin.common.close'
  | 'admin.common.all'
  | 'admin.common.active'
  | 'admin.common.inactive'
  | 'admin.common.suspended'
  | 'admin.common.blocked'
  | 'admin.common.pending'
  | 'admin.common.approved'
  | 'admin.common.rejected'
  | 'admin.common.completed'
  | 'admin.common.failed'
  | 'admin.common.cancelled'
  | 'admin.common.processing'
  | 'admin.common.yes'
  | 'admin.common.no'
  | 'admin.common.enabled'
  | 'admin.common.disabled'
  | 'admin.common.noData'
  | 'admin.common.loading'
  | 'admin.common.user'
  | 'admin.common.amount'
  | 'admin.common.date'
  | 'admin.common.time'
  | 'admin.common.type'
  | 'admin.common.details'
  | 'admin.common.total'
  | 'admin.common.approve'
  | 'admin.common.reject'
  | 'admin.common.email'
  | 'admin.common.phone'
  | 'admin.common.role'
  | 'admin.common.balance'
  | 'admin.common.country'
  | 'admin.common.sport'
  | 'admin.common.season'
  | 'admin.common.featured'
  | 'admin.common.order'
  | 'admin.common.name'
  | 'admin.common.description'
  | 'admin.common.noResults'
  | 'admin.common.tryAdjustFilters'
  | 'admin.common.searchPlaceholder'
  | 'admin.common.updatedAt'
  | 'admin.common.createdAt'
  // Admin Dashboard
  | 'admin.dashboard.totalRevenue'
  | 'admin.dashboard.totalUsers'
  | 'admin.dashboard.activeMatches'
  | 'admin.dashboard.liveNow'
  | 'admin.dashboard.platformBalance'
  | 'admin.dashboard.totalDeposits'
  | 'admin.dashboard.totalWithdrawals'
  | 'admin.dashboard.betsWonLost'
  | 'admin.dashboard.recentActivity'
  | 'admin.dashboard.noRecentActivity'
  | 'admin.dashboard.transactionsAppearHere'
  | 'admin.dashboard.justNow'
  | 'admin.dashboard.actionRequired'
  | 'admin.dashboard.quickLinks'
  | 'admin.dashboard.won'
  | 'admin.dashboard.lost'
  // Admin Users
  | 'admin.users.title'
  | 'admin.users.createUser'
  | 'admin.users.userDetails'
  | 'admin.users.createNewUser'
  | 'admin.users.changeStatus'
  | 'admin.users.firstName'
  | 'admin.users.lastName'
  | 'admin.users.realBalance'
  | 'admin.users.bonusBalance'
  | 'admin.users.current'
  | 'admin.users.noUsers'
  | 'admin.users.noEmail'
  | 'admin.users.never'
  | 'admin.users.suspend'
  | 'admin.users.activate'
  | 'admin.users.username'
  | 'admin.users.password'
  | 'admin.users.confirmPassword'
  | 'admin.users.newPassword'
  | 'admin.users.resetPassword'
  | 'admin.users.adjustBalance'
  | 'admin.users.adjustmentReason'
  | 'admin.users.bettingHistory'
  | 'admin.users.transactionHistory'
  | 'admin.users.walletInfo'
  | 'admin.users.personalInfo'
  | 'admin.users.accountInfo'
  | 'admin.users.lastLogin'
  // Admin Deposits
  | 'admin.deposits.title'
  | 'admin.deposits.depositDetails'
  | 'admin.deposits.depositAmount'
  | 'admin.deposits.paymentMethod'
  | 'admin.deposits.bankTransfer'
  | 'admin.deposits.crypto'
  | 'admin.deposits.prepaidCard'
  | 'admin.deposits.bank'
  | 'admin.deposits.accountNumber'
  | 'admin.deposits.transferContent'
  | 'admin.deposits.rejectionReason'
  | 'admin.deposits.viewProofImage'
  | 'admin.deposits.bankInfo'
  | 'admin.deposits.method'
  | 'admin.deposits.noDeposits'
  | 'admin.deposits.searchUser'
  | 'admin.deposits.rejectionReasonPlaceholder'
  | 'admin.deposits.allStatus'
  // Admin Withdrawals
  | 'admin.withdrawals.title'
  | 'admin.withdrawals.withdrawalDetails'
  | 'admin.withdrawals.approveWithdrawal'
  | 'admin.withdrawals.rejectRequest'
  | 'admin.withdrawals.fee'
  | 'admin.withdrawals.net'
  | 'admin.withdrawals.bankInfo'
  | 'admin.withdrawals.account'
  | 'admin.withdrawals.ref'
  | 'admin.withdrawals.rejectReason'
  | 'admin.withdrawals.transactionRef'
  | 'admin.withdrawals.noWithdrawals'
  // Admin Bets
  | 'admin.bets.title'
  | 'admin.bets.betDetails'
  | 'admin.bets.allStatus'
  | 'admin.bets.won'
  | 'admin.bets.lost'
  | 'admin.bets.void'
  | 'admin.bets.partialWon'
  | 'admin.bets.cashout'
  | 'admin.bets.halfWon'
  | 'admin.bets.halfLost'
  | 'admin.bets.single'
  | 'admin.bets.accumulator'
  | 'admin.bets.system'
  | 'admin.bets.matchSelection'
  | 'admin.bets.odds'
  | 'admin.bets.stakePotWin'
  | 'admin.bets.placedAt'
  | 'admin.bets.settledAt'
  | 'admin.bets.totalStake'
  | 'admin.bets.potentialWin'
  | 'admin.bets.betType'
  | 'admin.bets.totalOdds'
  | 'admin.bets.betId'
  | 'admin.bets.voidBet'
  | 'admin.bets.stakeRefund'
  | 'admin.bets.league'
  | 'admin.bets.noBets'
  | 'admin.bets.searchPlaceholder'
  // Admin Transactions
  | 'admin.transactions.title'
  | 'admin.transactions.transactionDetails'
  | 'admin.transactions.allTypes'
  | 'admin.transactions.allStatuses'
  | 'admin.transactions.allBalances'
  | 'admin.transactions.deposit'
  | 'admin.transactions.withdrawal'
  | 'admin.transactions.betPlaced'
  | 'admin.transactions.betWon'
  | 'admin.transactions.betRefund'
  | 'admin.transactions.bonus'
  | 'admin.transactions.transfer'
  | 'admin.transactions.adjustment'
  | 'admin.transactions.realBalance'
  | 'admin.transactions.bonusBalance'
  | 'admin.transactions.real'
  | 'admin.transactions.bonusLabel'
  | 'admin.transactions.beforeAfter'
  | 'admin.transactions.balanceBefore'
  | 'admin.transactions.balanceAfter'
  | 'admin.transactions.transactionId'
  | 'admin.transactions.balanceType'
  | 'admin.transactions.referenceType'
  | 'admin.transactions.referenceId'
  | 'admin.transactions.metadata'
  | 'admin.transactions.noTransactions'
  | 'admin.transactions.unknown'
  // Admin Agents
  | 'admin.agents.title'
  | 'admin.agents.agentDetails'
  | 'admin.agents.editAgent'
  | 'admin.agents.allLevels'
  | 'admin.agents.masterAgent'
  | 'admin.agents.agent'
  | 'admin.agents.subAgent'
  | 'admin.agents.masterAgents'
  | 'admin.agents.agents'
  | 'admin.agents.subAgents'
  | 'admin.agents.commission'
  | 'admin.agents.agentCode'
  | 'admin.agents.downline'
  | 'admin.agents.totalEarned'
  | 'admin.agents.upline'
  | 'admin.agents.code'
  | 'admin.agents.level'
  | 'admin.agents.noAgents'
  // Admin Leagues
  | 'admin.leagues.title'
  | 'admin.leagues.leagueDetails'
  | 'admin.leagues.createLeague'
  | 'admin.leagues.editLeague'
  | 'admin.leagues.sortOrder'
  | 'admin.leagues.totalMatches'
  | 'admin.leagues.noLeagues'
  | 'admin.leagues.selectSport'
  // Admin Teams
  | 'admin.teams.title'
  | 'admin.teams.teamDetails'
  | 'admin.teams.createTeam'
  | 'admin.teams.editTeam'
  | 'admin.teams.shortName'
  | 'admin.teams.totalMatches'
  | 'admin.teams.allSports'
  | 'admin.teams.allCountries'
  | 'admin.teams.allStatus'
  | 'admin.teams.noTeams'
  // Admin Matches
  | 'admin.matches.title'
  | 'admin.matches.matchDetails'
  | 'admin.matches.createMatch'
  | 'admin.matches.editMatch'
  | 'admin.matches.sync'
  | 'admin.matches.scheduled'
  | 'admin.matches.live'
  | 'admin.matches.finished'
  | 'admin.matches.totalBets'
  | 'admin.matches.betting'
  | 'admin.matches.score'
  | 'admin.matches.dateTime'
  | 'admin.matches.homeTeam'
  | 'admin.matches.awayTeam'
  | 'admin.matches.selectLeague'
  | 'admin.matches.selectHomeTeam'
  | 'admin.matches.selectAwayTeam'
  | 'admin.matches.noMatches'
  | 'admin.matches.postponed'
  // Admin Standings
  | 'admin.standings.title'
  | 'admin.standings.searchLeagues'
  | 'admin.standings.noneSelected'
  // Admin Featured Matches
  | 'admin.featured.title'
  | 'admin.featured.live'
  | 'admin.featured.upcoming'
  | 'admin.featured.autoSelect'
  | 'admin.featured.includeLive'
  | 'admin.featured.includeUpcoming'
  // Admin Settings
  | 'admin.settings.title'
  | 'admin.settings.security'
  | 'admin.settings.payments'
  | 'admin.settings.notifications'
  | 'admin.settings.dataProviders'
  | 'admin.settings.systemConfig'
  | 'admin.settings.authSecurity'
  | 'admin.settings.sessionManagement'
  | 'admin.settings.transactionLimits'
  | 'admin.settings.feesBettingLimits'
  | 'admin.settings.systemAlerts'
  | 'admin.settings.featureToggles'
  | 'admin.settings.dangerZone'
  | 'admin.settings.loginNotifications'
  | 'admin.settings.sessionTimeout'
  | 'admin.settings.maxLoginAttempts'
  | 'admin.settings.lockAccount'
  | 'admin.settings.minDeposit'
  | 'admin.settings.maxDeposit'
  | 'admin.settings.minWithdrawal'
  | 'admin.settings.maxWithdrawal'
  | 'admin.settings.fixedFee'
  | 'admin.settings.minBet'
  | 'admin.settings.maxBet'
  | 'admin.settings.newBetNotifications'
  | 'admin.settings.suspiciousActivity'
  | 'admin.settings.dailyReports'
  | 'admin.settings.largeTransactionAlert'
  | 'admin.settings.thresholdAmount'
  | 'admin.settings.userRegistration'
  | 'admin.settings.bettingSystem'
  | 'admin.settings.maintenanceMode'
  | 'admin.settings.enableMaintenance'
  | 'admin.settings.clearCache'
  | 'admin.settings.resetSettings'
  | 'admin.settings.healthScore'
  | 'admin.settings.dailyUsage'
  | 'admin.settings.monthlyUsage'
  | 'admin.settings.providerCode'
  | 'admin.settings.baseUrl'
  | 'admin.settings.apiKey'
  | 'admin.settings.dataTypes'
  | 'admin.settings.dailyLimit'
  | 'admin.settings.monthlyLimit'
  | 'admin.settings.headersJson'
  | 'admin.settings.editProvider'
  | 'admin.settings.addProvider'
  | 'admin.settings.updateProvider'
  | 'admin.settings.createProvider'
  | 'admin.settings.noDescription'
  | 'admin.settings.securityDesc'
  | 'admin.settings.paymentsDesc'
  | 'admin.settings.notificationsDesc'
  | 'admin.settings.dataProvidersDesc'
  | 'admin.settings.systemDesc'
  | 'admin.settings.configureAuth'
  | 'admin.settings.controlSession'
  | 'admin.settings.setGlobalLimits'
  | 'admin.settings.configureFees'
  | 'admin.settings.configureAlerts'
  | 'admin.settings.enableDisableFeatures'
  | 'admin.settings.irreversibleActions'
  | 'admin.settings.manageDataSources'
  // Admin Sync Dashboard
  | 'admin.sync.title'
  | 'admin.sync.leagues'
  | 'admin.sync.teams'
  | 'admin.sync.fixtures'
  | 'admin.sync.upcomingOdds'
  | 'admin.sync.farOdds'
  | 'admin.sync.liveOdds'
  | 'admin.sync.standings'
  | 'admin.sync.fullSync'
  | 'admin.sync.waiting'
  | 'admin.sync.active'
  | 'admin.sync.delayed'
  | 'admin.sync.progress'
  | 'admin.sync.duration'
  | 'admin.sync.started'
  | 'admin.sync.triggeredBy'
  | 'admin.sync.allTypes'
  | 'admin.sync.allStatus'
  | 'admin.sync.allPriorities'
  | 'admin.sync.low'
  | 'admin.sync.normal'
  | 'admin.sync.high'
  | 'admin.sync.critical'
  | 'admin.sync.allTriggers'
  | 'admin.sync.api'
  | 'admin.sync.scheduler'
  | 'admin.sync.systemTrigger'
  | 'admin.sync.fromDate'
  | 'admin.sync.toDate'
  // Admin Sync Settings
  | 'admin.syncSettings.title'
  | 'admin.syncSettings.fixtureSync'
  | 'admin.syncSettings.liveOddsSync'
  | 'admin.syncSettings.upcomingOddsSync'
  | 'admin.syncSettings.farOddsSync'
  | 'admin.syncSettings.standingsSync'
  | 'admin.syncSettings.leagueTeamSync'
  | 'admin.syncSettings.rateLimits'
  | 'admin.syncSettings.interval'
  | 'admin.syncSettings.setByApiPlan'
  | 'admin.syncSettings.safetyBuffer'
  | 'admin.syncSettings.unsavedChanges'
  | 'admin.syncSettings.warning'
  | 'admin.syncSettings.optimized'
  | 'admin.syncSettings.fixturesTab'
  | 'admin.syncSettings.liveOddsTab'
  | 'admin.syncSettings.upcomingOddsTab'
  | 'admin.syncSettings.farOddsTab'
  | 'admin.syncSettings.standingsTab'
  | 'admin.syncSettings.generalLimitsTab'
  // Admin API Health
  | 'admin.apiHealth.title'
  | 'admin.apiHealth.normal'
  | 'admin.apiHealth.responding'
  | 'admin.apiHealth.connectionFailed'
  | 'admin.apiHealth.checkNow'
  // Admin API Logs
  | 'admin.apiLogs.title'
  | 'admin.apiLogs.filters'
  | 'admin.apiLogs.successRate'
  | 'admin.apiLogs.avgResponseTime'
  | 'admin.apiLogs.usedToday'
  | 'admin.apiLogs.dailyLimit'
  | 'admin.apiLogs.requestsByEndpoint'
  | 'admin.apiLogs.allEndpoints'
  | 'admin.apiLogs.success'
  | 'admin.apiLogs.error'
  | 'admin.apiLogs.timeout'
  | 'admin.apiLogs.startDate'
  | 'admin.apiLogs.endDate'
  | 'admin.apiLogs.statsPeriod';

const dictionaries: Record<Language, Record<I18nKey, string>> = {
  en: {
    'nav.sports': 'SPORTS',
    'nav.results': 'RESULTS',
    'auth.login': 'LOGIN',
    'auth.register': 'REGISTER',
    'menu.account': 'Account',
    'menu.wallet': 'Wallet / Deposit',
    'menu.admin': 'Admin',
    'menu.logout': 'Logout',
    'label.language': 'Language',
    'sidebar.sports': 'Sports',
    'sidebar.football': 'Football',
    'sidebar.vipClub': 'VIP Club',
    'sidebar.vipDesc': 'Unlock exclusive bonuses',
    'sidebar.viewStatus': 'View Status',
    'match.changeMatch': 'Change Match',
    'match.loadError': 'Failed to load match',
    'match.noData': 'No data found',
    'match.back': 'Go Back',
    'match.retry': 'Retry',
    'tab.popular': 'Popular',
    'tab.custom': 'Custom',
    'tab.handicapOU': 'Handicap & O/U',
    'tab.goals': 'Goals',
    'tab.intervals': 'Intervals',
    'tab.corners': 'Corners',
    'tab.all': 'All',
    'market.main': 'Main Odds',
    'market.over': 'Over',
    'market.under': 'Under',
    'market.1x2': '1 X 2 (European Odds)',
    'market.teamOU': 'Over/Under',
    'market.bothScore': 'Both Teams to Score',
    'market.yes': 'Yes',
    'market.no': 'No',
    'market.updating': 'Markets updating',
    'market.checkBack': 'Please check back later',
    'market.noOdds': 'No odds available',
    'results.title': 'Results & Standings',
    'results.subtitle': 'Match results and league standings',
    'results.standings': 'Standings',
    'results.matchResults': 'Match Results',
    'results.noResults': 'No results found',
    'results.loading': 'Loading results...',
    'results.team': 'Team',
    'results.played': 'P',
    'results.won': 'W',
    'results.drawn': 'D',
    'results.lost': 'L',
    'results.goalsFor': 'GF',
    'results.goalsAgainst': 'GA',
    'results.goalDiff': 'GD',
    'results.points': 'Pts',
    'results.selectLeague': 'Select League',
    'results.allLeagues': 'All Leagues',
    'results.selectLeagueForStandings': 'Select a league to view standings',
    'results.ft': 'FT',
    'results.searchLeagues': 'Search leagues...',
    'results.loadMore': 'Load more',
    'results.noLeaguesFound': 'No leagues found',
    'results.form': 'Form',
    'common.loading': 'Loading...',
    // ===== ADMIN EN =====
    'admin.nav.dashboard': 'Dashboard',
    'admin.nav.userManagement': 'User Management',
    'admin.nav.users': 'Users',
    'admin.nav.agents': 'Agents',
    'admin.nav.finance': 'Finance',
    'admin.nav.deposits': 'Deposits',
    'admin.nav.withdrawals': 'Withdrawals',
    'admin.nav.bets': 'Bets',
    'admin.nav.transactions': 'Transactions',
    'admin.nav.sports': 'Sports',
    'admin.nav.leagues': 'Leagues',
    'admin.nav.teams': 'Teams',
    'admin.nav.matches': 'Matches',
    'admin.nav.standings': 'Standings',
    'admin.nav.featuredMatches': 'Featured Matches',
    'admin.nav.system': 'System',
    'admin.nav.syncDashboard': 'Sync Dashboard',
    'admin.nav.apiHealth': 'API Health',
    'admin.nav.apiLogs': 'API Logs',
    'admin.nav.syncSettings': 'Sync Settings',
    'admin.nav.settings': 'Settings',
    'admin.nav.logout': 'Logout',
    'admin.signedInAs': 'Signed in as',
    'admin.profileSettings': 'Profile Settings',
    'admin.signOut': 'Sign Out',
    // Common
    'admin.common.search': 'Search',
    'admin.common.filter': 'Filter',
    'admin.common.actions': 'Actions',
    'admin.common.status': 'Status',
    'admin.common.created': 'Created',
    'admin.common.save': 'Save',
    'admin.common.cancel': 'Cancel',
    'admin.common.delete': 'Delete',
    'admin.common.edit': 'Edit',
    'admin.common.view': 'View',
    'admin.common.close': 'Close',
    'admin.common.all': 'All',
    'admin.common.active': 'Active',
    'admin.common.inactive': 'Inactive',
    'admin.common.suspended': 'Suspended',
    'admin.common.blocked': 'Blocked',
    'admin.common.pending': 'Pending',
    'admin.common.approved': 'Approved',
    'admin.common.rejected': 'Rejected',
    'admin.common.completed': 'Completed',
    'admin.common.failed': 'Failed',
    'admin.common.cancelled': 'Cancelled',
    'admin.common.processing': 'Processing',
    'admin.common.yes': 'Yes',
    'admin.common.no': 'No',
    'admin.common.enabled': 'Enabled',
    'admin.common.disabled': 'Disabled',
    'admin.common.noData': 'No data',
    'admin.common.loading': 'Loading...',
    'admin.common.user': 'User',
    'admin.common.amount': 'Amount',
    'admin.common.date': 'Date',
    'admin.common.time': 'Time',
    'admin.common.type': 'Type',
    'admin.common.details': 'Details',
    'admin.common.total': 'Total',
    'admin.common.approve': 'Approve',
    'admin.common.reject': 'Reject',
    'admin.common.email': 'Email',
    'admin.common.phone': 'Phone',
    'admin.common.role': 'Role',
    'admin.common.balance': 'Balance',
    'admin.common.country': 'Country',
    'admin.common.sport': 'Sport',
    'admin.common.season': 'Season',
    'admin.common.featured': 'Featured',
    'admin.common.order': 'Order',
    'admin.common.name': 'Name',
    'admin.common.description': 'Description',
    'admin.common.noResults': 'No results found',
    'admin.common.tryAdjustFilters': 'Try adjusting your filters',
    'admin.common.searchPlaceholder': 'Search...',
    'admin.common.updatedAt': 'Updated At',
    'admin.common.createdAt': 'Created At',
    // Dashboard
    'admin.dashboard.totalRevenue': 'Total Revenue',
    'admin.dashboard.totalUsers': 'Total Users',
    'admin.dashboard.activeMatches': 'Active Matches',
    'admin.dashboard.liveNow': 'Live now',
    'admin.dashboard.platformBalance': 'Platform Balance',
    'admin.dashboard.totalDeposits': 'Total Deposits',
    'admin.dashboard.totalWithdrawals': 'Total Withdrawals',
    'admin.dashboard.betsWonLost': 'Bets Won / Lost',
    'admin.dashboard.recentActivity': 'Recent Activity',
    'admin.dashboard.noRecentActivity': 'No recent activity',
    'admin.dashboard.transactionsAppearHere': 'Transactions will appear here',
    'admin.dashboard.justNow': 'Just now',
    'admin.dashboard.actionRequired': 'Action Required',
    'admin.dashboard.quickLinks': 'Quick Links',
    'admin.dashboard.won': 'Won',
    'admin.dashboard.lost': 'Lost',
    // Users
    'admin.users.title': 'Users',
    'admin.users.createUser': 'Create User',
    'admin.users.userDetails': 'User Details',
    'admin.users.createNewUser': 'Create New User',
    'admin.users.changeStatus': 'Change Status',
    'admin.users.firstName': 'First Name',
    'admin.users.lastName': 'Last Name',
    'admin.users.realBalance': 'Real balance',
    'admin.users.bonusBalance': 'Bonus balance',
    'admin.users.current': 'Current',
    'admin.users.noUsers': 'No users found',
    'admin.users.noEmail': 'No email',
    'admin.users.never': 'Never',
    'admin.users.suspend': 'Suspend',
    'admin.users.activate': 'Activate',
    'admin.users.username': 'Username',
    'admin.users.password': 'Password',
    'admin.users.confirmPassword': 'Confirm Password',
    'admin.users.newPassword': 'New Password',
    'admin.users.resetPassword': 'Reset Password',
    'admin.users.adjustBalance': 'Adjust Balance',
    'admin.users.adjustmentReason': 'Adjustment Reason',
    'admin.users.bettingHistory': 'Betting History',
    'admin.users.transactionHistory': 'Transaction History',
    'admin.users.walletInfo': 'Wallet Info',
    'admin.users.personalInfo': 'Personal Info',
    'admin.users.accountInfo': 'Account Info',
    'admin.users.lastLogin': 'Last Login',
    // Deposits
    'admin.deposits.title': 'Deposits',
    'admin.deposits.depositDetails': 'Deposit Details',
    'admin.deposits.depositAmount': 'Deposit Amount',
    'admin.deposits.paymentMethod': 'Payment Method',
    'admin.deposits.bankTransfer': 'Bank Transfer',
    'admin.deposits.crypto': 'Crypto',
    'admin.deposits.prepaidCard': 'Prepaid Card',
    'admin.deposits.bank': 'Bank',
    'admin.deposits.accountNumber': 'Account Number',
    'admin.deposits.transferContent': 'Transfer Content',
    'admin.deposits.rejectionReason': 'Rejection Reason',
    'admin.deposits.viewProofImage': 'View Proof Image',
    'admin.deposits.bankInfo': 'Bank Info',
    'admin.deposits.method': 'Method',
    'admin.deposits.noDeposits': 'No deposit requests found',
    'admin.deposits.searchUser': 'Search user...',
    'admin.deposits.rejectionReasonPlaceholder': 'Please provide a reason for rejection...',
    'admin.deposits.allStatus': 'All Status',
    // Withdrawals
    'admin.withdrawals.title': 'Withdrawals',
    'admin.withdrawals.withdrawalDetails': 'Withdrawal Details',
    'admin.withdrawals.approveWithdrawal': 'Approve Withdrawal',
    'admin.withdrawals.rejectRequest': 'Reject Request',
    'admin.withdrawals.fee': 'Fee',
    'admin.withdrawals.net': 'Net',
    'admin.withdrawals.bankInfo': 'Bank Info',
    'admin.withdrawals.account': 'Account',
    'admin.withdrawals.ref': 'Ref',
    'admin.withdrawals.rejectReason': 'Reject reason',
    'admin.withdrawals.transactionRef': 'Transaction ref (optional)',
    'admin.withdrawals.noWithdrawals': 'No withdrawal requests',
    // Bets
    'admin.bets.title': 'Bets',
    'admin.bets.betDetails': 'Bet Details',
    'admin.bets.allStatus': 'All Status',
    'admin.bets.won': 'Won',
    'admin.bets.lost': 'Lost',
    'admin.bets.void': 'Void',
    'admin.bets.partialWon': 'Partial Won',
    'admin.bets.cashout': 'Cashout',
    'admin.bets.halfWon': 'Half Won',
    'admin.bets.halfLost': 'Half Lost',
    'admin.bets.single': 'Single',
    'admin.bets.accumulator': 'Accumulator',
    'admin.bets.system': 'System',
    'admin.bets.matchSelection': 'Match / Selection',
    'admin.bets.odds': 'Odds',
    'admin.bets.stakePotWin': 'Stake / Pot. Win',
    'admin.bets.placedAt': 'Placed At',
    'admin.bets.settledAt': 'Settled At',
    'admin.bets.totalStake': 'Total Stake',
    'admin.bets.potentialWin': 'Potential Win',
    'admin.bets.betType': 'Bet Type',
    'admin.bets.totalOdds': 'Total Odds',
    'admin.bets.betId': 'Bet ID',
    'admin.bets.voidBet': 'Void Bet',
    'admin.bets.stakeRefund': 'Stake Refund',
    'admin.bets.league': 'League',
    'admin.bets.noBets': 'No bets found',
    'admin.bets.searchPlaceholder': 'Search user or bet ID...',
    // Transactions
    'admin.transactions.title': 'Transactions',
    'admin.transactions.transactionDetails': 'Transaction Details',
    'admin.transactions.allTypes': 'All Types',
    'admin.transactions.allStatuses': 'All Statuses',
    'admin.transactions.allBalances': 'All Balances',
    'admin.transactions.deposit': 'Deposit',
    'admin.transactions.withdrawal': 'Withdrawal',
    'admin.transactions.betPlaced': 'Bet Placed',
    'admin.transactions.betWon': 'Bet Won',
    'admin.transactions.betRefund': 'Bet Refund',
    'admin.transactions.bonus': 'Bonus',
    'admin.transactions.transfer': 'Transfer',
    'admin.transactions.adjustment': 'Adjustment',
    'admin.transactions.realBalance': 'Real Balance',
    'admin.transactions.bonusBalance': 'Bonus Balance',
    'admin.transactions.real': 'Real',
    'admin.transactions.bonusLabel': 'Bonus',
    'admin.transactions.beforeAfter': 'Before / After',
    'admin.transactions.balanceBefore': 'Balance Before',
    'admin.transactions.balanceAfter': 'Balance After',
    'admin.transactions.transactionId': 'Transaction ID',
    'admin.transactions.balanceType': 'Balance Type',
    'admin.transactions.referenceType': 'Reference Type',
    'admin.transactions.referenceId': 'Reference ID',
    'admin.transactions.metadata': 'Metadata',
    'admin.transactions.noTransactions': 'No transactions found',
    'admin.transactions.unknown': 'Unknown',
    // Agents
    'admin.agents.title': 'Agents',
    'admin.agents.agentDetails': 'Agent Details',
    'admin.agents.editAgent': 'Edit Agent',
    'admin.agents.allLevels': 'All levels',
    'admin.agents.masterAgent': 'Master Agent',
    'admin.agents.agent': 'Agent',
    'admin.agents.subAgent': 'Sub Agent',
    'admin.agents.masterAgents': 'Master Agents',
    'admin.agents.agents': 'Agents',
    'admin.agents.subAgents': 'Sub Agents',
    'admin.agents.commission': 'Commission',
    'admin.agents.agentCode': 'Agent code',
    'admin.agents.downline': 'Downline',
    'admin.agents.totalEarned': 'Total earned',
    'admin.agents.upline': 'Upline',
    'admin.agents.code': 'Code',
    'admin.agents.level': 'Level',
    'admin.agents.noAgents': 'No agents',
    // Leagues
    'admin.leagues.title': 'Leagues',
    'admin.leagues.leagueDetails': 'League Details',
    'admin.leagues.createLeague': 'Create League',
    'admin.leagues.editLeague': 'Edit League',
    'admin.leagues.sortOrder': 'Sort Order',
    'admin.leagues.totalMatches': 'Total Matches',
    'admin.leagues.noLeagues': 'No leagues found',
    'admin.leagues.selectSport': 'Select sport',
    // Teams
    'admin.teams.title': 'Teams',
    'admin.teams.teamDetails': 'Team Details',
    'admin.teams.createTeam': 'Create Team',
    'admin.teams.editTeam': 'Edit Team',
    'admin.teams.shortName': 'Short Name',
    'admin.teams.totalMatches': 'Total Matches',
    'admin.teams.allSports': 'All Sports',
    'admin.teams.allCountries': 'All Countries',
    'admin.teams.allStatus': 'All Status',
    'admin.teams.noTeams': 'No teams found',
    // Matches
    'admin.matches.title': 'Matches',
    'admin.matches.matchDetails': 'Match Details',
    'admin.matches.createMatch': 'Create New Match',
    'admin.matches.editMatch': 'Edit Match',
    'admin.matches.sync': 'Sync',
    'admin.matches.scheduled': 'Scheduled',
    'admin.matches.live': 'Live',
    'admin.matches.finished': 'Finished',
    'admin.matches.totalBets': 'Total Bets',
    'admin.matches.betting': 'Betting',
    'admin.matches.score': 'Score',
    'admin.matches.dateTime': 'Date/Time',
    'admin.matches.homeTeam': 'Home Team',
    'admin.matches.awayTeam': 'Away Team',
    'admin.matches.selectLeague': 'Select league',
    'admin.matches.selectHomeTeam': 'Select home team',
    'admin.matches.selectAwayTeam': 'Select away team',
    'admin.matches.noMatches': 'No matches found',
    'admin.matches.postponed': 'Postponed',
    // Standings
    'admin.standings.title': 'Standings',
    'admin.standings.searchLeagues': 'Search leagues...',
    'admin.standings.noneSelected': 'None selected',
    // Featured
    'admin.featured.title': 'Featured Matches',
    'admin.featured.live': 'Live',
    'admin.featured.upcoming': 'Upcoming',
    'admin.featured.autoSelect': 'Auto Select Enabled',
    'admin.featured.includeLive': 'Include Live Matches',
    'admin.featured.includeUpcoming': 'Include Upcoming Matches',
    // Settings
    'admin.settings.title': 'Settings',
    'admin.settings.security': 'Security',
    'admin.settings.payments': 'Payments',
    'admin.settings.notifications': 'Notifications',
    'admin.settings.dataProviders': 'Data Providers',
    'admin.settings.systemConfig': 'System',
    'admin.settings.authSecurity': 'Authentication Security',
    'admin.settings.sessionManagement': 'Session Management',
    'admin.settings.transactionLimits': 'Transaction Limits',
    'admin.settings.feesBettingLimits': 'Fees & Betting Limits',
    'admin.settings.systemAlerts': 'System Alerts',
    'admin.settings.featureToggles': 'Feature Toggles',
    'admin.settings.dangerZone': 'Danger Zone',
    'admin.settings.loginNotifications': 'Login Notifications',
    'admin.settings.sessionTimeout': 'Session Timeout (minutes)',
    'admin.settings.maxLoginAttempts': 'Max Login Attempts',
    'admin.settings.lockAccount': 'Lock account after failed tries.',
    'admin.settings.minDeposit': 'Min Deposit (USD)',
    'admin.settings.maxDeposit': 'Max Deposit (USD)',
    'admin.settings.minWithdrawal': 'Min Withdrawal (USD)',
    'admin.settings.maxWithdrawal': 'Max Withdrawal (USD)',
    'admin.settings.fixedFee': 'Fixed Fee (USD)',
    'admin.settings.minBet': 'Min Bet (USD)',
    'admin.settings.maxBet': 'Max Bet (USD)',
    'admin.settings.newBetNotifications': 'New Bet Notifications',
    'admin.settings.suspiciousActivity': 'Suspicious Activity',
    'admin.settings.dailyReports': 'Daily Reports',
    'admin.settings.largeTransactionAlert': 'Large Transaction Alert',
    'admin.settings.thresholdAmount': 'Threshold Amount (USD)',
    'admin.settings.userRegistration': 'User Registration',
    'admin.settings.bettingSystem': 'Betting System',
    'admin.settings.maintenanceMode': 'Maintenance Mode',
    'admin.settings.enableMaintenance': 'Enable Maintenance',
    'admin.settings.clearCache': 'Clear System Cache',
    'admin.settings.resetSettings': 'Reset Settings',
    'admin.settings.healthScore': 'Health Score',
    'admin.settings.dailyUsage': 'Daily Usage',
    'admin.settings.monthlyUsage': 'Monthly Usage',
    'admin.settings.providerCode': 'Provider Code',
    'admin.settings.baseUrl': 'Base URL',
    'admin.settings.apiKey': 'API Key',
    'admin.settings.dataTypes': 'Data Types',
    'admin.settings.dailyLimit': 'Daily Limit',
    'admin.settings.monthlyLimit': 'Monthly Limit',
    'admin.settings.headersJson': 'Headers (JSON)',
    'admin.settings.editProvider': 'Edit Provider',
    'admin.settings.addProvider': 'Add New Provider',
    'admin.settings.updateProvider': 'Update Provider',
    'admin.settings.createProvider': 'Create Provider',
    'admin.settings.noDescription': 'No description',
    'admin.settings.securityDesc': 'Manage security protocols, authentication, and access controls.',
    'admin.settings.paymentsDesc': 'Configure deposit/withdrawal limits, fees, and currency settings.',
    'admin.settings.notificationsDesc': 'Setup email alerts, push notifications, and system messages.',
    'admin.settings.dataProvidersDesc': 'Manage external data providers and API keys.',
    'admin.settings.systemDesc': 'General system configuration, maintenance mode, and feature toggles.',
    'admin.settings.configureAuth': 'Configure how administrators access the system.',
    'admin.settings.controlSession': 'Control session duration and lockout policies.',
    'admin.settings.setGlobalLimits': 'Set global limits for deposits and withdrawals.',
    'admin.settings.configureFees': 'Configure transaction fees and betting constraints.',
    'admin.settings.configureAlerts': 'Configure alerts for financial movements.',
    'admin.settings.enableDisableFeatures': 'Enable or disable core system features.',
    'admin.settings.irreversibleActions': 'Irreversible system actions.',
    'admin.settings.manageDataSources': 'Manage external data sources and API connections.',
    // Sync Dashboard
    'admin.sync.title': 'Sync Dashboard',
    'admin.sync.leagues': 'Leagues',
    'admin.sync.teams': 'Teams',
    'admin.sync.fixtures': 'Fixtures',
    'admin.sync.upcomingOdds': 'Upcoming Odds',
    'admin.sync.farOdds': 'Far Odds',
    'admin.sync.liveOdds': 'Live Odds',
    'admin.sync.standings': 'Standings',
    'admin.sync.fullSync': 'Full Sync',
    'admin.sync.waiting': 'Waiting',
    'admin.sync.active': 'Active',
    'admin.sync.delayed': 'Delayed',
    'admin.sync.progress': 'Progress',
    'admin.sync.duration': 'Duration',
    'admin.sync.started': 'Started',
    'admin.sync.triggeredBy': 'Triggered By',
    'admin.sync.allTypes': 'All Types',
    'admin.sync.allStatus': 'All Status',
    'admin.sync.allPriorities': 'All Priorities',
    'admin.sync.low': 'Low',
    'admin.sync.normal': 'Normal',
    'admin.sync.high': 'High',
    'admin.sync.critical': 'Critical',
    'admin.sync.allTriggers': 'All Triggers',
    'admin.sync.api': 'API',
    'admin.sync.scheduler': 'Scheduler',
    'admin.sync.systemTrigger': 'System',
    'admin.sync.fromDate': 'From Date',
    'admin.sync.toDate': 'To Date',
    // Sync Settings
    'admin.syncSettings.title': 'Sync Settings',
    'admin.syncSettings.fixtureSync': 'Fixture Synchronization',
    'admin.syncSettings.liveOddsSync': 'Live Odds Synchronization',
    'admin.syncSettings.upcomingOddsSync': 'Upcoming Odds Synchronization',
    'admin.syncSettings.farOddsSync': 'Far Odds Synchronization',
    'admin.syncSettings.standingsSync': 'Standings Synchronization',
    'admin.syncSettings.leagueTeamSync': 'League & Team Sync',
    'admin.syncSettings.rateLimits': 'Rate Limits & Safety',
    'admin.syncSettings.interval': 'Interval (Minutes)',
    'admin.syncSettings.setByApiPlan': 'Set by API plan',
    'admin.syncSettings.safetyBuffer': 'Safety buffer',
    'admin.syncSettings.unsavedChanges': 'Unsaved changes',
    'admin.syncSettings.warning': 'Warning',
    'admin.syncSettings.optimized': 'Optimized',
    'admin.syncSettings.fixturesTab': 'Fixtures',
    'admin.syncSettings.liveOddsTab': 'Live Odds',
    'admin.syncSettings.upcomingOddsTab': 'Upcoming Odds',
    'admin.syncSettings.farOddsTab': 'Far Odds',
    'admin.syncSettings.standingsTab': 'Standings',
    'admin.syncSettings.generalLimitsTab': 'General & Limits',
    // API Health
    'admin.apiHealth.title': 'API Health',
    'admin.apiHealth.normal': 'Normal',
    'admin.apiHealth.responding': 'API is responding normally',
    'admin.apiHealth.connectionFailed': 'Connection failed',
    'admin.apiHealth.checkNow': 'Check Now',
    // API Logs
    'admin.apiLogs.title': 'API Logs',
    'admin.apiLogs.filters': 'Filters',
    'admin.apiLogs.successRate': 'Success Rate',
    'admin.apiLogs.avgResponseTime': 'Avg Response Time',
    'admin.apiLogs.usedToday': 'Used Today',
    'admin.apiLogs.dailyLimit': 'Daily Limit',
    'admin.apiLogs.requestsByEndpoint': 'Requests by Endpoint',
    'admin.apiLogs.allEndpoints': 'All Endpoints',
    'admin.apiLogs.success': 'Success',
    'admin.apiLogs.error': 'Error',
    'admin.apiLogs.timeout': 'Timeout',
    'admin.apiLogs.startDate': 'Start Date',
    'admin.apiLogs.endDate': 'End Date',
    'admin.apiLogs.statsPeriod': 'Stats Period',
  },
  vi: {
    'nav.sports': 'THỂ THAO',
    'nav.results': 'KẾT QUẢ',
    'auth.login': 'ĐĂNG NHẬP',
    'auth.register': 'ĐĂNG KÝ',
    'menu.account': 'Tài khoản',
    'menu.wallet': 'Ví / Nạp tiền',
    'menu.admin': 'Quản trị Admin',
    'menu.logout': 'Đăng xuất',
    'label.language': 'Ngôn ngữ',
    'sidebar.sports': 'Thể thao',
    'sidebar.football': 'Bóng đá',
    'sidebar.vipClub': 'VIP Club',
    'sidebar.vipDesc': 'Mở khóa ưu đãi độc quyền',
    'sidebar.viewStatus': 'Xem trạng thái',
    'match.changeMatch': 'Đổi trận đấu',
    'match.loadError': 'Không tải được trận đấu',
    'match.noData': 'Không tìm thấy dữ liệu',
    'match.back': 'Quay lại',
    'match.retry': 'Thử lại',
    'tab.popular': 'Phổ biến',
    'tab.custom': 'Tùy chọn',
    'tab.handicapOU': 'Chấp & T/X',
    'tab.goals': 'Bàn thắng',
    'tab.intervals': 'Intervals',
    'tab.corners': 'Phạt góc',
    'tab.all': 'Tất cả',
    'market.main': 'Kèo Chính',
    'market.over': 'Tài (Over)',
    'market.under': 'Xỉu (Under)',
    'market.1x2': '1 X 2 (Kèo Châu Âu)',
    'market.teamOU': 'Tài/Xỉu',
    'market.bothScore': 'Hai đội ghi bàn',
    'market.yes': 'Có',
    'market.no': 'Không',
    'market.updating': 'Thị trường đang được cập nhật',
    'market.checkBack': 'Vui lòng quay lại sau',
    'market.noOdds': 'Chưa có kèo',
    'results.title': 'Kết quả & Bảng xếp hạng',
    'results.subtitle': 'Kết quả trận đấu và bảng xếp hạng giải đấu',
    'results.standings': 'Bảng xếp hạng',
    'results.matchResults': 'Kết quả trận đấu',
    'results.noResults': 'Không tìm thấy kết quả',
    'results.loading': 'Đang tải kết quả...',
    'results.team': 'Đội',
    'results.played': 'Tr',
    'results.won': 'Th',
    'results.drawn': 'H',
    'results.lost': 'Thua',
    'results.goalsFor': 'BT',
    'results.goalsAgainst': 'BN',
    'results.goalDiff': 'HS',
    'results.points': 'Đ',
    'results.selectLeague': 'Chọn giải đấu',
    'results.allLeagues': 'Tất cả giải đấu',
    'results.selectLeagueForStandings': 'Chọn một giải đấu để xem bảng xếp hạng',
    'results.ft': 'KT',
    'results.searchLeagues': 'Tìm giải đấu...',
    'results.loadMore': 'Xem thêm',
    'results.noLeaguesFound': 'Không tìm thấy giải đấu',
    'results.form': 'Phong độ',
    'common.loading': 'Đang tải...',
    // ===== ADMIN VI =====
    'admin.nav.dashboard': 'Tổng quan',
    'admin.nav.userManagement': 'Quản lý người dùng',
    'admin.nav.users': 'Người dùng',
    'admin.nav.agents': 'Đại lý',
    'admin.nav.finance': 'Tài chính',
    'admin.nav.deposits': 'Nạp tiền',
    'admin.nav.withdrawals': 'Rút tiền',
    'admin.nav.bets': 'Cược',
    'admin.nav.transactions': 'Giao dịch',
    'admin.nav.sports': 'Thể thao',
    'admin.nav.leagues': 'Giải đấu',
    'admin.nav.teams': 'Đội bóng',
    'admin.nav.matches': 'Trận đấu',
    'admin.nav.standings': 'Bảng xếp hạng',
    'admin.nav.featuredMatches': 'Trận nổi bật',
    'admin.nav.system': 'Hệ thống',
    'admin.nav.syncDashboard': 'Đồng bộ dữ liệu',
    'admin.nav.apiHealth': 'Sức khỏe API',
    'admin.nav.apiLogs': 'Nhật ký API',
    'admin.nav.syncSettings': 'Cài đặt đồng bộ',
    'admin.nav.settings': 'Cài đặt',
    'admin.nav.logout': 'Đăng xuất',
    'admin.signedInAs': 'Đăng nhập với',
    'admin.profileSettings': 'Cài đặt hồ sơ',
    'admin.signOut': 'Đăng xuất',
    // Common
    'admin.common.search': 'Tìm kiếm',
    'admin.common.filter': 'Lọc',
    'admin.common.actions': 'Thao tác',
    'admin.common.status': 'Trạng thái',
    'admin.common.created': 'Ngày tạo',
    'admin.common.save': 'Lưu',
    'admin.common.cancel': 'Hủy',
    'admin.common.delete': 'Xóa',
    'admin.common.edit': 'Sửa',
    'admin.common.view': 'Xem',
    'admin.common.close': 'Đóng',
    'admin.common.all': 'Tất cả',
    'admin.common.active': 'Hoạt động',
    'admin.common.inactive': 'Không hoạt động',
    'admin.common.suspended': 'Tạm ngưng',
    'admin.common.blocked': 'Bị chặn',
    'admin.common.pending': 'Đang chờ',
    'admin.common.approved': 'Đã duyệt',
    'admin.common.rejected': 'Từ chối',
    'admin.common.completed': 'Hoàn thành',
    'admin.common.failed': 'Thất bại',
    'admin.common.cancelled': 'Đã hủy',
    'admin.common.processing': 'Đang xử lý',
    'admin.common.yes': 'Có',
    'admin.common.no': 'Không',
    'admin.common.enabled': 'Bật',
    'admin.common.disabled': 'Tắt',
    'admin.common.noData': 'Không có dữ liệu',
    'admin.common.loading': 'Đang tải...',
    'admin.common.user': 'Người dùng',
    'admin.common.amount': 'Số tiền',
    'admin.common.date': 'Ngày',
    'admin.common.time': 'Giờ',
    'admin.common.type': 'Loại',
    'admin.common.details': 'Chi tiết',
    'admin.common.total': 'Tổng',
    'admin.common.approve': 'Duyệt',
    'admin.common.reject': 'Từ chối',
    'admin.common.email': 'Email',
    'admin.common.phone': 'Số điện thoại',
    'admin.common.role': 'Vai trò',
    'admin.common.balance': 'Số dư',
    'admin.common.country': 'Quốc gia',
    'admin.common.sport': 'Môn thể thao',
    'admin.common.season': 'Mùa giải',
    'admin.common.featured': 'Nổi bật',
    'admin.common.order': 'Thứ tự',
    'admin.common.name': 'Tên',
    'admin.common.description': 'Mô tả',
    'admin.common.noResults': 'Không tìm thấy kết quả',
    'admin.common.tryAdjustFilters': 'Thử điều chỉnh bộ lọc',
    'admin.common.searchPlaceholder': 'Tìm kiếm...',
    'admin.common.updatedAt': 'Cập nhật lúc',
    'admin.common.createdAt': 'Tạo lúc',
    // Dashboard
    'admin.dashboard.totalRevenue': 'Tổng doanh thu',
    'admin.dashboard.totalUsers': 'Tổng người dùng',
    'admin.dashboard.activeMatches': 'Trận đang diễn ra',
    'admin.dashboard.liveNow': 'Đang trực tiếp',
    'admin.dashboard.platformBalance': 'Số dư nền tảng',
    'admin.dashboard.totalDeposits': 'Tổng nạp',
    'admin.dashboard.totalWithdrawals': 'Tổng rút',
    'admin.dashboard.betsWonLost': 'Cược Thắng / Thua',
    'admin.dashboard.recentActivity': 'Hoạt động gần đây',
    'admin.dashboard.noRecentActivity': 'Chưa có hoạt động',
    'admin.dashboard.transactionsAppearHere': 'Giao dịch sẽ hiển thị ở đây',
    'admin.dashboard.justNow': 'Vừa xong',
    'admin.dashboard.actionRequired': 'Cần xử lý',
    'admin.dashboard.quickLinks': 'Truy cập nhanh',
    'admin.dashboard.won': 'Thắng',
    'admin.dashboard.lost': 'Thua',
    // Users
    'admin.users.title': 'Người dùng',
    'admin.users.createUser': 'Tạo người dùng',
    'admin.users.userDetails': 'Chi tiết người dùng',
    'admin.users.createNewUser': 'Tạo người dùng mới',
    'admin.users.changeStatus': 'Đổi trạng thái',
    'admin.users.firstName': 'Họ',
    'admin.users.lastName': 'Tên',
    'admin.users.realBalance': 'Số dư thật',
    'admin.users.bonusBalance': 'Số dư khuyến mãi',
    'admin.users.current': 'Hiện tại',
    'admin.users.noUsers': 'Không tìm thấy người dùng',
    'admin.users.noEmail': 'Chưa có email',
    'admin.users.never': 'Chưa bao giờ',
    'admin.users.suspend': 'Tạm ngưng',
    'admin.users.activate': 'Kích hoạt',
    'admin.users.username': 'Tên đăng nhập',
    'admin.users.password': 'Mật khẩu',
    'admin.users.confirmPassword': 'Xác nhận mật khẩu',
    'admin.users.newPassword': 'Mật khẩu mới',
    'admin.users.resetPassword': 'Đặt lại mật khẩu',
    'admin.users.adjustBalance': 'Điều chỉnh số dư',
    'admin.users.adjustmentReason': 'Lý do điều chỉnh',
    'admin.users.bettingHistory': 'Lịch sử cược',
    'admin.users.transactionHistory': 'Lịch sử giao dịch',
    'admin.users.walletInfo': 'Thông tin ví',
    'admin.users.personalInfo': 'Thông tin cá nhân',
    'admin.users.accountInfo': 'Thông tin tài khoản',
    'admin.users.lastLogin': 'Đăng nhập lần cuối',
    // Deposits
    'admin.deposits.title': 'Nạp tiền',
    'admin.deposits.depositDetails': 'Chi tiết nạp tiền',
    'admin.deposits.depositAmount': 'Số tiền nạp',
    'admin.deposits.paymentMethod': 'Phương thức thanh toán',
    'admin.deposits.bankTransfer': 'Chuyển khoản',
    'admin.deposits.crypto': 'Tiền mã hóa',
    'admin.deposits.prepaidCard': 'Thẻ cào',
    'admin.deposits.bank': 'Ngân hàng',
    'admin.deposits.accountNumber': 'Số tài khoản',
    'admin.deposits.transferContent': 'Nội dung chuyển khoản',
    'admin.deposits.rejectionReason': 'Lý do từ chối',
    'admin.deposits.viewProofImage': 'Xem ảnh chứng từ',
    'admin.deposits.bankInfo': 'Thông tin ngân hàng',
    'admin.deposits.method': 'Phương thức',
    'admin.deposits.noDeposits': 'Không tìm thấy yêu cầu nạp tiền',
    'admin.deposits.searchUser': 'Tìm người dùng...',
    'admin.deposits.rejectionReasonPlaceholder': 'Vui lòng nhập lý do từ chối...',
    'admin.deposits.allStatus': 'Tất cả trạng thái',
    // Withdrawals
    'admin.withdrawals.title': 'Rút tiền',
    'admin.withdrawals.withdrawalDetails': 'Chi tiết rút tiền',
    'admin.withdrawals.approveWithdrawal': 'Duyệt rút tiền',
    'admin.withdrawals.rejectRequest': 'Từ chối yêu cầu',
    'admin.withdrawals.fee': 'Phí',
    'admin.withdrawals.net': 'Thực nhận',
    'admin.withdrawals.bankInfo': 'Thông tin ngân hàng',
    'admin.withdrawals.account': 'Tài khoản',
    'admin.withdrawals.ref': 'Mã tham chiếu',
    'admin.withdrawals.rejectReason': 'Lý do từ chối',
    'admin.withdrawals.transactionRef': 'Mã giao dịch (tùy chọn)',
    'admin.withdrawals.noWithdrawals': 'Không có yêu cầu rút tiền',
    // Bets
    'admin.bets.title': 'Cược',
    'admin.bets.betDetails': 'Chi tiết cược',
    'admin.bets.allStatus': 'Tất cả trạng thái',
    'admin.bets.won': 'Thắng',
    'admin.bets.lost': 'Thua',
    'admin.bets.void': 'Hủy',
    'admin.bets.partialWon': 'Thắng nửa',
    'admin.bets.cashout': 'Rút tiền sớm',
    'admin.bets.halfWon': 'Thắng nửa',
    'admin.bets.halfLost': 'Thua nửa',
    'admin.bets.single': 'Đơn',
    'admin.bets.accumulator': 'Xiên',
    'admin.bets.system': 'Hệ thống',
    'admin.bets.matchSelection': 'Trận / Lựa chọn',
    'admin.bets.odds': 'Tỷ lệ',
    'admin.bets.stakePotWin': 'Tiền cược / Thưởng',
    'admin.bets.placedAt': 'Đặt lúc',
    'admin.bets.settledAt': 'Kết toán lúc',
    'admin.bets.totalStake': 'Tổng tiền cược',
    'admin.bets.potentialWin': 'Thưởng tiềm năng',
    'admin.bets.betType': 'Loại cược',
    'admin.bets.totalOdds': 'Tổng tỷ lệ',
    'admin.bets.betId': 'Mã cược',
    'admin.bets.voidBet': 'Hủy cược',
    'admin.bets.stakeRefund': 'Hoàn tiền cược',
    'admin.bets.league': 'Giải đấu',
    'admin.bets.noBets': 'Không tìm thấy cược',
    'admin.bets.searchPlaceholder': 'Tìm người dùng hoặc mã cược...',
    // Transactions
    'admin.transactions.title': 'Giao dịch',
    'admin.transactions.transactionDetails': 'Chi tiết giao dịch',
    'admin.transactions.allTypes': 'Tất cả loại',
    'admin.transactions.allStatuses': 'Tất cả trạng thái',
    'admin.transactions.allBalances': 'Tất cả số dư',
    'admin.transactions.deposit': 'Nạp tiền',
    'admin.transactions.withdrawal': 'Rút tiền',
    'admin.transactions.betPlaced': 'Đặt cược',
    'admin.transactions.betWon': 'Thắng cược',
    'admin.transactions.betRefund': 'Hoàn cược',
    'admin.transactions.bonus': 'Khuyến mãi',
    'admin.transactions.transfer': 'Chuyển khoản',
    'admin.transactions.adjustment': 'Điều chỉnh',
    'admin.transactions.realBalance': 'Số dư thật',
    'admin.transactions.bonusBalance': 'Số dư khuyến mãi',
    'admin.transactions.real': 'Thật',
    'admin.transactions.bonusLabel': 'Khuyến mãi',
    'admin.transactions.beforeAfter': 'Trước / Sau',
    'admin.transactions.balanceBefore': 'Số dư trước',
    'admin.transactions.balanceAfter': 'Số dư sau',
    'admin.transactions.transactionId': 'Mã giao dịch',
    'admin.transactions.balanceType': 'Loại số dư',
    'admin.transactions.referenceType': 'Loại tham chiếu',
    'admin.transactions.referenceId': 'Mã tham chiếu',
    'admin.transactions.metadata': 'Dữ liệu bổ sung',
    'admin.transactions.noTransactions': 'Không tìm thấy giao dịch',
    'admin.transactions.unknown': 'Không rõ',
    // Agents
    'admin.agents.title': 'Đại lý',
    'admin.agents.agentDetails': 'Chi tiết đại lý',
    'admin.agents.editAgent': 'Sửa đại lý',
    'admin.agents.allLevels': 'Tất cả cấp',
    'admin.agents.masterAgent': 'Đại lý cấp 1',
    'admin.agents.agent': 'Đại lý',
    'admin.agents.subAgent': 'Đại lý phụ',
    'admin.agents.masterAgents': 'Đại lý cấp 1',
    'admin.agents.agents': 'Đại lý',
    'admin.agents.subAgents': 'Đại lý phụ',
    'admin.agents.commission': 'Hoa hồng',
    'admin.agents.agentCode': 'Mã đại lý',
    'admin.agents.downline': 'Tuyến dưới',
    'admin.agents.totalEarned': 'Tổng thu nhập',
    'admin.agents.upline': 'Tuyến trên',
    'admin.agents.code': 'Mã',
    'admin.agents.level': 'Cấp',
    'admin.agents.noAgents': 'Không có đại lý',
    // Leagues
    'admin.leagues.title': 'Giải đấu',
    'admin.leagues.leagueDetails': 'Chi tiết giải đấu',
    'admin.leagues.createLeague': 'Tạo giải đấu',
    'admin.leagues.editLeague': 'Sửa giải đấu',
    'admin.leagues.sortOrder': 'Thứ tự sắp xếp',
    'admin.leagues.totalMatches': 'Tổng trận đấu',
    'admin.leagues.noLeagues': 'Không tìm thấy giải đấu',
    'admin.leagues.selectSport': 'Chọn môn thể thao',
    // Teams
    'admin.teams.title': 'Đội bóng',
    'admin.teams.teamDetails': 'Chi tiết đội bóng',
    'admin.teams.createTeam': 'Tạo đội bóng',
    'admin.teams.editTeam': 'Sửa đội bóng',
    'admin.teams.shortName': 'Tên viết tắt',
    'admin.teams.totalMatches': 'Tổng trận đấu',
    'admin.teams.allSports': 'Tất cả môn thể thao',
    'admin.teams.allCountries': 'Tất cả quốc gia',
    'admin.teams.allStatus': 'Tất cả trạng thái',
    'admin.teams.noTeams': 'Không tìm thấy đội bóng',
    // Matches
    'admin.matches.title': 'Trận đấu',
    'admin.matches.matchDetails': 'Chi tiết trận đấu',
    'admin.matches.createMatch': 'Tạo trận đấu mới',
    'admin.matches.editMatch': 'Sửa trận đấu',
    'admin.matches.sync': 'Đồng bộ',
    'admin.matches.scheduled': 'Lên lịch',
    'admin.matches.live': 'Trực tiếp',
    'admin.matches.finished': 'Kết thúc',
    'admin.matches.totalBets': 'Tổng cược',
    'admin.matches.betting': 'Cá cược',
    'admin.matches.score': 'Tỷ số',
    'admin.matches.dateTime': 'Ngày/Giờ',
    'admin.matches.homeTeam': 'Đội nhà',
    'admin.matches.awayTeam': 'Đội khách',
    'admin.matches.selectLeague': 'Chọn giải đấu',
    'admin.matches.selectHomeTeam': 'Chọn đội nhà',
    'admin.matches.selectAwayTeam': 'Chọn đội khách',
    'admin.matches.noMatches': 'Không tìm thấy trận đấu',
    'admin.matches.postponed': 'Hoãn',
    // Standings
    'admin.standings.title': 'Bảng xếp hạng',
    'admin.standings.searchLeagues': 'Tìm giải đấu...',
    'admin.standings.noneSelected': 'Chưa chọn',
    // Featured
    'admin.featured.title': 'Trận nổi bật',
    'admin.featured.live': 'Trực tiếp',
    'admin.featured.upcoming': 'Sắp diễn ra',
    'admin.featured.autoSelect': 'Tự động chọn',
    'admin.featured.includeLive': 'Bao gồm trận trực tiếp',
    'admin.featured.includeUpcoming': 'Bao gồm trận sắp diễn ra',
    // Settings
    'admin.settings.title': 'Cài đặt',
    'admin.settings.security': 'Bảo mật',
    'admin.settings.payments': 'Thanh toán',
    'admin.settings.notifications': 'Thông báo',
    'admin.settings.dataProviders': 'Nhà cung cấp dữ liệu',
    'admin.settings.systemConfig': 'Hệ thống',
    'admin.settings.authSecurity': 'Bảo mật xác thực',
    'admin.settings.sessionManagement': 'Quản lý phiên',
    'admin.settings.transactionLimits': 'Giới hạn giao dịch',
    'admin.settings.feesBettingLimits': 'Phí & Giới hạn cược',
    'admin.settings.systemAlerts': 'Cảnh báo hệ thống',
    'admin.settings.featureToggles': 'Bật/Tắt tính năng',
    'admin.settings.dangerZone': 'Vùng nguy hiểm',
    'admin.settings.loginNotifications': 'Thông báo đăng nhập',
    'admin.settings.sessionTimeout': 'Hết phiên (phút)',
    'admin.settings.maxLoginAttempts': 'Số lần đăng nhập tối đa',
    'admin.settings.lockAccount': 'Khóa tài khoản sau nhiều lần thất bại.',
    'admin.settings.minDeposit': 'Nạp tối thiểu (USD)',
    'admin.settings.maxDeposit': 'Nạp tối đa (USD)',
    'admin.settings.minWithdrawal': 'Rút tối thiểu (USD)',
    'admin.settings.maxWithdrawal': 'Rút tối đa (USD)',
    'admin.settings.fixedFee': 'Phí cố định (USD)',
    'admin.settings.minBet': 'Cược tối thiểu (USD)',
    'admin.settings.maxBet': 'Cược tối đa (USD)',
    'admin.settings.newBetNotifications': 'Thông báo cược mới',
    'admin.settings.suspiciousActivity': 'Hoạt động đáng ngờ',
    'admin.settings.dailyReports': 'Báo cáo hàng ngày',
    'admin.settings.largeTransactionAlert': 'Cảnh báo giao dịch lớn',
    'admin.settings.thresholdAmount': 'Ngưỡng cảnh báo (USD)',
    'admin.settings.userRegistration': 'Đăng ký người dùng',
    'admin.settings.bettingSystem': 'Hệ thống cá cược',
    'admin.settings.maintenanceMode': 'Chế độ bảo trì',
    'admin.settings.enableMaintenance': 'Bật chế độ bảo trì',
    'admin.settings.clearCache': 'Xóa bộ nhớ đệm',
    'admin.settings.resetSettings': 'Đặt lại cài đặt',
    'admin.settings.healthScore': 'Điểm sức khỏe',
    'admin.settings.dailyUsage': 'Sử dụng hàng ngày',
    'admin.settings.monthlyUsage': 'Sử dụng hàng tháng',
    'admin.settings.providerCode': 'Mã nhà cung cấp',
    'admin.settings.baseUrl': 'URL cơ sở',
    'admin.settings.apiKey': 'Khóa API',
    'admin.settings.dataTypes': 'Loại dữ liệu',
    'admin.settings.dailyLimit': 'Giới hạn ngày',
    'admin.settings.monthlyLimit': 'Giới hạn tháng',
    'admin.settings.headersJson': 'Headers (JSON)',
    'admin.settings.editProvider': 'Sửa nhà cung cấp',
    'admin.settings.addProvider': 'Thêm nhà cung cấp',
    'admin.settings.updateProvider': 'Cập nhật nhà cung cấp',
    'admin.settings.createProvider': 'Tạo nhà cung cấp',
    'admin.settings.noDescription': 'Không có mô tả',
    'admin.settings.securityDesc': 'Quản lý giao thức bảo mật, xác thực và kiểm soát truy cập.',
    'admin.settings.paymentsDesc': 'Cấu hình giới hạn nạp/rút, phí và tiền tệ.',
    'admin.settings.notificationsDesc': 'Thiết lập cảnh báo email, thông báo đẩy và tin nhắn hệ thống.',
    'admin.settings.dataProvidersDesc': 'Quản lý nhà cung cấp dữ liệu và khóa API.',
    'admin.settings.systemDesc': 'Cấu hình hệ thống, chế độ bảo trì và bật/tắt tính năng.',
    'admin.settings.configureAuth': 'Cấu hình cách quản trị viên truy cập hệ thống.',
    'admin.settings.controlSession': 'Kiểm soát thời lượng phiên và chính sách khóa.',
    'admin.settings.setGlobalLimits': 'Đặt giới hạn cho nạp và rút tiền.',
    'admin.settings.configureFees': 'Cấu hình phí giao dịch và ràng buộc cược.',
    'admin.settings.configureAlerts': 'Cấu hình cảnh báo cho các giao dịch tài chính.',
    'admin.settings.enableDisableFeatures': 'Bật hoặc tắt các tính năng cốt lõi.',
    'admin.settings.irreversibleActions': 'Các hành động không thể hoàn tác.',
    'admin.settings.manageDataSources': 'Quản lý nguồn dữ liệu và kết nối API.',
    // Sync Dashboard
    'admin.sync.title': 'Đồng bộ dữ liệu',
    'admin.sync.leagues': 'Giải đấu',
    'admin.sync.teams': 'Đội bóng',
    'admin.sync.fixtures': 'Lịch thi đấu',
    'admin.sync.upcomingOdds': 'Kèo sắp tới',
    'admin.sync.farOdds': 'Kèo xa',
    'admin.sync.liveOdds': 'Kèo trực tiếp',
    'admin.sync.standings': 'Bảng xếp hạng',
    'admin.sync.fullSync': 'Đồng bộ đầy đủ',
    'admin.sync.waiting': 'Đang chờ',
    'admin.sync.active': 'Đang chạy',
    'admin.sync.delayed': 'Trì hoãn',
    'admin.sync.progress': 'Tiến độ',
    'admin.sync.duration': 'Thời lượng',
    'admin.sync.started': 'Bắt đầu',
    'admin.sync.triggeredBy': 'Kích hoạt bởi',
    'admin.sync.allTypes': 'Tất cả loại',
    'admin.sync.allStatus': 'Tất cả trạng thái',
    'admin.sync.allPriorities': 'Tất cả ưu tiên',
    'admin.sync.low': 'Thấp',
    'admin.sync.normal': 'Bình thường',
    'admin.sync.high': 'Cao',
    'admin.sync.critical': 'Nghiêm trọng',
    'admin.sync.allTriggers': 'Tất cả nguồn',
    'admin.sync.api': 'API',
    'admin.sync.scheduler': 'Lịch trình',
    'admin.sync.systemTrigger': 'Hệ thống',
    'admin.sync.fromDate': 'Từ ngày',
    'admin.sync.toDate': 'Đến ngày',
    // Sync Settings
    'admin.syncSettings.title': 'Cài đặt đồng bộ',
    'admin.syncSettings.fixtureSync': 'Đồng bộ lịch thi đấu',
    'admin.syncSettings.liveOddsSync': 'Đồng bộ kèo trực tiếp',
    'admin.syncSettings.upcomingOddsSync': 'Đồng bộ kèo sắp tới',
    'admin.syncSettings.farOddsSync': 'Đồng bộ kèo xa',
    'admin.syncSettings.standingsSync': 'Đồng bộ bảng xếp hạng',
    'admin.syncSettings.leagueTeamSync': 'Đồng bộ giải đấu & đội',
    'admin.syncSettings.rateLimits': 'Giới hạn & An toàn',
    'admin.syncSettings.interval': 'Khoảng cách (Phút)',
    'admin.syncSettings.setByApiPlan': 'Theo gói API',
    'admin.syncSettings.safetyBuffer': 'Vùng đệm an toàn',
    'admin.syncSettings.unsavedChanges': 'Có thay đổi chưa lưu',
    'admin.syncSettings.warning': 'Cảnh báo',
    'admin.syncSettings.optimized': 'Tối ưu',
    'admin.syncSettings.fixturesTab': 'Lịch thi đấu',
    'admin.syncSettings.liveOddsTab': 'Kèo trực tiếp',
    'admin.syncSettings.upcomingOddsTab': 'Kèo sắp tới',
    'admin.syncSettings.farOddsTab': 'Kèo xa',
    'admin.syncSettings.standingsTab': 'Bảng xếp hạng',
    'admin.syncSettings.generalLimitsTab': 'Chung & Giới hạn',
    // API Health
    'admin.apiHealth.title': 'Sức khỏe API',
    'admin.apiHealth.normal': 'Bình thường',
    'admin.apiHealth.responding': 'API đang phản hồi bình thường',
    'admin.apiHealth.connectionFailed': 'Kết nối thất bại',
    'admin.apiHealth.checkNow': 'Kiểm tra ngay',
    // API Logs
    'admin.apiLogs.title': 'Nhật ký API',
    'admin.apiLogs.filters': 'Bộ lọc',
    'admin.apiLogs.successRate': 'Tỷ lệ thành công',
    'admin.apiLogs.avgResponseTime': 'Thời gian phản hồi TB',
    'admin.apiLogs.usedToday': 'Đã dùng hôm nay',
    'admin.apiLogs.dailyLimit': 'Giới hạn ngày',
    'admin.apiLogs.requestsByEndpoint': 'Yêu cầu theo Endpoint',
    'admin.apiLogs.allEndpoints': 'Tất cả Endpoint',
    'admin.apiLogs.success': 'Thành công',
    'admin.apiLogs.error': 'Lỗi',
    'admin.apiLogs.timeout': 'Hết giờ',
    'admin.apiLogs.startDate': 'Ngày bắt đầu',
    'admin.apiLogs.endDate': 'Ngày kết thúc',
    'admin.apiLogs.statsPeriod': 'Khoảng thời gian',
  },
};

export function t(language: Language, key: I18nKey): string {
  const dict = dictionaries[language] ?? dictionaries.en;
  return dict[key] ?? dictionaries.en[key];
}
