'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronDown, 
  Search, 
  Trophy,
  Medal,
  Bell,
  User,
  Wallet,
  LogOut,
  Menu,
  Shield,
  MonitorPlay,
  Calendar,
  Zap,
  Star,
  Globe
} from 'lucide-react';

import { useAuthStore } from '@/stores/auth.store';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UpcomingMatchesTabs } from '@/components/dashboard/UpcomingMatchesTabs';
import { t } from '@/lib/i18n';
import { useLanguageStore } from '@/stores/language.store';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MASTER_AGENT'];

const sportsCategories = [
  { id: 1, name: 'Football', icon: '⚽', count: 1046, active: true },
  { id: 2, name: 'eSports', icon: '🎮', count: 71, active: false },
  { id: 3, name: 'Basketball', icon: '🏀', count: 306, active: false },
  { id: 4, name: 'Tennis', icon: '🎾', count: 192, active: false },
  { id: 5, name: 'Hockey', icon: '🏒', count: 259, active: false },
  { id: 6, name: 'Baseball', icon: '⚾', count: 89, active: false },
];

const matches = [
  {
    id: 1,
    league: 'Premier League',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    date: 'Today',
    homeTeam: 'Man City',
    awayTeam: 'Arsenal',
    homeFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    awayFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    time: '20:00',
    odds: { home: 2.10, draw: 3.40, away: 3.10 },
    isLive: false,
    isHot: true,
  },
  {
    id: 2,
    league: 'La Liga',
    flag: '🇪🇸',
    date: 'Today',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    homeFlag: '🇪🇸',
    awayFlag: '🇪🇸',
    time: '22:00',
    odds: { home: 1.95, draw: 3.60, away: 3.80 },
    isLive: false,
    isHot: true,
  },
  {
    id: 3,
    league: 'Serie A',
    flag: '🇮🇹',
    date: 'Live',
    homeTeam: 'Juventus',
    awayTeam: 'Milan',
    homeFlag: '🇮🇹',
    awayFlag: '🇮🇹',
    time: '65\'',
    odds: { home: 1.80, draw: 3.20, away: 4.50 },
    isLive: true,
    liveScore: { home: 1, away: 0 },
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const language = useLanguageStore((s) => s.language);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const checkAuth = useAuthStore((s) => s.checkAuth);

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

  const balance = (user as any)?.balance ?? 0;
  const avatarUrl = (user as any)?.avatarUrl ?? (user as any)?.avatar ?? undefined;

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
                { name: t(language, 'nav.sports'), icon: <Trophy size={14} />, active: true },
                { name: 'Live', icon: <MonitorPlay size={14} /> },
                { name: 'My Bets', icon: <Medal size={14} /> },
              ].map((item) => (
                <button
                  key={item.name}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                    item.active 
                      ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-800 dark:text-emerald-500'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </button>
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
                    onClick={() => router.push('/login')}
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

      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white/50 dark:border-white/5 dark:bg-slate-950/50">
          <div className="p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Sports</h3>
            <div className="space-y-1">
              {sportsCategories.map((sport) => (
                <button
                  key={sport.id}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all ${
                    sport.active 
                      ? 'bg-emerald-500/10 text-emerald-600 font-medium dark:text-emerald-500'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span>{sport.icon}</span>
                    <span>{sport.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-md ${
                    sport.active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-500' : 'bg-slate-200 text-slate-600 dark:bg-slate-900'
                  }`}>
                    {sport.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-auto p-4 border-t border-slate-200 dark:border-white/5">
            <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-center dark:from-indigo-600">
              <Star className="h-8 w-8 text-yellow-300 mx-auto mb-2" />
              <h4 className="font-bold text-white mb-1">VIP Club</h4>
              <p className="text-xs text-indigo-100 mb-3">Unlock exclusive bonuses</p>
              <button className="w-full py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-lg transition-colors backdrop-blur-sm">
                View Status
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-hide">
          <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-slate-800 to-slate-900 p-6 sm:p-8 dark:from-emerald-900 dark:via-slate-900 dark:to-slate-950">
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
             <div className="relative z-10">
               <div className="flex items-center gap-2 mb-2">
                 <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/20 dark:text-emerald-400">NEW</span>
                 <span className="text-slate-200 text-sm dark:text-slate-400">Welcome Offer</span>
               </div>
               <h1 className="text-3xl font-bold text-white mb-2">100% First Deposit Bonus</h1>
               <p className="text-slate-200 max-w-lg mb-6 dark:text-slate-400">Get up to $200 bonus on your first deposit. Join thousands of winners today.</p>
<button className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-bold rounded-lg transition-colors shadow-lg">
                  Claim Bonus
                </button>
             </div>
          </div>

          <UpcomingMatchesTabs />

          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg dark:bg-slate-900">
              {['All Matches', 'Live Now', 'Upcoming', 'My Favorites'].map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                    tab === 'All Matches' 
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' 
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {matches.map((match) => (
              <div 
                key={match.id} 
                className="group relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all overflow-hidden dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="flex flex-col md:flex-row items-center">
                  <div className="flex-1 p-4 w-full">
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        {match.flag} <span className="text-slate-600 dark:text-slate-300">{match.league}</span>
                      </span>
                      <span className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {match.date}
                      </span>
                      {match.isLive && (
                        <span className="ml-auto md:ml-0 px-2 py-0.5 rounded bg-red-100 text-red-600 font-bold animate-pulse dark:bg-red-500/10 dark:text-red-500">
                          LIVE • {match.time}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between gap-8">
                      <div className="flex items-center gap-3 flex-1 justify-end">
                        <span className={`font-bold ${match.homeTeam === 'Man City' || match.homeTeam === 'Real Madrid' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-300'}`}>{match.homeTeam}</span>
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-lg dark:bg-slate-800">{match.homeFlag}</div>
                      </div>
                      
                      <div className="px-4 py-1 rounded bg-slate-50 border border-slate-200 text-lg font-mono font-bold text-slate-900 min-w-[80px] text-center dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                        {match.isLive ? `${match.liveScore?.home} - ${match.liveScore?.away}` : 'VS'}
                      </div>

                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-lg dark:bg-slate-800">{match.awayFlag}</div>
                        <span className={`font-bold ${match.awayTeam === 'Arsenal' || match.awayTeam === 'Barcelona' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-300'}`}>{match.awayTeam}</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-auto p-4 bg-slate-50/50 border-t md:border-t-0 md:border-l border-slate-200 flex gap-2 dark:bg-slate-950/30 dark:border-slate-800">
                     <button className="flex-1 md:w-24 flex flex-col items-center justify-center py-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 group/odd transition-colors dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-emerald-500 dark:hover:text-slate-950">
                       <span className="text-[10px] text-slate-400 group-hover/odd:text-emerald-600 font-bold mb-0.5 dark:text-slate-500 dark:group-hover/odd:text-slate-800">1</span>
                       <span className="font-bold text-emerald-600 group-hover/odd:text-emerald-800 dark:text-emerald-400 dark:group-hover/odd:text-slate-950">{match.odds.home.toFixed(2)}</span>
                     </button>
                     <button className="flex-1 md:w-24 flex flex-col items-center justify-center py-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 group/odd transition-colors dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-emerald-500 dark:hover:text-slate-950">
                       <span className="text-[10px] text-slate-400 group-hover/odd:text-emerald-600 font-bold mb-0.5 dark:text-slate-500 dark:group-hover/odd:text-slate-800">X</span>
                       <span className="font-bold text-emerald-600 group-hover/odd:text-emerald-800 dark:text-emerald-400 dark:group-hover/odd:text-slate-950">{match.odds.draw.toFixed(2)}</span>
                     </button>
                     <button className="flex-1 md:w-24 flex flex-col items-center justify-center py-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 group/odd transition-colors dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-emerald-500 dark:hover:text-slate-950">
                       <span className="text-[10px] text-slate-400 group-hover/odd:text-emerald-600 font-bold mb-0.5 dark:text-slate-500 dark:group-hover/odd:text-slate-800">2</span>
                       <span className="font-bold text-emerald-600 group-hover/odd:text-emerald-800 dark:text-emerald-400 dark:group-hover/odd:text-slate-950">{match.odds.away.toFixed(2)}</span>
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
