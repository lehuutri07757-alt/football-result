'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Trophy, 
  Wifi, 
  Clock, 
  CheckCircle2,
  ListFilter
} from 'lucide-react';
import { MatchCard } from '@/components/matches/MatchCard';
import { matchesService, Match, MatchStatus } from '@/services/match.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

type TabType = 'all' | 'live' | 'upcoming' | 'finished';

interface FilterState {
  search: string;
  leagueId?: string;
  date?: string;
}

export default function MatchesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '' });
  
  // Custom hook usage would be better, but implementing directly for now
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
      
      // Apply client-side filtering for search (if backend doesn't support it yet)
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        data = data.filter(m => 
          m.homeTeam?.name.toLowerCase().includes(query) ||
          m.awayTeam?.name.toLowerCase().includes(query) ||
          m.league?.name.toLowerCase().includes(query)
        );
      }

      setMatches(data);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, debouncedSearch]);

  // Initial fetch and tab change
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Live refresh
  useEffect(() => {
    if (activeTab === 'live') {
      const interval = setInterval(fetchMatches, 30000); // 30s refresh
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchMatches]);

  // Group matches by league
  const groupedMatches = matches.reduce((acc, match) => {
    const leagueName = match.league?.name || 'Other Leagues';
    if (!acc[leagueName]) {
      acc[leagueName] = [];
    }
    acc[leagueName].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  const stats = {
    all: matches.length, // Ideally this comes from count API
    live: matches.filter(m => m.status === 'live' || m.isLive).length,
    upcoming: matches.filter(m => m.status === 'scheduled').length,
    finished: matches.filter(m => m.status === 'finished').length
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">All Matches</h1>
          <p className="text-muted-foreground mt-1">
            Follow live scores, results and fixtures
          </p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search teams, leagues..." 
              className="pl-9"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-4 mb-6 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
          <TabButton 
            active={activeTab === 'all'} 
            onClick={() => setActiveTab('all')}
            icon={ListFilter}
            label="All Matches"
          />
          <TabButton 
            active={activeTab === 'live'} 
            onClick={() => setActiveTab('live')}
            icon={Wifi}
            label="Live"
            count={stats.live}
            variant="live"
          />
          <TabButton 
            active={activeTab === 'upcoming'} 
            onClick={() => setActiveTab('upcoming')}
            icon={CalendarIcon}
            label="Upcoming"
          />
          <TabButton 
            active={activeTab === 'finished'} 
            onClick={() => setActiveTab('finished')}
            icon={CheckCircle2}
            label="Finished"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-[200px] animate-pulse bg-muted/50" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No matches found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedMatches).map(([league, leagueMatches]) => (
            <div key={league} className="space-y-4">
              <div className="flex items-center gap-3">
                {leagueMatches[0]?.league?.logoUrl ? (
                  <img 
                    src={leagueMatches[0].league.logoUrl} 
                    alt={league} 
                    className="h-6 w-6 object-contain"
                  />
                ) : (
                  <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                    <Trophy className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{league}</h2>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {leagueMatches.length}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {leagueMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({ 
  active, 
  onClick, 
  icon: Icon, 
  label, 
  count,
  variant = 'default' 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: any; 
  label: string;
  count?: number;
  variant?: 'default' | 'live';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
        active 
          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" 
          : "text-muted-foreground hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50",
        active && variant === 'live' && "text-red-600 dark:text-red-500"
      )}
    >
      <Icon className={cn("h-4 w-4", variant === 'live' && active && "animate-pulse")} />
      {label}
      {count !== undefined && count > 0 && (
        <span className={cn(
          "ml-1 text-[10px] px-1.5 py-0.5 rounded-full",
          active 
            ? "bg-slate-100 dark:bg-slate-700" 
            : "bg-muted text-muted-foreground",
          variant === 'live' && active && "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}
