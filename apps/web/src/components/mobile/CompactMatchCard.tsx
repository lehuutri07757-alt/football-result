'use client';

import { Trophy, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Match } from '@/services/match.service';
import Link from 'next/link';
import { useMemo } from 'react';

interface CompactMatchCardProps {
  match: Match;
  className?: string;
}

export function CompactMatchCard({ match, className }: CompactMatchCardProps) {
  const isLive = match.status === 'live' || match.isLive;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  };

  const odds = useMemo(() => {
    const seed = match.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const random = (min: number, max: number, offset: number) => {
      const x = Math.sin(seed + offset) * 10000;
      return (min + (x - Math.floor(x)) * (max - min)).toFixed(2);
    };
    return {
      home: random(1.3, 6, 1),
      draw: random(2.5, 5, 2),
      away: random(1.3, 6, 3),
    };
  }, [match.id]);

  const liveMinute = match.liveMinute ?? Math.floor((Date.now() - new Date(match.startTime).getTime()) / 60000);

  return (
    <div
      className={cn(
        'bg-card rounded-lg overflow-hidden border border-border shadow-sm',
        className
      )}
    >
      <div className="flex items-stretch">
        <Link
          href={`/matches/${match.id}`}
          className="flex-1 p-3 min-w-0 tap-highlight-none active:bg-muted/50"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {match.homeTeam?.logoUrl ? (
                <img
                  src={match.homeTeam.logoUrl}
                  alt=""
                  className="h-5 w-5 object-contain flex-shrink-0"
                />
              ) : (
                <div className="h-5 w-5 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <Trophy className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
              <span className="text-sm font-medium text-foreground truncate">
                {match.homeTeam?.name || 'Home'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {match.awayTeam?.logoUrl ? (
                <img
                  src={match.awayTeam.logoUrl}
                  alt=""
                  className="h-5 w-5 object-contain flex-shrink-0"
                />
              ) : (
                <div className="h-5 w-5 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <Trophy className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
              <span className="text-sm font-medium text-foreground truncate">
                {match.awayTeam?.name || 'Away'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            {isLive ? (
              <span className="text-xs font-medium text-red-500">{liveMinute}&apos;</span>
            ) : (
              <span className="text-xs">{formatTime(match.startTime)}</span>
            )}
          </div>
        </Link>

        <div className="hidden min-[400px]:flex items-center border-l border-border">
          <button className="h-full px-1 flex items-center justify-center text-muted-foreground hover:bg-muted">
            <BarChart3 className="h-4 w-4" />
          </button>
        </div>

        {match.bettingEnabled && (
          <div className="flex items-center flex-shrink-0">
            <button className="flex flex-col items-center justify-center px-3 py-2 min-w-[52px] bg-card hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:bg-emerald-100 dark:active:bg-emerald-950/50 transition-colors border-l border-border">
              <span className="text-[10px] text-muted-foreground font-medium">1</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{odds.home}</span>
            </button>
            <button className="flex flex-col items-center justify-center px-3 py-2 min-w-[52px] bg-card hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:bg-emerald-100 dark:active:bg-emerald-950/50 transition-colors border-l border-border">
              <span className="text-[10px] text-muted-foreground font-medium">X</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{odds.draw}</span>
            </button>
            <button className="flex flex-col items-center justify-center px-3 py-2 min-w-[52px] bg-card hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:bg-emerald-100 dark:active:bg-emerald-950/50 transition-colors border-l border-border">
              <span className="text-[10px] text-muted-foreground font-medium">2</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{odds.away}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
