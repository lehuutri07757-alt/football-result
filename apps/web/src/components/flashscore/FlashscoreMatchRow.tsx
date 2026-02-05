'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { FlashscoreMatch } from '@/types/flashscore';
import { FlashscoreOddsCell, FlashscoreMarketsBadge } from './FlashscoreOddsCell';
import { Star, BarChart3, LineChart, ListOrdered, ChevronDown } from 'lucide-react';

interface FlashscoreMatchRowProps {
  match: FlashscoreMatch;
  onFavoriteToggle?: (matchId: string) => void;
  onMatchClick?: (matchId: string) => void;
  onOddsClick?: (matchId: string, market: string, selection: string) => void;
  onMarketsClick?: (matchId: string) => void;
  className?: string;
}

export function FlashscoreMatchRow({
  match,
  onFavoriteToggle,
  onMatchClick,
  onOddsClick,
  onMarketsClick,
  className,
}: FlashscoreMatchRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLive = match.status === 'live' || match.status === 'half_time';

  const formatMatchTime = () => {
    if (isLive && match.matchMinute !== undefined) {
      return `${match.matchMinute}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
    }
    const date = new Date(match.startTime);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const formatMatchInfo = () => {
    const parts: string[] = [];
    if (match.period) parts.push(match.period);
    if (match.round) parts.push(match.round);
    return parts.join(' / ');
  };

  return (
    <div className={cn('bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50', className)}>
      <div className="flex items-stretch min-h-[90px]">
        <div className="flex flex-col justify-center items-center w-10 border-r border-slate-200 dark:border-slate-700">
          <button
            onClick={() => onFavoriteToggle?.(match.id)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
          >
            <Star className={cn(
              'w-4 h-4',
              match.isFavorite 
                ? 'text-yellow-500 fill-yellow-500' 
                : 'text-slate-300 dark:text-slate-600'
            )} />
          </button>
        </div>

        <div 
          className="flex-1 py-2 px-3 cursor-pointer"
          onClick={() => onMatchClick?.(match.id)}
        >
          <div className="flex items-center gap-3 py-1">
            {match.homeTeam.logo ? (
              <Image
                src={match.homeTeam.logo}
                alt={match.homeTeam.name}
                width={18}
                height={18}
                className="object-contain"
              />
            ) : (
              <div className="w-[18px] h-[18px] rounded-full bg-slate-200 dark:bg-slate-700" />
            )}
            <span className="flex-1 text-sm font-medium">{match.homeTeam.name}</span>
          </div>

          <div className="flex items-center gap-3 py-1">
            {match.awayTeam.logo ? (
              <Image
                src={match.awayTeam.logo}
                alt={match.awayTeam.name}
                width={18}
                height={18}
                className="object-contain"
              />
            ) : (
              <div className="w-[18px] h-[18px] rounded-full bg-slate-200 dark:bg-slate-700" />
            )}
            <span className="flex-1 text-sm font-medium">{match.awayTeam.name}</span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className={cn(
              'font-mono',
              isLive && 'text-red-500 font-medium'
            )}>
              {formatMatchTime()}
            </span>
            {formatMatchInfo() && (
              <>
                <span>/</span>
                <span>{formatMatchInfo()}</span>
              </>
            )}
            
            <div className="flex items-center gap-1 ml-2">
              {match.hasStats && (
                <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                </button>
              )}
              {match.hasAnalysis && (
                <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                  <LineChart className="w-4 h-4 text-slate-400" />
                </button>
              )}
              {match.hasLineup && (
                <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                  <ListOrdered className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded ml-auto"
            >
              <ChevronDown className={cn(
                'w-4 h-4 text-slate-400 transition-transform',
                isExpanded && 'rotate-180'
              )} />
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-center w-8 text-center border-l border-slate-200 dark:border-slate-700">
          <span className={cn(
            'text-sm font-bold tabular-nums',
            isLive && 'text-red-500'
          )}>
            {match.homeTeam.score ?? 0}
          </span>
          <span className={cn(
            'text-sm font-bold tabular-nums',
            isLive && 'text-red-500'
          )}>
            {match.awayTeam.score ?? 0}
          </span>
        </div>

        <div className="flex flex-col justify-center w-8 text-center border-l border-slate-200 dark:border-slate-700">
          <span className="text-sm text-slate-400 tabular-nums">
            {match.homeTeam.halfTimeScore ?? 0}
          </span>
          <span className="text-sm text-slate-400 tabular-nums">
            {match.awayTeam.halfTimeScore ?? 0}
          </span>
        </div>

        <div className="flex items-center gap-1 px-2 border-l border-slate-200 dark:border-slate-700">
          <FlashscoreOddsCell
            odds={match.oneXTwo?.home}
            onClick={() => onOddsClick?.(match.id, '1x2', 'home')}
          />
          <FlashscoreOddsCell
            odds={match.oneXTwo?.draw}
            onClick={() => onOddsClick?.(match.id, '1x2', 'draw')}
          />
          <FlashscoreOddsCell
            odds={match.oneXTwo?.away}
            onClick={() => onOddsClick?.(match.id, '1x2', 'away')}
          />
        </div>

        <div className="flex items-center gap-1 px-2 border-l border-slate-200 dark:border-slate-700">
          <FlashscoreOddsCell
            odds={match.doubleChance?.homeOrDraw}
            onClick={() => onOddsClick?.(match.id, 'dc', 'homeOrDraw')}
          />
          <FlashscoreOddsCell
            odds={match.doubleChance?.homeOrAway}
            onClick={() => onOddsClick?.(match.id, 'dc', 'homeOrAway')}
          />
          <FlashscoreOddsCell
            odds={match.doubleChance?.awayOrDraw}
            onClick={() => onOddsClick?.(match.id, 'dc', 'awayOrDraw')}
          />
        </div>

        <div className="flex items-center border-l border-slate-200 dark:border-slate-700">
          <FlashscoreMarketsBadge
            count={match.totalMarkets}
            onClick={() => onMarketsClick?.(match.id)}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <div className="text-sm text-muted-foreground">
            Additional markets coming soon...
          </div>
        </div>
      )}
    </div>
  );
}
