'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { leaguesService, League } from '@/services/match.service';
import { cn } from '@/lib/utils';

interface UpcomingMatchesTabsProps {
  onLeagueSelect?: (league: League | null) => void;
  selectedLeagueId?: string | null;
  liveCount?: number;
}

export function UpcomingMatchesTabs({ 
  onLeagueSelect, 
  selectedLeagueId = null,
  liveCount = 0
}: UpcomingMatchesTabsProps) {
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(selectedLeagueId);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 280;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await leaguesService.getFeatured();
        setLeagues(data);
      } catch (err) {
        setError('Failed to load leagues data');
        console.error('Failed to fetch featured leagues:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabClick = (league: League) => {
    setActiveTab(league.id);
    
    if (onLeagueSelect) {
      onLeagueSelect(league);
    }
    
    router.push(`/leagues/${league.slug}`);
  };

  const showScrollControls = leagues.length > 5;

  if (loading) {
    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
          <h2 className="text-base font-medium text-slate-900 dark:text-white">
            Upcoming Matches
          </h2>
          {liveCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span>{liveCount} Live</span>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 h-9 w-28 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse snap-start"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || leagues.length === 0) {
    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
          <h2 className="text-base font-medium text-slate-900 dark:text-white">Upcoming Matches</h2>
          {liveCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span>{liveCount} Live</span>
            </div>
          )}
        </div>
        <div className="text-red-500 dark:text-red-400 text-xs">{error || 'No leagues available'}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
          <h2 className="text-base font-medium text-slate-900 dark:text-white">Upcoming Matches</h2>
          {liveCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span>{liveCount} Live</span>
            </div>
          )}
        </div>

        {showScrollControls && (
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollTabs('left')}
              className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Scroll tabs left"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollTabs('right')}
              className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Scroll tabs right"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory"
        >
          {leagues.map((league) => {
            const isActive = activeTab === league.id;

            return (
              <button
                key={league.id}
                type="button"
                onClick={() => handleTabClick(league)}
                className={cn(
                  'group snap-start flex-shrink-0 flex items-center justify-between gap-2 px-3 py-2 min-h-[44px] rounded-lg transition-all border',
                  'backdrop-blur-sm',
                  isActive
                    ? 'border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-white/70 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:bg-slate-950/60',
                )}
              >
                <div className="flex items-center gap-2">
                  {league.logoUrl ? (
                    <div className={cn(
                      'h-6 w-6 rounded-md overflow-hidden flex items-center justify-center',
                      isActive ? 'bg-white/10' : 'bg-slate-100 dark:bg-white/5',
                    )}>
                      <img src={league.logoUrl} alt={league.name} className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <div className={cn(
                      'h-6 w-6 rounded-md flex items-center justify-center',
                      isActive ? 'bg-white/10' : 'bg-slate-100 dark:bg-white/5',
                    )}>
                      <Trophy className={cn('h-3.5 w-3.5', isActive ? 'text-yellow-300' : 'text-amber-500')} />
                    </div>
                  )}

                  <span
                    className={cn(
                      'font-medium text-xs whitespace-nowrap',
                      isActive ? 'text-white' : 'text-slate-900 dark:text-white',
                    )}
                  >
                    {league.name}
                  </span>
                </div>

                {league._count?.matches !== undefined && league._count.matches > 0 && (
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
                    )}
                  >
                    {league._count.matches}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
