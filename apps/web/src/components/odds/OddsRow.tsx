'use client';

import { OddsTableRow } from '@/types/odds';
import { OddsColumn } from './OddsCell';

interface OddsRowProps {
  match: OddsTableRow;
  showHalfTime?: boolean;
}

export function OddsRow({ match, showHalfTime = false }: OddsRowProps) {
  const isMatchBettable = !['finished', 'cancelled', 'postponed'].includes(match.status);

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/30">
        <span className="text-primary font-mono text-sm">{match.matchTime}</span>
        {match.isLive && (
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {match.totalMarkets} markets
        </span>
      </div>

      <div className="grid grid-cols-[1fr,auto] gap-4 p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="w-6 text-center font-bold text-lg">
              {match.homeTeam.score ?? '-'}
            </span>
            {match.homeTeam.logo && (
              <img src={match.homeTeam.logo} alt="" className="w-6 h-6 object-contain" />
            )}
            <span className="font-medium">{match.homeTeam.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-6 text-center font-bold text-lg">
              {match.awayTeam.score ?? '-'}
            </span>
            {match.awayTeam.logo && (
              <img src={match.awayTeam.logo} alt="" className="w-6 h-6 object-contain" />
            )}
            <span className="font-medium">{match.awayTeam.name}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">HDP</div>
            <OddsColumn home={match.hdp?.home} away={match.hdp?.away} disabled={!isMatchBettable} />
          </div>

          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">O/U</div>
            <OddsColumn home={match.overUnder?.home} away={match.overUnder?.away} disabled={!isMatchBettable} />
          </div>

          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">1X2</div>
            <OddsColumn
              home={match.oneXTwo?.home}
              away={match.oneXTwo?.away}
              draw={match.oneXTwo?.draw}
              showDraw
              disabled={!isMatchBettable}
            />
          </div>

          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Home O/U</div>
            <OddsColumn home={match.homeGoalOU?.home} away={match.homeGoalOU?.away} disabled={!isMatchBettable} />
          </div>

          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Away O/U</div>
            <OddsColumn home={match.awayGoalOU?.home} away={match.awayGoalOU?.away} disabled={!isMatchBettable} />
          </div>

          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">BTTS</div>
            <OddsColumn home={match.btts?.home} away={match.btts?.away} disabled={!isMatchBettable} />
          </div>

          {showHalfTime && match.isLive && (
            <>
              <div className="border-l border-border pl-4 text-center">
                <div className="text-xs text-muted-foreground mb-1">HT HDP</div>
                <OddsColumn home={match.htHdp?.home} away={match.htHdp?.away} disabled={!isMatchBettable} />
              </div>

              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">HT O/U</div>
                <OddsColumn home={match.htOverUnder?.home} away={match.htOverUnder?.away} disabled={!isMatchBettable} />
              </div>

              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">HT 1X2</div>
                <OddsColumn
                  home={match.htOneXTwo?.home}
                  away={match.htOneXTwo?.away}
                  draw={match.htOneXTwo?.draw}
                  showDraw
                  disabled={!isMatchBettable}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
