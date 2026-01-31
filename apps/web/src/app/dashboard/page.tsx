'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft,
  ChevronRight,
  Trophy,
  Calendar,
  Zap,
  Star,
  Wifi,
  CheckCircle2,
  Loader2
} from 'lucide-react';

import { useAuthStore } from '@/stores/auth.store';
import { UpcomingMatchesTabs } from '@/components/dashboard/UpcomingMatchesTabs';
import { MatchCard } from '@/components/matches/MatchCard';
import { LiveMatchTimer } from '@/components/matches/LiveMatchTimer';
import { matchesService, Match } from '@/services/match.service';
import { cn } from '@/lib/utils';
import { normalizeForSearch } from '@/lib/search';

 // Dashboard should focus on actionable matches; we don't show the "All" tab here.
 type MatchTabType = 'upcoming' | 'live' | 'finished';

const MATCHES_PER_PAGE = 20;

const sportsCategories = [
  { id: 1, name: 'Football', icon: '⚽', count: 1046, active: true },
  { id: 2, name: 'eSports', icon: '🎮', count: 71, active: false },
  { id: 3, name: 'Basketball', icon: '🏀', count: 306, active: false },
  { id: 4, name: 'Tennis', icon: '🎾', count: 192, active: false },
  { id: 5, name: 'Hockey', icon: '🏒', count: 259, active: false },
  { id: 6, name: 'Baseball', icon: '⚾', count: 89, active: false },
];

export default function DashboardPage() {
  // Default to upcoming matches (instead of showing all matches first)
  const [activeMatchTab, setActiveMatchTab] = useState<MatchTabType>('upcoming');
  const [matches, setMatches] = useState<Match[]>([]);
  const [featuredMatches, setFeaturedMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalMatches, setTotalMatches] = useState(0);
  const featuredScrollRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  const scrollFeatured = (direction: 'left' | 'right') => {
    if (featuredScrollRef.current) {
      const scrollAmount = 340;
      featuredScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const fetchFeaturedMatches = useCallback(async () => {
    setIsLoadingFeatured(true);
    try {
      const data = await matchesService.getFeatured();
      setFeaturedMatches(data);
    } catch (error) {
      console.error('Failed to fetch featured matches:', error);
      setFeaturedMatches([]);
    } finally {
      setIsLoadingFeatured(false);
    }
  }, []);

  const fetchMatches = useCallback(async (page = 1, append = false) => {
    if (page === 1) {
      setIsLoadingMatches(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      let data: Match[] = [];
      let total = 0;
      let totalPages = 1;
      
      switch (activeMatchTab) {
        case 'upcoming': {
          const res = await matchesService.getAll({ 
            status: 'scheduled', 
            page, 
            limit: MATCHES_PER_PAGE,
            sortBy: 'startTime',
            sortOrder: 'asc'
          });
          data = res.data;
          total = res.meta.total;
          totalPages = res.meta.totalPages;
          break;
        }
        case 'live':
          data = await matchesService.getLive();
          total = data.length;
          totalPages = 1;
          break;
        case 'finished': {
          const finishedRes = await matchesService.getAll({ 
            status: 'finished', 
            page, 
            limit: MATCHES_PER_PAGE,
            sortBy: 'startTime',
            sortOrder: 'desc'
          });
          data = finishedRes.data;
          total = finishedRes.meta.total;
          totalPages = finishedRes.meta.totalPages;
          break;
        }
        default: {
          const defaultRes = await matchesService.getAll({ 
            status: 'scheduled', 
            page, 
            limit: MATCHES_PER_PAGE 
          });
          data = defaultRes.data;
          total = defaultRes.meta.total;
          totalPages = defaultRes.meta.totalPages;
          break;
        }
      }
      
      if (searchQuery.trim()) {
        const query = normalizeForSearch(searchQuery);
        data = data.filter((m) => {
          const haystack = normalizeForSearch(
            [m.homeTeam?.name, m.awayTeam?.name, m.league?.name, m.league?.country]
              .filter(Boolean)
              .join(' '),
          );
          return haystack.includes(query);
        });
      }

      if (append) {
        setMatches((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const next = data.filter((m) => !seen.has(m.id));
          return [...prev, ...next];
        });
      } else {
        setMatches(data);
      }
      
      setTotalMatches(total);
      setHasMore(page < totalPages && activeMatchTab !== 'live');
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      if (!append) {
        setMatches([]);
      }
      setHasMore(false);
    } finally {
      setIsLoadingMatches(false);
      setIsLoadingMore(false);
    }
  }, [activeMatchTab, searchQuery]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchMatches(currentPage + 1, true);
    }
  }, [fetchMatches, currentPage, isLoadingMore, hasMore]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    fetchMatches(1, false);
  }, [activeMatchTab, searchQuery]);

  useEffect(() => {
    fetchFeaturedMatches();
  }, [fetchFeaturedMatches]);

  useEffect(() => {
    if (activeMatchTab === 'live') {
      const interval = setInterval(() => fetchMatches(1, false), 30000);
      return () => clearInterval(interval);
    }
  }, [activeMatchTab, fetchMatches]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore && !isLoadingMatches) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoadingMore, isLoadingMatches]);

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

  const matchTabs: { key: MatchTabType; label: string; icon: React.ReactNode; count?: number }[] = [
    // Show upcoming first
    { key: 'upcoming', label: 'Upcoming', icon: <Calendar size={14} /> },
    { key: 'live', label: 'Live Now', icon: <Wifi size={14} />, count: activeMatchTab === 'live' ? liveCount : undefined },
    { key: 'finished', label: 'Finished', icon: <CheckCircle2 size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-200 transition-colors duration-300">
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
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Featured Matches</h2>
                {featuredMatches.length > 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {featuredMatches.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
                  {featuredMatches.length > 3 ? 'Scroll for more →' : 'Top picks for you'}
                </span>
                {featuredMatches.length > 3 && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => scrollFeatured('left')}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => scrollFeatured('right')}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {isLoadingFeatured ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                <span className="ml-2 text-slate-500 dark:text-slate-400">Loading...</span>
              </div>
            ) : featuredMatches.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <Star className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Featured Matches</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Admin can mark matches as "Featured" in the management page</p>
              </div>
            ) : (
              <div 
                ref={featuredScrollRef}
                className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 lg:-mx-6 lg:px-6 scrollbar-hide snap-x snap-mandatory"
              >
                {featuredMatches.slice(0, 10).map((match, index) => {
                  const isLive = match.status === 'live' || match.isLive;
                  const isFinished = match.status === 'finished';
                  const gradients = [
                    'from-purple-600 via-purple-700 to-indigo-800',
                    'from-orange-500 via-red-500 to-rose-600',
                    'from-blue-600 via-blue-700 to-indigo-900',
                    'from-emerald-500 via-emerald-600 to-teal-700',
                    'from-pink-500 via-rose-500 to-red-600',
                    'from-cyan-500 via-blue-500 to-indigo-600',
                  ];
                  const gradient = gradients[index % gradients.length];
                  
                  const formatTime = (dateStr: string) => {
                    return new Intl.DateTimeFormat('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }).format(new Date(dateStr));
                  };
                  
                  const formatDate = (dateStr: string) => {
                    const date = new Date(dateStr);
                    const today = new Date();
                    if (date.toDateString() === today.toDateString()) return 'Today';
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
                    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
                  };

                  return (
                    <Link
                      key={match.id}
                      href={`/matches/${match.id}`}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 hover:shadow-2xl transition-all duration-300 cursor-pointer flex-shrink-0 w-[320px] snap-start",
                        gradient
                      )}
                    >
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            {match.league?.logoUrl ? (
                              <img src={match.league.logoUrl} alt={match.league.name} className="h-5 w-5 object-contain" />
                            ) : (
                              <Trophy className="h-4 w-4 text-white/80" />
                            )}
                            <span className="text-white/90 text-xs font-medium truncate max-w-[120px]">
                              {match.league?.name || 'League'}
                            </span>
                          </div>
                          
                          {isLive ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/90 text-white text-[10px] font-bold uppercase">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                              </span>
                                                            LIVE <LiveMatchTimer 
                                startTime={match.startTime}
                                period={match.period}
                                liveMinute={match.liveMinute}
                                isLive={true}
                                status={match.status}
                              />
                            </div>
                          ) : isFinished ? (
                            <span className="px-2 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold">FT</span>
                          ) : (
                            <span className="px-2 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold">
                              {formatDate(match.startTime)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 flex flex-col items-center text-center">
                            <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2 group-hover:bg-white/30 transition-colors">
                              {match.homeTeam?.logoUrl ? (
                                <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="h-10 w-10 object-contain" />
                              ) : (
                                <span className="text-white font-bold text-sm">{match.homeTeam?.name?.substring(0, 3).toUpperCase()}</span>
                              )}
                            </div>
                            <span className="text-white font-semibold text-sm line-clamp-1">{match.homeTeam?.name || 'Home'}</span>
                          </div>
                          
                          <div className="flex flex-col items-center min-w-[60px]">
                            {isLive || isFinished ? (
                              <div className="flex items-center gap-2 text-3xl font-bold text-white">
                                <span>{match.homeScore ?? 0}</span>
                                <span className="text-white/50">-</span>
                                <span>{match.awayScore ?? 0}</span>
                              </div>
                            ) : (
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{formatTime(match.startTime)}</div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 flex flex-col items-center text-center">
                            <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2 group-hover:bg-white/30 transition-colors">
                              {match.awayTeam?.logoUrl ? (
                                <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="h-10 w-10 object-contain" />
                              ) : (
                                <span className="text-white font-bold text-sm">{match.awayTeam?.name?.substring(0, 3).toUpperCase()}</span>
                              )}
                            </div>
                            <span className="text-white font-semibold text-sm line-clamp-1">{match.awayTeam?.name || 'Away'}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-center gap-4">
                          <div className="flex items-center gap-1 text-white/80 text-xs">
                            <Star className="h-3 w-3 text-yellow-300" />
                            <span>Featured</span>
                          </div>
                          {match.bettingEnabled && (
                            <div className="flex items-center gap-1 text-white/80 text-xs">
                              <Zap className="h-3 w-3 text-emerald-300" />
                              <span>Betting</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <UpcomingMatchesTabs />

          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg dark:bg-slate-900 overflow-x-auto">
              {matchTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveMatchTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                    activeMatchTab === tab.key 
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' 
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
                    tab.key === 'live' && activeMatchTab === 'live' && 'text-red-600 dark:text-red-500'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={cn(
                      "ml-1 text-[10px] px-1.5 py-0.5 rounded-full",
                      tab.key === 'live' && activeMatchTab === 'live' 
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse"
                        : "bg-slate-200 dark:bg-slate-700"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {matches.length}{totalMatches > matches.length ? ` / ${totalMatches}` : ''} match{matches.length !== 1 ? 'es' : ''}
            </div>
          </div>

          {isLoadingMatches ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <span className="ml-3 text-slate-500 dark:text-slate-400">Loading matches...</span>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-20 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <Trophy className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No matches found</h3>
              <p className="text-slate-500 dark:text-slate-400">
                {activeMatchTab === 'live' 
                  ? 'No live matches at the moment. Check back later!' 
                  : searchQuery 
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

              <div ref={loadMoreRef} className="h-10" />

              {isLoadingMore && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                  <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Loading more...</span>
                </div>
              )}

              {!isLoadingMore && !hasMore && activeMatchTab !== 'live' && (
                <div className="flex items-center justify-center py-6">
                  <span className="text-sm text-slate-500 dark:text-slate-400">No more matches</span>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
