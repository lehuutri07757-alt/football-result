'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface FlashscoreLeagueHeaderProps {
  leagueName: string;
  country: string;
  countryCode?: string;
  logo?: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function FlashscoreLeagueHeader({
  leagueName,
  country,
  countryCode,
  logo,
  isExpanded = true,
  onToggle,
  className,
}: FlashscoreLeagueHeaderProps) {
  const fallbackText = countryCode?.slice(0, 2).toUpperCase() ?? country.slice(0, 2).toUpperCase();

  return (
    <div className={cn(
      'flex items-center bg-slate-600 dark:bg-slate-800 text-white',
      'sticky top-0 z-10',
      className
    )}>
      <button
        onClick={onToggle}
        className="flex items-center gap-3 flex-1 px-3 py-2 hover:bg-slate-500 dark:hover:bg-slate-700 transition-colors"
      >
        {logo ? (
          <Image
            src={logo}
            alt={leagueName}
            width={20}
            height={20}
            className="object-contain"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-slate-500 flex items-center justify-center text-[10px] font-bold">
            {fallbackText}
          </div>
        )}
        <span className="font-medium text-sm">{leagueName}</span>
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform text-slate-400',
          !isExpanded && '-rotate-90'
        )} />
      </button>

      <div className="flex items-center text-sm">
        <div className="flex items-center border-l border-slate-500 dark:border-slate-700">
          <HeaderCell label="1" width={68} />
          <HeaderCell label="X" width={68} hasDropdown />
          <HeaderCell label="2" width={68} />
        </div>

        <div className="flex items-center border-l border-slate-500 dark:border-slate-700">
          <HeaderCell label="1X" width={68} />
          <HeaderCell label="12" width={68} hasDropdown />
          <HeaderCell label="2X" width={68} />
        </div>

        <div className="border-l border-slate-500 dark:border-slate-700">
          <HeaderCell label="+5" width={60} />
        </div>
      </div>
    </div>
  );
}

interface HeaderCellProps {
  label: string;
  width: number;
  hasDropdown?: boolean;
}

function HeaderCell({ label, width, hasDropdown }: HeaderCellProps) {
  return (
    <div 
      className={cn(
        'flex items-center justify-center gap-1 py-2 text-center',
        hasDropdown && 'cursor-pointer hover:bg-slate-500 dark:hover:bg-slate-700'
      )}
      style={{ width }}
    >
      <span className="font-medium">{label}</span>
      {hasDropdown && (
        <ChevronDown className="w-3 h-3 text-emerald-400" />
      )}
    </div>
  );
}
