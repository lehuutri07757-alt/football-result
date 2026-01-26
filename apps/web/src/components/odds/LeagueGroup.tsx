'use client';

import { LeagueOddsGroup } from '@/types/odds';
import { OddsRow } from './OddsRow';

interface LeagueGroupProps {
  league: LeagueOddsGroup;
  showHalfTime?: boolean;
}

export function LeagueGroup({ league, showHalfTime = false }: LeagueGroupProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden mb-4">
      <div className="flex items-center gap-3 px-4 py-3 bg-muted">
        {league.leagueLogo && (
          <img src={league.leagueLogo} alt="" className="w-6 h-6 object-contain" />
        )}
        <div className="flex-1">
          <h3 className="font-semibold">{league.leagueName}</h3>
          <span className="text-xs text-muted-foreground">{league.country}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {league.matches.length} matches
        </span>
      </div>

      <div className="divide-y divide-border">
        {league.matches.map((match) => (
          <OddsRow key={match.fixtureId} match={match} showHalfTime={showHalfTime} />
        ))}
      </div>
    </div>
  );
}
