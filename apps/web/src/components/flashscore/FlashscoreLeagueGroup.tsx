'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FlashscoreLeague } from '@/types/flashscore';
import { FlashscoreLeagueHeader } from './FlashscoreLeagueHeader';
import { FlashscoreMatchRow } from './FlashscoreMatchRow';

interface FlashscoreLeagueGroupProps {
  league: FlashscoreLeague;
  defaultExpanded?: boolean;
  onFavoriteToggle?: (matchId: string) => void;
  onMatchClick?: (matchId: string) => void;
  onOddsClick?: (matchId: string, market: string, selection: string) => void;
  onMarketsClick?: (matchId: string) => void;
  className?: string;
}

export function FlashscoreLeagueGroup({
  league,
  defaultExpanded = true,
  onFavoriteToggle,
  onMatchClick,
  onOddsClick,
  onMarketsClick,
  className,
}: FlashscoreLeagueGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={cn('border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden', className)}>
      <FlashscoreLeagueHeader
        leagueName={league.name}
        country={league.country}
        countryCode={league.countryCode}
        logo={league.logo}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      />

      {isExpanded && (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {league.matches.map((match) => (
            <FlashscoreMatchRow
              key={match.id}
              match={match}
              onFavoriteToggle={onFavoriteToggle}
              onMatchClick={onMatchClick}
              onOddsClick={onOddsClick}
              onMarketsClick={onMarketsClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
