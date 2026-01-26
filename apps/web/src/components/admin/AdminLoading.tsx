'use client';

import { useAdminTheme } from '@/contexts/AdminThemeContext';

interface AdminLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export function AdminLoading({ 
  size = 'md', 
  text,
  fullScreen = false 
}: AdminLoadingProps) {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';

  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-14 h-14 border-4',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 backdrop-blur-sm'
    : 'py-20';

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${containerClasses} ${
      fullScreen ? (isDark ? 'bg-slate-900/80' : 'bg-white/80') : ''
    }`}>
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full animate-spin ${
            isDark 
              ? 'border-emerald-500/30 border-t-emerald-500' 
              : 'border-emerald-200 border-t-emerald-500'
          }`}
        />
        <div
          className={`absolute inset-0 ${sizeClasses[size]} rounded-full animate-ping opacity-20 ${
            isDark ? 'bg-emerald-500' : 'bg-emerald-400'
          }`}
          style={{ animationDuration: '1.5s' }}
        />
      </div>
      {text && (
        <p className={`text-sm font-medium animate-pulse ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {text}
        </p>
      )}
    </div>
  );
}

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  showHeader?: boolean;
}

export function TableSkeleton({ 
  columns, 
  rows = 5,
  showHeader = true 
}: TableSkeletonProps) {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';

  const skeletonBase = isDark 
    ? 'bg-slate-700' 
    : 'bg-slate-200';
  
  const shimmerClass = 'animate-pulse';

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        {showHeader && (
          <thead>
            <tr className={isDark ? 'bg-slate-700/50' : 'bg-slate-50'}>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className={`h-4 ${skeletonBase} ${shimmerClass} rounded w-20`} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-3">
                  <div 
                    className={`h-4 ${skeletonBase} ${shimmerClass} rounded`}
                    style={{ 
                      width: `${Math.floor(Math.random() * 40) + 60}%`,
                      animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface TableLoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
}

export function TableLoadingOverlay({ loading, children }: TableLoadingOverlayProps) {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';

  return (
    <div className="relative">
      {children}
      {loading && (
        <div className={`absolute inset-0 flex items-center justify-center ${
          isDark ? 'bg-slate-800/70' : 'bg-white/70'
        } backdrop-blur-[2px] transition-opacity duration-200`}>
          <div className="flex flex-col items-center gap-3">
            <div className={`w-8 h-8 border-3 rounded-full animate-spin ${
              isDark 
                ? 'border-emerald-500/30 border-t-emerald-500' 
                : 'border-emerald-200 border-t-emerald-500'
            }`} />
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Loading...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
