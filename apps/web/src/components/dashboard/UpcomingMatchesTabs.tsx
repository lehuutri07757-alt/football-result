'use client';

import { useEffect, useRef, useState } from 'react';
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
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 h-12 w-32 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse snap-start"
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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <h2 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white">Upcoming Matches</h2>
          {liveCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
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
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Scroll tabs left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollTabs('right')}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Scroll tabs right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="relative group">
        <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-8 bg-gradient-to-r from-white to-transparent dark:from-slate-950 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity sm:block hidden" />
        
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-white to-transparent dark:from-slate-950 z-10 pointer-events-none block sm:hidden" />
        <div className="absolute right-0 top-0 bottom-0 w-4 sm:w-8 bg-gradient-to-l from-white to-transparent dark:from-slate-950 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity sm:block hidden" />

        <div
          ref={scrollRef}
          className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x snap-mandatory scroll-smooth"
        >
          {leagues.map((league) => {
            const isActive = activeTab === league.id;

            return (
              <button
                key={league.id}
                type="button"
                onClick={() => handleTabClick(league)}
                className={cn(
                  'group/tab snap-start flex-shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5 sm:py-3 min-h-[44px] rounded-full transition-all border shadow-sm',
                  isActive
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800/80',
                )}
              >
                <div className="flex items-center gap-3">
                  {league.logoUrl ? (
                    <div className={cn(
                      'h-7 w-7 sm:h-8 sm:w-8 rounded-full overflow-hidden flex items-center justify-center bg-white p-0.5',
                      isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800',
                    )}>
                      <img src={league.logoUrl} alt={league.name} className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <div className={cn(
                      'h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center',
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
                    )}>
                      <Trophy className="h-4 w-4" />
                    </div>
                  )}

                  <span
                    className={cn(
                      'font-medium text-sm whitespace-nowrap',
                      isActive ? 'text-white' : 'text-slate-900 dark:text-white',
                    )}
                  >
                    {league.name}
                  </span>
                </div>


              </button>
            );
          })}
          
          <div className="w-4 flex-shrink-0 sm:hidden" />
        </div>
      </div>
    </div>
  );
}
