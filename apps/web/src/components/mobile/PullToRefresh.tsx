'use client';

import { useState, useRef, useCallback, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

const PULL_THRESHOLD = 80;
const RESISTANCE = 2.5;

export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = PULL_THRESHOLD,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const canPull = useCallback(() => {
    if (disabled || isRefreshing) return false;
    const container = containerRef.current;
    if (!container) return false;
    return container.scrollTop <= 0;
  }, [disabled, isRefreshing]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!canPull()) return;
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    },
    [canPull]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling || !canPull()) return;

      currentY.current = e.touches[0].clientY;
      const distance = Math.max(0, (currentY.current - startY.current) / RESISTANCE);

      if (distance > 0) {
        setPullDistance(Math.min(distance, threshold * 1.5));
      }
    },
    [isPulling, canPull, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold / 2);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-y-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {showIndicator && (
        <div
          className="absolute left-0 right-0 flex items-center justify-center z-10 pointer-events-none"
          style={{
            top: 0,
            height: `${pullDistance}px`,
            transition: isPulling ? 'none' : 'height 0.3s ease-out',
          }}
        >
          <div
            className={cn(
              'flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-lg',
              'h-10 w-10 transition-transform',
              progress >= 1 && !isRefreshing && 'scale-110'
            )}
            style={{
              transform: `rotate(${progress * 360}deg)`,
              opacity: Math.min(progress * 1.5, 1),
            }}
          >
            {isRefreshing ? (
              <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
            ) : (
              <svg
                className="h-5 w-5 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
