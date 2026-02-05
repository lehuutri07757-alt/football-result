'use client';

import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { Bet365League } from '@/types/bet365';
import { Bet365DateHeader } from './Bet365DateHeader';
import { Bet365MatchRow } from './Bet365MatchRow';

interface Bet365LeagueSectionProps {
  league: Bet365League;
  onMatchClick?: (matchId: string) => void;
  onOddsClick?: (matchId: string, selection: 'home' | 'draw' | 'away') => void;
  onMarketsClick?: (matchId: string) => void;
  onLeagueClick?: (leagueId: string) => void;
  className?: string;
}

export function Bet365LeagueSection({
  league,
  onMatchClick,
  onOddsClick,
  onMarketsClick,
  onLeagueClick,
  className,
}: Bet365LeagueSectionProps) {
  return (
    <div className={cn('mb-4', className)}>
      <button
        onClick={() => onLeagueClick?.(league.id)}
        className="flex items-center gap-2 px-4 py-3 w-full text-left bg-[#1e1e1e] hover:bg-[#2a2a2a] transition-colors"
      >
        <span className="text-white font-semibold">
          {league.country && `${league.country} `}{league.name}
        </span>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </button>

      {league.dateGroups.map((dateGroup) => (
        <div key={dateGroup.date}>
          <Bet365DateHeader date={dateGroup.date} />
          {dateGroup.matches.map((match) => (
            <Bet365MatchRow
              key={match.id}
              match={match}
              onMatchClick={onMatchClick}
              onOddsClick={onOddsClick}
              onMarketsClick={onMarketsClick}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
