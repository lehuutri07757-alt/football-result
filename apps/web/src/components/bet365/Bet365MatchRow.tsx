'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Bet365Match } from '@/types/bet365';
import { BarChart2, Play } from 'lucide-react';

interface Bet365MatchRowProps {
  match: Bet365Match;
  onMatchClick?: (matchId: string) => void;
  onOddsClick?: (matchId: string, selection: 'home' | 'draw' | 'away') => void;
  onMarketsClick?: (matchId: string) => void;
  className?: string;
}

export function Bet365MatchRow({
  match,
  onMatchClick,
  onOddsClick,
  onMarketsClick,
  className,
}: Bet365MatchRowProps) {
  const isMatchBettable = match.status !== 'finished';

  const formatTime = () => {
    const date = new Date(match.startTime);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn(
      'flex items-center bg-[#2b2b2b] hover:bg-[#333333] border-b border-[#3d3d3d]',
      className
    )}>
      <div 
        className="flex-1 py-3 px-4 cursor-pointer"
        onClick={() => onMatchClick?.(match.id)}
      >
        <div className="flex items-center gap-2 mb-1">
          {match.homeTeam.logo ? (
            <Image
              src={match.homeTeam.logo}
              alt={match.homeTeam.name}
              width={16}
              height={16}
              className="object-contain"
            />
          ) : (
            <div className="w-4 h-4 rounded bg-slate-600" />
          )}
          <span className="text-sm text-white">{match.homeTeam.name}</span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          {match.awayTeam.logo ? (
            <Image
              src={match.awayTeam.logo}
              alt={match.awayTeam.name}
              width={16}
              height={16}
              className="object-contain"
            />
          ) : (
            <div className="w-4 h-4 rounded bg-slate-600" />
          )}
          <span className="text-sm text-white">{match.awayTeam.name}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{formatTime()}</span>
          {match.hasStream && (
            <button className="p-0.5 hover:text-white">
              <Play className="w-3 h-3" fill="currentColor" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarketsClick?.(match.id);
            }}
            className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
          >
            {match.totalMarkets}&gt;&gt;
          </button>
        </div>
      </div>

      {match.hasStats && (
        <div className="px-2">
          <button className="p-1.5 text-slate-400 hover:text-white">
            <BarChart2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center border-l border-[#3d3d3d]">
        <OddsButton
          value={match.odds?.home.value}
          suspended={match.odds?.home.suspended}
          disabled={!isMatchBettable}
          onClick={() => onOddsClick?.(match.id, 'home')}
        />
        <OddsButton
          value={match.odds?.draw.value}
          suspended={match.odds?.draw.suspended}
          disabled={!isMatchBettable}
          onClick={() => onOddsClick?.(match.id, 'draw')}
        />
        <OddsButton
          value={match.odds?.away.value}
          suspended={match.odds?.away.suspended}
          disabled={!isMatchBettable}
          onClick={() => onOddsClick?.(match.id, 'away')}
        />
      </div>
    </div>
  );
}

interface OddsButtonProps {
  value?: number;
  suspended?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

function OddsButton({ value, suspended, disabled = false, onClick }: OddsButtonProps) {
  if (!value) {
    return (
      <div className="w-[100px] h-full flex items-center justify-center text-slate-500">
        -
      </div>
    );
  }

  const isDisabled = suspended || disabled;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'w-[100px] py-4 text-center',
        'text-[#ffdf1b] font-medium hover:bg-[#3d3d3d]',
        'transition-colors',
        isDisabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {value.toFixed(2)}
    </button>
  );
}
