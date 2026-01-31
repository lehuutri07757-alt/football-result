'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

type MatchPeriod = '1H' | 'HT' | '2H' | 'ET1' | 'ET2' | 'BT' | 'P' | 'FT' | 'NS' | 'PST' | 'CANC' | 'ABD' | 'AWD' | 'WO' | string;

const RUNNING_PERIODS: MatchPeriod[] = ['1H', '2H', 'ET1', 'ET2'];
const PAUSED_PERIODS: MatchPeriod[] = ['HT', 'BT', 'P', 'FT', 'NS', 'PST', 'CANC', 'ABD', 'AWD', 'WO'];

const FIRST_HALF_END = 45;
const SECOND_HALF_END = 90;
const EXTRA_TIME_FIRST_END = 105;
const EXTRA_TIME_SECOND_END = 120;
const HALF_TIME_DURATION_MS = 15 * 60 * 1000;
const MAX_STOPPAGE_TIME = 15;

export interface UseLiveMatchTimeOptions {
  startTime: string | Date;
  period?: MatchPeriod | null;
  liveMinute?: number | null;
  isLive: boolean;
  status: string;
  updateInterval?: number;
}

export interface LiveMatchTimeResult {
  minute: number;
  seconds: number;
  displayTime: string;
  isRunning: boolean;
  period: MatchPeriod;
  stoppageTime: number;
}

export function useLiveMatchTime(options: UseLiveMatchTimeOptions): LiveMatchTimeResult {
  const {
    startTime,
    period: apiPeriod,
    liveMinute: apiLiveMinute,
    isLive,
    status,
    updateInterval = 1000,
  } = options;

  const matchStartTime = useMemo(() => {
    return typeof startTime === 'string' ? new Date(startTime) : startTime;
  }, [startTime]);

  const calculateTime = useCallback((): LiveMatchTimeResult => {
    const now = new Date();

    if (!isLive || status !== 'live') {
      return {
        minute: apiLiveMinute ?? 0,
        seconds: 0,
        displayTime: status === 'finished' ? 'FT' : '--',
        isRunning: false,
        period: apiPeriod ?? 'NS',
        stoppageTime: 0,
      };
    }

    const currentPeriod: MatchPeriod = apiPeriod ?? '1H';

    if (PAUSED_PERIODS.includes(currentPeriod)) {
      const periodLabels: Record<string, string> = {
        'HT': 'HT',
        'FT': 'FT',
        'BT': 'BT',
        'P': 'PEN',
        'NS': '--',
        'PST': 'PST',
        'CANC': 'CANC',
        'ABD': 'ABD',
      };

      return {
        minute: apiLiveMinute ?? 0,
        seconds: 0,
        displayTime: periodLabels[currentPeriod] || currentPeriod,
        isRunning: false,
        period: currentPeriod,
        stoppageTime: 0,
      };
    }

    const elapsedMs = now.getTime() - matchStartTime.getTime();
    
    let minute: number;
    let seconds: number;
    let stoppageTime = 0;
    let periodEnd: number;

    if (currentPeriod === '1H') {
      periodEnd = FIRST_HALF_END;
      const totalSeconds = Math.floor(elapsedMs / 1000);
      minute = Math.floor(totalSeconds / 60);
      seconds = totalSeconds % 60;

      if (minute >= periodEnd) {
        stoppageTime = Math.min(minute - periodEnd, MAX_STOPPAGE_TIME);
        minute = periodEnd;
      }
    } else if (currentPeriod === '2H') {
      periodEnd = SECOND_HALF_END;
      const secondHalfElapsedMs = elapsedMs - (FIRST_HALF_END * 60 * 1000) - HALF_TIME_DURATION_MS;
      
      if (secondHalfElapsedMs < 0) {
        minute = FIRST_HALF_END;
        seconds = 0;
      } else {
        const totalSeconds = Math.floor(secondHalfElapsedMs / 1000);
        minute = FIRST_HALF_END + Math.floor(totalSeconds / 60);
        seconds = totalSeconds % 60;

        if (minute >= periodEnd) {
          stoppageTime = Math.min(minute - periodEnd, MAX_STOPPAGE_TIME);
          minute = periodEnd;
        }
      }
    } else if (currentPeriod === 'ET1') {
      periodEnd = EXTRA_TIME_FIRST_END;
      minute = apiLiveMinute ?? SECOND_HALF_END;
      seconds = Math.floor((elapsedMs % 60000) / 1000);

      if (minute >= periodEnd) {
        stoppageTime = Math.min(minute - periodEnd, MAX_STOPPAGE_TIME);
        minute = periodEnd;
      }
    } else if (currentPeriod === 'ET2') {
      periodEnd = EXTRA_TIME_SECOND_END;
      minute = apiLiveMinute ?? EXTRA_TIME_FIRST_END;
      seconds = Math.floor((elapsedMs % 60000) / 1000);

      if (minute >= periodEnd) {
        stoppageTime = Math.min(minute - periodEnd, MAX_STOPPAGE_TIME);
        minute = periodEnd;
      }
    } else {
      minute = apiLiveMinute ?? Math.floor(elapsedMs / 60000);
      seconds = Math.floor((elapsedMs % 60000) / 1000);
    }

    if (apiLiveMinute !== null && apiLiveMinute !== undefined) {
      const apiMinute = apiLiveMinute;
      
      if (currentPeriod === '1H' && apiMinute > FIRST_HALF_END) {
        stoppageTime = Math.min(apiMinute - FIRST_HALF_END, MAX_STOPPAGE_TIME);
        minute = FIRST_HALF_END;
      } else if (currentPeriod === '2H' && apiMinute > SECOND_HALF_END) {
        stoppageTime = Math.min(apiMinute - SECOND_HALF_END, MAX_STOPPAGE_TIME);
        minute = SECOND_HALF_END;
      } else if (currentPeriod === '1H' || currentPeriod === '2H') {
        minute = apiMinute;
      }
    }

    const paddedSeconds = seconds.toString().padStart(2, '0');
    let displayTime: string;

    if (stoppageTime > 0) {
      displayTime = `${minute}+${stoppageTime}:${paddedSeconds}`;
    } else {
      displayTime = `${minute}:${paddedSeconds}`;
    }

    return {
      minute: minute + stoppageTime,
      seconds,
      displayTime,
      isRunning: RUNNING_PERIODS.includes(currentPeriod),
      period: currentPeriod,
      stoppageTime,
    };
  }, [matchStartTime, apiPeriod, apiLiveMinute, isLive, status]);

  const [timeResult, setTimeResult] = useState<LiveMatchTimeResult>(() => calculateTime());

  useEffect(() => {
    if (!isLive || status !== 'live') {
      setTimeResult(calculateTime());
      return;
    }

    setTimeResult(calculateTime());

    const interval = setInterval(() => {
      setTimeResult(calculateTime());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [isLive, status, calculateTime, updateInterval]);

  useEffect(() => {
    setTimeResult(calculateTime());
  }, [apiLiveMinute, apiPeriod, calculateTime]);

  return timeResult;
}

export function getMatchDisplayTime(options: {
  startTime: string | Date;
  period?: string | null;
  liveMinute?: number | null;
  isLive: boolean;
  status: string;
}): string {
  const { period, liveMinute, isLive, status } = options;

  if (!isLive || status !== 'live') {
    return status === 'finished' ? 'FT' : '--';
  }

  if (period === 'HT') return 'HT';
  if (period === 'FT') return 'FT';
  if (period === 'BT') return 'BT';
  if (period === 'P') return 'PEN';

  if (liveMinute !== null && liveMinute !== undefined) {
    if (period === '1H' && liveMinute > FIRST_HALF_END) {
      return `${FIRST_HALF_END}+${liveMinute - FIRST_HALF_END}'`;
    }
    if (period === '2H' && liveMinute > SECOND_HALF_END) {
      return `${SECOND_HALF_END}+${liveMinute - SECOND_HALF_END}'`;
    }
    return `${liveMinute}'`;
  }

  return '--';
}
