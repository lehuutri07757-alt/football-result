'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft,
  ChevronRight,
  Trophy,
  Zap,
  Star,
  Loader2
} from 'lucide-react';

import { useAuthStore } from '@/stores/auth.store';
import { useBetSlipStore } from '@/stores/betslip.store';
import { UpcomingMatchesTabs } from '@/components/dashboard/UpcomingMatchesTabs';
import { LiveMatchTimer } from '@/components/matches/LiveMatchTimer';
import { Bet365OddsTable } from '@/components/odds/Bet365OddsTable';
import { BetSelection } from '@/components/odds/Bet365MatchRow';
import { featuredMatchesService, Match, League } from '@/services/match.service';
import { useAllOdds } from '@/hooks/useOdds';
import { cn } from '@/lib/utils';
import { useMatchStatistics } from '@/hooks/useMatchStatistics';

export default function DashboardPage() {
  const [featuredMatches, setFeaturedMatches] = useState<Match[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<{ countryCode: string; countryName: string } | null>(null);
  const featuredScrollRef = useRef<HTMLDivElement | null>(null);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  
  const { data: statistics } = useMatchStatistics();
  const footballCount = statistics?.total ?? 0;
  const liveCount = statistics?.live ?? 0;

  const {
    data: oddsData,
    isLoading: isLoadingOdds,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchOdds,
  } = useAllOdds();

  const { items: betSlipItems, toggleSelection } = useBetSlipStore();

  const selectedBetsMap = useMemo(() => {
    const map = new Map<string, BetSelection>();
    betSlipItems.forEach((item) => {
      map.set(item.id, {
        fixtureId: item.fixtureId,
        matchName: item.matchName,
        market: item.market,
        selection: item.selection,
        odds: item.odds,
        handicap: item.handicap,
      });
    });
    return map;
  }, [betSlipItems]);

  const handleSelectBet = useCallback((selection: BetSelection) => {
    toggleSelection({
      fixtureId: selection.fixtureId,
      matchName: selection.matchName,
      market: selection.market,
      selection: selection.selection,
      odds: selection.odds,
      handicap: selection.handicap,
      oddsId: selection.oddsId,
    });
  }, [toggleSelection]);

  const filteredDateGroups = useMemo(() => {
    if (!oddsData?.dateGroups) return [];
    if (!selectedCountry || selectedCountry.countryCode === 'TOP') {
      return oddsData.dateGroups;
    }
    return oddsData.dateGroups
      .map((group) => ({
        ...group,
        matches: group.matches.filter(
          (match) =>
            match.country === selectedCountry.countryName ||
            match.country === selectedCountry.countryCode,
        ),
      }))
      .filter((group) => group.matches.length > 0);
  }, [oddsData?.dateGroups, selectedCountry]);


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
      const data = await featuredMatchesService.getFeaturedMatches();
      setFeaturedMatches(data);
    } catch (error) {
      console.error('Failed to fetch featured matches:', error);
      setFeaturedMatches([]);
    } finally {
      setIsLoadingFeatured(false);
    }
  }, []);

  const handleRefreshOdds = useCallback(() => {
    void refetchOdds();
  }, [refetchOdds]);

  const handleLoadMore = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  const handleLeagueSelect = useCallback((league: League | null) => {
    if (!league) {
      setSelectedCountry(null);
      return;
    }

    setSelectedCountry({
      countryCode: league.countryCode || '',
      countryName: league.country || '',
    });
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    fetchFeaturedMatches();
  }, [fetchFeaturedMatches]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-200 transition-colors duration-300">
      <div className="flex min-h-[calc(100vh-56px)] sm:min-h-[calc(100vh-64px)] overflow-hidden flex-col lg:flex-row pb-16 lg:pb-0">
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

        <main className="flex-1 overflow-y-auto overflow-x-clip p-3 sm:p-4 lg:p-6 scrollbar-hide">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Featured Matches</h2>
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
                className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
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
                        "group relative overflow-hidden rounded-2xl bg-gradient-to-br p-3 sm:p-4 md:p-5 hover:shadow-2xl transition-all duration-300 cursor-pointer flex-shrink-0 w-[240px] sm:w-[280px] md:w-[320px] snap-start active:scale-[0.98] tap-highlight-none",
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
                        
                        <div className="flex items-center justify-between gap-1 sm:gap-2 md:gap-3">
                          <div className="flex-1 flex flex-col items-center text-center">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-1.5 sm:mb-2 group-hover:bg-white/30 transition-colors">
                              {match.homeTeam?.logoUrl ? (
                                <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 object-contain" />
                              ) : (
                                <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm">{match.homeTeam?.name?.substring(0, 3).toUpperCase()}</span>
                              )}
                            </div>
                            <span className="text-white font-semibold text-[10px] sm:text-xs md:text-sm line-clamp-1">{match.homeTeam?.name || 'Home'}</span>
                          </div>
                          
                          <div className="flex flex-col items-center min-w-[40px] sm:min-w-[50px] md:min-w-[60px]">
                            {isLive || isFinished ? (
                              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-xl sm:text-2xl md:text-3xl font-bold text-white">
                                <span>{match.homeScore ?? 0}</span>
                                <span className="text-white/50">-</span>
                                <span>{match.awayScore ?? 0}</span>
                              </div>
                            ) : (
                              <div className="text-center">
                                <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">{formatTime(match.startTime)}</div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 flex flex-col items-center text-center">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-1.5 sm:mb-2 group-hover:bg-white/30 transition-colors">
                              {match.awayTeam?.logoUrl ? (
                                <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 object-contain" />
                              ) : (
                                <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm">{match.awayTeam?.name?.substring(0, 3).toUpperCase()}</span>
                              )}
                            </div>
                            <span className="text-white font-semibold text-[10px] sm:text-xs md:text-sm line-clamp-1">{match.awayTeam?.name || 'Away'}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-white/20 flex items-center justify-center gap-3 sm:gap-4">
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

          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <UpcomingMatchesTabs 
                onLeagueSelect={handleLeagueSelect}
                selectedLeagueId={null}
                liveCount={liveCount}
              />

            </div>
          </div>

          <Bet365OddsTable
            dateGroups={filteredDateGroups}
            isLoading={isLoadingOdds}
            selectedBets={selectedBetsMap}
            onSelectBet={handleSelectBet}
            onRefresh={handleRefreshOdds}
            onLoadMore={handleLoadMore}
            hasMore={hasNextPage}
            isFetchingMore={isFetchingNextPage}
            lastUpdate={oddsData?.lastUpdate}
          />
        </main>
      </div>
    </div>
  );
}
