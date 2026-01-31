'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { AdminThemeProvider, useAdminTheme } from '@/contexts/AdminThemeContext';
import {
  Users,
  Trophy,
  Settings,
  Shield,
  LogOut,
  Menu,
  Bell,
  ChevronDown,
  UserCog,
  ArrowDownToLine,
  ArrowUpFromLine,
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
} from 'lucide-react';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MASTER_AGENT'];

const navItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { id: 'users', name: 'Users', icon: Users, href: '/admin/users' },
  { id: 'deposits', name: 'Deposits', icon: ArrowDownToLine, href: '/admin/deposits' },
  { id: 'withdrawals', name: 'Withdrawals', icon: ArrowUpFromLine, href: '/admin/withdrawals' },
  { id: 'leagues', name: 'Leagues', icon: Trophy, href: '/admin/leagues' },
  { id: 'teams', name: 'Teams', icon: UsersRound, href: '/admin/teams' },
  { id: 'matches', name: 'Matches', icon: Gamepad2, href: '/admin/matches' },
  { id: 'featured-matches', name: 'Featured Matches', icon: Star, href: '/admin/featured-matches' },
  { id: 'agents', name: 'Agents', icon: UserCog, href: '/admin/agents' },
  { id: 'sync-dashboard', name: 'Sync Dashboard', icon: RefreshCw, href: '/admin/sync-dashboard' },
  { id: 'api-health', name: 'API Health', icon: HeartPulse, href: '/admin/api-health' },
  { id: 'api-logs', name: 'API Logs', icon: Activity, href: '/admin/api-logs' },
  { id: 'sync-settings', name: 'Sync Settings', icon: Settings2, href: '/admin/sync-settings' },
  { id: 'settings', name: 'Settings', icon: Settings, href: '/admin/settings' },
];

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, checkAuth, logout } = useAuthStore();
  const { theme, toggleTheme } = useAdminTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isDark = theme === 'dark';

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

  const currentNav = navItems.find(item => 
    item.href === pathname || (item.href !== '/admin' && pathname.startsWith(item.href))
  ) || navItems[0];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <aside 
        className={`fixed left-0 top-0 h-full transition-all duration-300 z-50 border-r ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${
          isDark 
            ? 'bg-slate-900 border-slate-800' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className={`h-16 flex items-center px-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
              <Shield size={18} className="text-white" />
            </div>
            <span className={`font-bold text-lg tracking-tight whitespace-nowrap transition-opacity duration-300 ${
              !sidebarOpen && 'opacity-0 w-0'
            } ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Admin
            </span>
          </div>
        </div>

        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive = item.href === pathname || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.id}
                href={item.href}
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
                <item.icon 
                  size={20} 
                  className={`transition-colors duration-200 ${
                    isActive ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : ''
                  }`} 
                />
                <span className={`font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                  !sidebarOpen && 'opacity-0 translate-x-2'
                }`}>
                  {item.name}
                </span>
                
                {isActive && (
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-emerald-500 transition-opacity duration-300 ${
                    !sidebarOpen ? 'opacity-100' : 'opacity-0'
                  }`} />
                )}
              </Link>
            );
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
              !sidebarOpen && 'opacity-0 translate-x-2'
            }`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-950/80 border-slate-800' 
            : 'bg-white/80 border-slate-200'
        }`}>
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {currentNav.name}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={toggleTheme}
                className={`p-2.5 rounded-full transition-all duration-200 ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              <button className={`p-2.5 rounded-full transition-all duration-200 relative ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}>
                <Bell size={18} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 ring-2 ring-white dark:ring-slate-900 rounded-full animate-pulse"></span>
              </button>
              
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

              <LanguageSwitch className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
              }`} />
              
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-3 pl-2 py-1 rounded-full pr-1 transition-all ${
                    showUserMenu ? (isDark ? 'bg-slate-800' : 'bg-slate-100') : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold shadow-md shadow-emerald-500/20">
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
                  <ChevronDown size={14} className={`ml-1 transition-transform duration-200 ${
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
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Signed in as</p>
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
                          Profile Settings
                        </Link>
                        <button 
                          onClick={handleLogout}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                            isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <LogOut size={16} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto space-y-6">
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