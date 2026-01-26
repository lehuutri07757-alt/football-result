'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Trophy, 
  Search, 
  Bell, 
  Menu, 
  User, 
  Wallet, 
  LogOut, 
  Shield, 
  MonitorPlay, 
  Medal,
  ChevronRight,
  Settings,
  Lock,
  CreditCard,
  History,
  Camera
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { t } from '@/lib/i18n';
import { useLanguageStore } from '@/stores/language.store';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MASTER_AGENT'];

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  
  const language = useLanguageStore((s) => s.language);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const username = user?.username ?? '';
  const email = (user as any)?.email ?? '';
  const avatarUrl = (user as any)?.avatarUrl ?? (user as any)?.avatar ?? undefined;
  const balance = (user as any)?.balance ?? 0;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-200 transition-colors duration-300">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-all">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Sports<span className="text-emerald-500">Bet</span>
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
              {[
                { name: t(language, 'nav.sports'), icon: <Trophy size={14} />, href: '/dashboard' },
                { name: 'Live', icon: <MonitorPlay size={14} />, href: '/dashboard' },
                { name: 'My Bets', icon: <Medal size={14} />, href: '/dashboard' },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50 transition-all"
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden xl:block w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search leagues, teams..." 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="hidden px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-400 border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">⌘K</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-4 mr-1">
                 <ThemeToggle className="h-9 w-9 rounded-full border-0 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800" />
                 <LanguageSwitch className="h-9" />
              </div>

              <button className="relative rounded-full p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white transition-colors">
                <Bell size={20} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950" />
              </button>

              {isAuthenticated && (
                <>
                  <div className="hidden sm:flex flex-col items-end mr-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{username}</span>
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
                            {(username?.[0] || 'U').toUpperCase()}
                          </span>
                        )}
                      </div>
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-950 dark:ring-white/10">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                          <p className="font-semibold text-slate-900 dark:text-white">{username}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{email}</p>
                        </div>
                        <div className="p-1.5 space-y-0.5">
                          <button
                            onClick={() => router.push('/profile')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg transition-colors dark:text-emerald-500 dark:bg-emerald-500/10"
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
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
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
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
              <div className="relative mx-auto mb-4 h-24 w-24">
                <div className="h-full w-full rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden dark:bg-slate-800 dark:border-slate-800">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-slate-400 dark:text-slate-600">
                      {(username?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 rounded-full bg-emerald-500 p-2 text-white shadow-lg hover:bg-emerald-600 transition-colors">
                  <Camera size={14} />
                </button>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{username || 'User'}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{email || 'No email'}</p>
              
              <div className="mt-6 flex justify-center gap-2">
                <div className="rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-500">
                  Level 12
                </div>
                <div className="rounded-lg bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-500">
                  Verified
                </div>
              </div>
            </div>

            <nav className="space-y-1 rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'wallet', label: 'Wallet', icon: Wallet },
                { id: 'history', label: 'Bet History', icon: History },
                { id: 'settings', label: 'Settings', icon: Settings },
                { id: 'security', label: 'Security', icon: Lock },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                  {activeTab === item.id && <ChevronRight size={16} className="ml-auto" />}
                </button>
              ))}
            </nav>
          </aside>

          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">{activeTab}</h1>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Total Balance</h3>
                  <Wallet className="text-emerald-500" size={20} />
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(balance)}</p>
                <div className="mt-4 flex gap-3">
                  <button className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors">
                    Deposit
                  </button>
                  <button className="flex-1 rounded-xl border border-slate-200 bg-transparent py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 transition-colors">
                    Withdraw
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Active Bets</h3>
                  <Medal className="text-blue-500" size={20} />
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">3</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Total stake: {formatCurrency(1500000)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Account Details</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Username</label>
                  <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                    {username}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Email Address</label>
                  <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                    {email}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Phone Number</label>
                  <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                    +84 9*** *** 99
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Date Joined</label>
                  <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                    Jan 20, 2024
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
