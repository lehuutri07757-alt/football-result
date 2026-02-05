'use client';

import { cn } from '@/lib/utils';

interface Bet365DateHeaderProps {
  date: string;
  className?: string;
}

export function Bet365DateHeader({ date, className }: Bet365DateHeaderProps) {
  const formatDate = () => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: '2-digit', 
      month: 'short' 
    });
  };

  return (
    <div className={cn(
      'flex items-center bg-[#4a4a4a] text-white text-sm',
      className
    )}>
      <div className="flex-1 px-4 py-2 font-medium">
        {formatDate()}
      </div>
      <div className="flex items-center border-l border-[#3d3d3d]">
        <div className="w-[100px] py-2 text-center text-slate-300">1</div>
        <div className="w-[100px] py-2 text-center text-slate-300">X</div>
        <div className="w-[100px] py-2 text-center text-slate-300">2</div>
      </div>
    </div>
  );
}
