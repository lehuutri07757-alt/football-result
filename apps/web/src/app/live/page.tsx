'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Trophy, 
  WifiOff,
  Loader2,
  Radio,
  Filter,
  X
} from 'lucide-react';
import { MatchCard } from '@/components/matches/MatchCard';
import { matchesService, Match } from '@/services/match.service';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { normalizeForSearch } from '@/lib/search';

const AUTO_REFRESH_INTERVAL = 30000;

interface GroupedMatches {
  [key: string]: {
    matches: Match[];
    logoUrl?: string;
    country?: string;
  };
}

export default function LivePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchLiveMatches = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const data = await matchesService.getLive();
      setMatches(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch live matches:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveMatches();
  }, [fetchLiveMatches]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLiveMatches();
    }, AUTO_REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [fetchLiveMatches]);

  const filteredMatches = matches.filter((match) => {
    if (debouncedSearch) {
      const query = normalizeForSearch(debouncedSearch);
      const haystack = normalizeForSearch(
        [match.homeTeam?.name, match.awayTeam?.name, match.league?.name, match.league?.country]
          .filter(Boolean)
          .join(' ')
      );
      if (!haystack.includes(query)) return false;
    }
    
    if (selectedLeague && match.league?.id !== selectedLeague) {
      return false;
    }
    
    return true;
  });

  const groupedMatches = filteredMatches.reduce((acc, match) => {
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
  }, {} as GroupedMatches);

  const uniqueLeagues = Array.from(
    new Map(
      matches
        .filter(m => m.league)
        .map(m => [m.league!.id, m.league!])
    ).values()
  );

  const formatLastUpdated = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white/50 dark:border-white/5 dark:bg-slate-950/50">
        <div className="p-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Live Leagues</h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedLeague(null)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all",
                !selectedLeague
                  ? 'bg-red-500/10 text-red-600 font-medium dark:text-red-500'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              )}
            >
              <div className="flex items-center gap-3">
                <Radio size={16} />
                <span>All Live</span>
              </div>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-md",
                !selectedLeague
                  ? "bg-red-500/20 text-red-600 dark:text-red-500"
                  : "bg-slate-200 dark:bg-slate-700"
              )}>
                {matches.length}
              </span>
            </button>
            
            {uniqueLeagues.map((league) => {
              const leagueMatchCount = matches.filter(m => m.league?.id === league.id).length;
              return (
                <button
                  key={league.id}
                  onClick={() => setSelectedLeague(league.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all",
                    selectedLeague === league.id
                      ? 'bg-red-500/10 text-red-600 font-medium dark:text-red-500'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {league.logoUrl ? (
                      <img src={league.logoUrl} alt={league.name} className="h-4 w-4 object-contain" />
                    ) : (
                      <Trophy size={16} />
                    )}
                    <span className="truncate max-w-[120px]">{league.name}</span>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-md",
                    selectedLeague === league.id
                      ? "bg-red-500/20 text-red-600 dark:text-red-500"
                      : "bg-slate-200 dark:bg-slate-700"
                  )}>
                    {leagueMatchCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        

      </aside>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-hide">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-xl">
                <Radio className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Live Matches
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                  </span>
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {matches.length} match{matches.length !== 1 ? 'es' : ''} in progress
                </p>
              </div>
            </div>
            

          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search teams, leagues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X size={14} className="text-slate-400" />
                </button>
              )}
            </div>
            
            <div className="lg:hidden">
              <select
                value={selectedLeague || ''}
                onChange={(e) => setSelectedLeague(e.target.value || null)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                <option value="">All Leagues</option>
                {uniqueLeagues.map((league) => (
                  <option key={league.id} value={league.id}>{league.name}</option>
                ))}
              </select>
            </div>
          </div>

          {lastUpdated && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
              Last updated: {formatLastUpdated(lastUpdated)}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-red-500" />
            <span className="ml-3 text-slate-500 dark:text-slate-400">Loading live matches...</span>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-20 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            {matches.length === 0 ? (
              <>
                <div className="p-4 bg-slate-200/50 dark:bg-slate-800/50 rounded-full inline-flex mb-4">
                  <WifiOff className="h-12 w-12 text-slate-400 dark:text-slate-600" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Live Matches</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  There are no matches happening right now.
                </p>
                <Link
                  href="/matches"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                >
                  <Trophy size={16} />
                  View All Matches
                </Link>
              </>
            ) : (
              <>
                <Filter className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No matches found</h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Try adjusting your search or filter criteria.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLeague(null);
                  }}
                  className="mt-4 text-red-500 hover:text-red-600 text-sm font-medium"
                >
                  Clear all filters
                </button>
              </>
            )}
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
  );
}
