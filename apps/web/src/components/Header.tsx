'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Trophy, 
  MonitorPlay, 
  Medal, 
  User, 
  Wallet, 
  LogOut, 
  Shield,
  Receipt,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useLanguageStore } from '@/stores/language.store';
import { GlobalSearch } from '@/components/GlobalSearch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { t } from '@/lib/i18n';

interface HeaderProps {
  className?: string;
}

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MASTER_AGENT'];

export function Header(_: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  
  const language = useLanguageStore((s) => s.language);
  
  const balance = user?.wallet?.realBalance ?? 0;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isUserMenuOpen]);

  return (
    <header className="sticky top-0 z-[60] w-full border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 group flex-shrink-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-all">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="hidden sm:inline text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sports<span className="text-emerald-500">Bet</span>
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            {[
              { name: t(language, 'nav.sports'), icon: <Trophy size={14} />, path: '/dashboard' },
              { name: 'Live', icon: <MonitorPlay size={14} />, path: '/live' },
              { name: t(language, 'nav.results'), icon: <Medal size={14} />, path: '/results' },
            ].map((item) => {
              const isActive = pathname === item.path || (item.path === '/dashboard' && pathname === '/matches');
              const isLive = item.path === '/live';
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                    isActive 
                      ? isLive
                        ? 'bg-red-500 text-white shadow-sm dark:bg-red-600'
                        : 'bg-white text-emerald-600 shadow-sm dark:bg-slate-800 dark:text-emerald-500'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
                  }`}
                >
                  {item.icon}
                  {item.name}
                  {isLive && isActive && (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 flex justify-center px-2 sm:px-8">
          <GlobalSearch className="hidden lg:block w-full max-w-xl" />
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-4 mr-1">
               <ThemeToggle className="h-9 w-9 rounded-full border-0 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800" />
               <LanguageSwitch className="h-9" />
            </div>

            <NotificationDropdown />

            {isAuthenticated ? (
              <>
                <div className="relative isolate" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen((v) => !v)}
                    className="group flex items-center gap-1 sm:gap-2 rounded-xl px-2 sm:px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <div className="flex flex-col items-end">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{user?.username}</span>
                      <span className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-500">{formatCurrency(balance)}</span>
                    </div>
                  </button>

                  {isUserMenuOpen && (
                    <div 
                      className="fixed right-3 top-14 sm:top-16 w-60 rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5 overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-950 dark:ring-white/10"
                    >
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <p className="font-semibold text-slate-900 dark:text-white">{user?.username}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{user?.email}</p>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => router.push('/profile')}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                        >
                          <User size={16} />
                          <span>Profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push('/bets')}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                        >
                          <Receipt size={16} />
                          <span>Bet History</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push('/wallet')}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                        >
                          <Wallet size={16} />
                          <span>Wallet</span>
                        </button>
                        {user?.role?.code && ADMIN_ROLES.includes(user.role.code) && (
                          <button
                            type="button"
                            onClick={() => router.push('/admin')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors dark:text-emerald-500 dark:hover:bg-emerald-500/10"
                          >
                            <Shield size={16} />
                            <span>Admin Panel</span>
                          </button>
                        )}
                      </div>
                      <div className="p-1.5 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={async () => {
                            await logout();
                            router.push('/');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          <LogOut size={16} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-3 sm:px-5 py-1.5 sm:py-2 bg-emerald-500 hover:bg-emerald-600 text-white dark:text-slate-950 dark:hover:bg-emerald-400 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="lg:hidden w-full border-t border-slate-100 dark:border-slate-800">
        <GlobalSearch className="w-full" />
      </div>
    </header>
  );
}
