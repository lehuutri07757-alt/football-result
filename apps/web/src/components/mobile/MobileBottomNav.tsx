'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Receipt, Star, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/bets', label: 'History', icon: Receipt },
  { href: '/favorites', label: 'Favorites', icon: Star },
  { href: '/profile', label: 'Profile', icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 safe-area-bottom">
      <div className="flex items-stretch justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1 tap-highlight-none transition-colors',
                active
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400 active:text-emerald-600 dark:active:text-emerald-400'
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'h-5 w-5 transition-transform',
                    active && 'scale-110'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium',
                  active && 'font-semibold'
                )}
              >
                {item.label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
