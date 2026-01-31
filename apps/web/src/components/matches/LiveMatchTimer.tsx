'use client';

import { useLiveMatchTime } from '@/hooks/useLiveMatchTime';

interface LiveMatchTimerProps {
  startTime: string;
  period?: string | null;
  liveMinute?: number | null;
  isLive: boolean;
  status: string;
  className?: string;
}

export function LiveMatchTimer({
  startTime,
  period,
  liveMinute,
  isLive,
  status,
  className,
}: LiveMatchTimerProps) {
  const { displayTime } = useLiveMatchTime({
    startTime,
    period,
    liveMinute,
    isLive,
    status,
    updateInterval: 1000,
  });

  return <span className={className}>{displayTime}</span>;
}
