'use client';

import Link from 'next/link';
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
          {league.leagueSlug ? (
            <Link href={`/leagues/${league.leagueSlug}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              <h3 className="font-semibold">{league.leagueName}</h3>
            </Link>
          ) : (
            <h3 className="font-semibold">{league.leagueName}</h3>
          )}
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
