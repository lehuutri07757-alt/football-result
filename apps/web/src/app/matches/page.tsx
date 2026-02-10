'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Calendar as CalendarIcon, 
  Trophy, 
  Wifi, 
  CheckCircle2,
  ListFilter,
  Bell,
  User,
  Wallet,
  LogOut,
  Shield,
  MonitorPlay,
  Medal,
  Loader2
} from 'lucide-react';
import { MatchCard } from '@/components/matches/MatchCard';
import { GlobalSearch } from '@/components/GlobalSearch';
import { matchesService, Match } from '@/services/match.service';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuthStore } from '@/stores/auth.store';
import { useLanguageStore } from '@/stores/language.store';
import { t } from '@/lib/i18n';
import { normalizeForSearch } from '@/lib/search';
import { useMatchStatistics } from '@/hooks/useMatchStatistics';

type TabType = 'all' | 'live' | 'upcoming' | 'finished';

interface FilterState {
  search: string;
  leagueId?: string;
  date?: string;
}

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MASTER_AGENT'];

export default function MatchesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '' });
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const language = useLanguageStore((s) => s.language);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  
  const { data: statistics } = useMatchStatistics();
  const footballCount = statistics?.total ?? 0;
  
  const debouncedSearch = useDebounce(filters.search, 500);

  const fetchMatches = useCallback(async () => {
    setIsLoading(true);
    try {
      let data: Match[] = [];
      
      switch (activeTab) {
        case 'live':
          data = await matchesService.getLive();
          break;
        case 'upcoming':
          data = await matchesService.getUpcoming();
          break;
        case 'finished':
          const res = await matchesService.getAll({ status: 'finished' });
          data = res.data;
          break;
        case 'all':
        default:
          const allRes = await matchesService.getAll();
          data = allRes.data;
          break;
      }
      
      if (debouncedSearch) {
        const query = normalizeForSearch(debouncedSearch);
        data = data.filter((m) => {
          const haystack = normalizeForSearch(
            [m.homeTeam?.name, m.awayTeam?.name, m.league?.name, m.league?.country]
              .filter(Boolean)
              .join(' '),
          );
          return haystack.includes(query);
        });
      }

      setMatches(data);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, debouncedSearch]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    if (activeTab === 'live') {
      const interval = setInterval(fetchMatches, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchMatches]);

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

  const groupedMatches = matches.reduce((acc, match) => {
    const leagueName = match.league?.name || 'Other Leagues';
    if (!acc[leagueName]) {
      acc[leagueName] = {
        matches: [],
        logoUrl: match.league?.logoUrl,
        country: match.league?.country
      };
    }
    acc[leagueName].matches.push(match);
    return acc;
  }, {} as Record<string, { matches: Match[]; logoUrl?: string; country?: string }>);

  const liveCount = matches.filter(m => m.status === 'live' || m.isLive).length;

  const balance = (user as any)?.balance ?? 0;
  const avatarUrl = (user as any)?.avatarUrl ?? (user as any)?.avatar ?? undefined;

   const formatCurrency = (amount: number) =>
     new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const matchTabs: { key: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'all', label: 'All Matches', icon: <ListFilter size={14} /> },
    { key: 'live', label: 'Live Now', icon: <Wifi size={14} />, count: activeTab === 'live' ? liveCount : undefined },
    { key: 'upcoming', label: 'Upcoming', icon: <CalendarIcon size={14} /> },
    { key: 'finished', label: 'Finished', icon: <CheckCircle2 size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-200 transition-colors duration-300">
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
                { name: t(language, 'nav.sports'), icon: <Trophy size={14} />, active: true },
                { name: 'Live', icon: <MonitorPlay size={14} /> },
                { name: t(language, 'nav.results'), icon: <Medal size={14} /> },
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
            <GlobalSearch className="hidden xl:block w-72" />

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

      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white/50 dark:border-white/5 dark:bg-slate-950/50">
          <div className="p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Sports</h3>
            <div className="space-y-1">
              <button
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all bg-emerald-500/10 text-emerald-600 font-medium dark:text-emerald-500"
              >
                <div className="flex items-center gap-3">
                  <span>⚽</span>
                  <span>Football</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-500">
                  {footballCount}
                </span>
              </button>
            </div>
          </div>
          

        </aside>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-hide">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Matches</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Follow live scores, results and fixtures</p>
            </div>
            
            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg dark:bg-slate-900 overflow-x-auto">
              {matchTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                    activeTab === tab.key 
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' 
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
                    tab.key === 'live' && activeTab === 'live' && 'text-red-600 dark:text-red-500'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={cn(
                      "ml-1 text-[10px] px-1.5 py-0.5 rounded-full",
                      tab.key === 'live' && activeTab === 'live' 
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse"
                        : "bg-slate-200 dark:bg-slate-700"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {matches.length} match{matches.length !== 1 ? 'es' : ''} found
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <span className="ml-3 text-slate-500 dark:text-slate-400">Loading matches...</span>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-20 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <Trophy className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No matches found</h3>
              <p className="text-slate-500 dark:text-slate-400">
                {activeTab === 'live' 
                  ? 'No live matches at the moment. Check back later!' 
                  : filters.search 
                    ? 'Try adjusting your search query.' 
                    : 'Check back later for new matches.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedMatches).map(([leagueName, leagueData]) => (
                <div key={leagueName} className="space-y-4">
                  <div className="flex items-center gap-3 sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 py-2 -mx-2 px-2 backdrop-blur-sm z-10">
                    {leagueData.logoUrl ? (
                      <img 
                        src={leagueData.logoUrl} 
                        alt={leagueName} 
                        className="h-6 w-6 object-contain"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                        <Trophy className="h-3 w-3 text-slate-400" />
                      </div>
                    )}
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{leagueName}</h2>
                    {leagueData.country && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">{leagueData.country}</span>
                    )}
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {leagueData.matches.length}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {leagueData.matches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
