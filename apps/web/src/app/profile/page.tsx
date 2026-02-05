'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Wallet, 
  Medal,
  ChevronRight,
  Settings,
  Lock,
  History,
  Camera
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) router.push('/');
  }, [isAuthenticated, router]);

  const username = user?.username ?? '';
  const email = (user as any)?.email ?? '';
  const avatarUrl = (user as any)?.avatarUrl ?? (user as any)?.avatar ?? undefined;
  const balance = (user as any)?.balance ?? 0;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
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
  );
}
