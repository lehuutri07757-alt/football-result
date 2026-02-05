'use client';

import { cn } from '@/lib/utils';
import { Bet365MatchListData } from '@/types/bet365';
import { Bet365LeagueSection } from './Bet365LeagueSection';

interface Bet365MatchListProps {
  data?: Bet365MatchListData;
  isLoading?: boolean;
  error?: Error | null;
  onMatchClick?: (matchId: string) => void;
  onOddsClick?: (matchId: string, selection: 'home' | 'draw' | 'away') => void;
  onMarketsClick?: (matchId: string) => void;
  onLeagueClick?: (leagueId: string) => void;
  className?: string;
}

export function Bet365MatchList({
  data,
  isLoading,
  error,
  onMatchClick,
  onOddsClick,
  onMarketsClick,
  onLeagueClick,
  className,
}: Bet365MatchListProps) {
  if (isLoading) {
    return <Bet365Skeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-400">
        Failed to load matches. Please try again.
      </div>
    );
  }

  if (!data || data.leagues.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No matches available.
      </div>
    );
  }

  return (
    <div className={cn('bg-[#1e1e1e]', className)}>
      {data.leagues.map((league) => (
        <Bet365LeagueSection
          key={league.id}
          league={league}
          onMatchClick={onMatchClick}
          onOddsClick={onOddsClick}
          onMarketsClick={onMarketsClick}
          onLeagueClick={onLeagueClick}
        />
      ))}
    </div>
  );
}

function Bet365Skeleton() {
  return (
    <div className="bg-[#1e1e1e] animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="mb-4">
          <div className="h-12 bg-[#2b2b2b]" />
          <div className="h-10 bg-[#4a4a4a]" />
          {[1, 2].map((j) => (
            <div key={j} className="flex items-center bg-[#2b2b2b] border-b border-[#3d3d3d] p-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#3d3d3d] rounded w-32" />
                <div className="h-4 bg-[#3d3d3d] rounded w-28" />
                <div className="h-3 bg-[#3d3d3d] rounded w-20 mt-2" />
              </div>
              <div className="flex gap-1">
                <div className="w-[100px] h-10 bg-[#3d3d3d]" />
                <div className="w-[100px] h-10 bg-[#3d3d3d]" />
                <div className="w-[100px] h-10 bg-[#3d3d3d]" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
