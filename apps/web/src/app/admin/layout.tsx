'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { AdminThemeProvider, useAdminTheme } from '@/contexts/AdminThemeContext';
import { useLanguageStore } from '@/stores/language.store';
import { t, type I18nKey } from '@/lib/i18n';
import {
  Users,
  Trophy,
  Settings,
  Shield,
  LogOut,
  Menu,
  Bell,
  ChevronDown,
  ChevronRight,
  UserCog,
  X,
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  CreditCard,
  Sun,
  Moon,
  LayoutDashboard,
  Activity,
  Gamepad2,
  HeartPulse,
  Settings2,
  RefreshCw,
  UsersRound,
  Star,
  Wallet,
  Server,
  ListOrdered,
  type LucideIcon,
} from 'lucide-react';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MASTER_AGENT'];

interface NavItem {
  id: string;
  nameKey: I18nKey;
  icon: LucideIcon;
  href: string;
}

interface NavGroup {
  id: string;
  nameKey: I18nKey;
  icon: LucideIcon;
  items: NavItem[];
}

type NavEntry = NavItem | NavGroup;

const isNavGroup = (entry: NavEntry): entry is NavGroup => {
  return 'items' in entry;
};

const navItems: NavEntry[] = [
  { id: 'dashboard', nameKey: 'admin.nav.dashboard', icon: LayoutDashboard, href: '/admin' },
  {
    id: 'user-management',
    nameKey: 'admin.nav.userManagement',
    icon: Users,
    items: [
      { id: 'users', nameKey: 'admin.nav.users', icon: Users, href: '/admin/users' },
      { id: 'agents', nameKey: 'admin.nav.agents', icon: UserCog, href: '/admin/agents' },
    ],
  },
  {
    id: 'finance',
    nameKey: 'admin.nav.finance',
    icon: Wallet,
    items: [
      { id: 'deposits', nameKey: 'admin.nav.deposits', icon: ArrowDownToLine, href: '/admin/deposits' },
      { id: 'withdrawals', nameKey: 'admin.nav.withdrawals', icon: ArrowUpFromLine, href: '/admin/withdrawals' },
      { id: 'bets', nameKey: 'admin.nav.bets', icon: Receipt, href: '/admin/bets' },
      { id: 'transactions', nameKey: 'admin.nav.transactions', icon: CreditCard, href: '/admin/transactions' },
    ],
  },
  {
    id: 'sports-management',
    nameKey: 'admin.nav.sports',
    icon: Trophy,
    items: [
      { id: 'leagues', nameKey: 'admin.nav.leagues', icon: Trophy, href: '/admin/leagues' },
      { id: 'teams', nameKey: 'admin.nav.teams', icon: UsersRound, href: '/admin/teams' },
      { id: 'matches', nameKey: 'admin.nav.matches', icon: Gamepad2, href: '/admin/matches' },
      { id: 'standings', nameKey: 'admin.nav.standings', icon: ListOrdered, href: '/admin/standings' },
      { id: 'featured-matches', nameKey: 'admin.nav.featuredMatches', icon: Star, href: '/admin/featured-matches' },
    ],
  },
  {
    id: 'system',
    nameKey: 'admin.nav.system',
    icon: Server,
    items: [
      { id: 'sync-dashboard', nameKey: 'admin.nav.syncDashboard', icon: RefreshCw, href: '/admin/sync-dashboard' },
      { id: 'api-health', nameKey: 'admin.nav.apiHealth', icon: HeartPulse, href: '/admin/api-health' },
      { id: 'api-logs', nameKey: 'admin.nav.apiLogs', icon: Activity, href: '/admin/api-logs' },
      { id: 'sync-settings', nameKey: 'admin.nav.syncSettings', icon: Settings2, href: '/admin/sync-settings' },
      { id: 'settings', nameKey: 'admin.nav.settings', icon: Settings, href: '/admin/settings' },
    ],
  },
];

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, checkAuth, logout } = useAuthStore();
  const { theme, toggleTheme } = useAdminTheme();
  const language = useLanguageStore((s) => s.language);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const isDark = theme === 'dark';

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const isGroupActive = (group: NavGroup) => {
    return group.items.some(item => 
      item.href === pathname || (item.href !== '/admin' && pathname.startsWith(item.href))
    );
  };

  useEffect(() => {
    navItems.forEach(entry => {
      if (isNavGroup(entry) && isGroupActive(entry) && !expandedGroups.includes(entry.id)) {
        setExpandedGroups(prev => [...prev, entry.id]);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const verifyAccess = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    verifyAccess();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/?redirect=/admin');
        return;
      }

      const userRole = user?.role?.code;
      if (!userRole || !ADMIN_ROLES.includes(userRole)) {
        router.push('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.role?.code || !ADMIN_ROLES.includes(user.role.code)) {
    return null;
  }

  const findCurrentNav = (): NavItem | undefined => {
    for (const entry of navItems) {
      if (isNavGroup(entry)) {
        const found = entry.items.find(item => 
          item.href === pathname || (item.href !== '/admin' && pathname.startsWith(item.href))
        );
        if (found) return found;
      } else {
        if (entry.href === pathname || (entry.href !== '/admin' && pathname.startsWith(entry.href))) {
          return entry;
        }
      }
    }
    return navItems[0] as NavItem;
  };

  const currentNav = findCurrentNav();

  // Shared sidebar content for both desktop and mobile
  const sidebarContent = (isMobile: boolean) => {
    const isOpen = isMobile ? true : sidebarOpen;
    return (
      <>
        <div className={`h-16 flex items-center justify-between px-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
              <Shield size={18} className="text-white" />
            </div>
            <span className={`font-bold text-lg tracking-tight whitespace-nowrap transition-opacity duration-300 ${
              !isOpen && 'opacity-0 w-0'
            } ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Admin
            </span>
          </div>
          {isMobile && (
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="p-3 space-y-1 mt-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {navItems.map((entry) => {
            if (isNavGroup(entry)) {
              const groupActive = isGroupActive(entry);
              const isExpanded = expandedGroups.includes(entry.id);
              
              return (
                <div key={entry.id}>
                  <button
                    onClick={() => toggleGroup(entry.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                      groupActive
                        ? isDark 
                          ? 'text-emerald-400' 
                          : 'text-emerald-600'
                        : isDark 
                          ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <entry.icon size={20} className="flex-shrink-0" />
                    <span className={`font-medium text-sm whitespace-nowrap transition-all duration-300 flex-1 text-left ${
                      !isOpen && 'opacity-0 translate-x-2'
                    }`}>
                      {t(language, entry.nameKey)}
                    </span>
                    <ChevronRight 
                      size={16} 
                      className={`transition-transform duration-200 ${
                        !isOpen && 'opacity-0'
                      } ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-200 ${
                    isExpanded && isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="ml-4 pl-4 border-l border-slate-700/50 mt-1 space-y-1">
                      {entry.items.map((item) => {
                        const isActive = item.href === pathname || (item.href !== '/admin' && pathname.startsWith(item.href));
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                              isActive
                                ? isDark 
                                  ? 'bg-emerald-500/10 text-emerald-400' 
                                  : 'bg-emerald-50 text-emerald-600'
                                : isDark 
                                  ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            <item.icon size={16} />
                            <span className="font-medium text-sm">{t(language, item.nameKey)}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            } else {
              const isActive = entry.href === pathname;
              return (
                <Link
                  key={entry.id}
                  href={entry.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? isDark 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-emerald-50 text-emerald-600'
                      : isDark 
                        ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <entry.icon 
                    size={20} 
                    className={`transition-colors duration-200 ${
                      isActive ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : ''
                    }`} 
                  />
                  <span className={`font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                    !isOpen && 'opacity-0 translate-x-2'
                  }`}>
                    {t(language, entry.nameKey)}
                  </span>
                  
                  {isActive && (
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-emerald-500 transition-opacity duration-300 ${
                      !isOpen ? 'opacity-100' : 'opacity-0'
                    }`} />
                  )}
                </Link>
              );
            }
          })}
        </nav>

        <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
              isDark 
                ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' 
                : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            <span className={`font-medium text-sm whitespace-nowrap transition-all duration-300 ${
              !isOpen && 'opacity-0 translate-x-2'
            }`}>
              {t(language, 'admin.nav.logout')}
            </span>
          </button>
        </div>
      </>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full w-64 transition-transform duration-300 z-50 border-r lg:hidden ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isDark 
            ? 'bg-slate-900 border-slate-800' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        {sidebarContent(true)}
      </aside>

      {/* Desktop sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full transition-all duration-300 z-50 border-r hidden lg:block ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${
          isDark 
            ? 'bg-slate-900 border-slate-800' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        {sidebarContent(false)}
      </aside>

      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <header className={`sticky top-0 z-30 backdrop-blur-xl border-b transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-950/80 border-slate-800' 
            : 'bg-white/80 border-slate-200'
        }`}>
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Mobile: hamburger to open sidebar */}
              <button 
                onClick={() => setMobileSidebarOpen(true)}
                className={`p-2 rounded-lg transition-colors lg:hidden ${
                  isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <Menu size={20} />
              </button>
              {/* Desktop: toggle sidebar width */}
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-lg transition-colors hidden lg:flex ${
                  isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className={`font-bold text-base sm:text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {currentNav ? t(language, currentNav.nameKey) : t(language, 'admin.nav.dashboard')}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={toggleTheme}
                className={`p-2 sm:p-2.5 rounded-full transition-all duration-200 ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              <button className={`p-2 sm:p-2.5 rounded-full transition-all duration-200 relative ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}>
                <Bell size={18} />
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 ring-2 ring-white dark:ring-slate-900 rounded-full animate-pulse"></span>
              </button>
              
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 sm:mx-1 hidden sm:block" />

              <LanguageSwitch className={`p-2 rounded-lg transition-colors hidden sm:block ${
                isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
              }`} />
              
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 py-1 rounded-full pr-1 transition-all ${
                    showUserMenu ? (isDark ? 'bg-slate-800' : 'bg-slate-100') : ''
                  }`}
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold shadow-md shadow-emerald-500/20">
                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className={`text-sm font-semibold leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {user?.username || 'Admin'}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {user?.role?.name || 'Administrator'}
                    </p>
                  </div>
                  <ChevronDown size={14} className={`ml-0.5 sm:ml-1 transition-transform duration-200 hidden sm:block ${
                    showUserMenu ? 'rotate-180' : ''
                  } ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                </button>
                
                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-30"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className={`absolute right-0 top-full mt-2 w-56 rounded-xl shadow-xl overflow-hidden z-40 border transform transition-all duration-200 origin-top-right ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <div className={`p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{t(language, 'admin.signedInAs')}</p>
                        <p className={`text-sm truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user?.username}</p>
                      </div>
                      <div className="p-1">
                        <Link 
                          href="/profile" 
                          className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                            isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <UserCog size={16} />
                          {t(language, 'admin.profileSettings')}
                        </Link>
                        <button 
                          onClick={handleLogout}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                            isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <LogOut size={16} />
                          {t(language, 'admin.signOut')}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminThemeProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminThemeProvider>
  );
}