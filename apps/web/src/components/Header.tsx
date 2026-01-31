'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  MonitorPlay, 
  Medal, 
  Bell, 
  User, 
  Wallet, 
  LogOut, 
  Shield 
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useLanguageStore } from '@/stores/language.store';
import { GlobalSearch } from '@/components/GlobalSearch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { t } from '@/lib/i18n';

interface HeaderProps {
  className?: string;
}

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MASTER_AGENT'];

export function Header({ className }: HeaderProps) {
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  
  const language = useLanguageStore((s) => s.language);
  
  const balance = (user as any)?.balance ?? 0;
  const avatarUrl = (user as any)?.avatarUrl ?? (user as any)?.avatar ?? undefined;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

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
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-all">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sports<span className="text-emerald-500">Bet</span>
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            {[
              { name: t(language, 'nav.sports'), icon: <Trophy size={14} />, path: '/dashboard', active: true },
              { name: 'Live', icon: <MonitorPlay size={14} />, path: '/live' },
              { name: 'My Bets', icon: <Medal size={14} />, path: '/my-bets' },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                  item.active 
                    ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-800 dark:text-emerald-500'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex-1 flex justify-center px-8">
          <GlobalSearch className="hidden xl:block w-full max-w-xl" />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-4 mr-1">
               <ThemeToggle className="h-9 w-9 rounded-full border-0 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800" />
               <LanguageSwitch className="h-9" />
            </div>

            <button className="relative rounded-full p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950" />
            </button>

            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex flex-col items-end mr-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{user?.username}</span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-500">{formatCurrency(balance)}</span>
                </div>

                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen((v) => !v)}
                    className="group flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-emerald-500/20 transition-all"
                  >
                    <div className="h-10 w-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden dark:bg-slate-800 dark:border-slate-700">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                          {(user?.username?.[0] || 'U').toUpperCase()}
                        </span>
                      )}
                    </div>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-950 dark:ring-white/10">
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <p className="font-semibold text-slate-900 dark:text-white">{user?.username}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{user?.email}</p>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <button
                          onClick={() => router.push('/profile')}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                        >
                          <User size={16} />
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={() => router.push('/wallet')}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                        >
                          <Wallet size={16} />
                          <span>Wallet</span>
                        </button>
                        {user?.role?.code && ADMIN_ROLES.includes(user.role.code) && (
                          <button
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
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/')}
                  className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors dark:text-white dark:hover:bg-white/10"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white dark:text-slate-950 dark:hover:bg-emerald-400 text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
