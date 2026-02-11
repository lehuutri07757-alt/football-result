'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { DesktopBetSlip } from '@/components/desktop/DesktopBetSlip';
import { FloatingBetSlip } from '@/components/mobile/FloatingBetSlip';

interface MainLayoutProps {
  children: React.ReactNode;
}

const NO_HEADER_ROUTES = ['/admin', '/', '/login'];
const NO_BOTTOM_NAV_ROUTES = ['/admin', '/', '/auth', '/login', '/register'];
const NO_BETSLIP_ROUTES = ['/admin', '/', '/auth', '/login', '/register', '/wallet', '/bets', '/settings', '/profile'];

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  
  const shouldHideHeader = NO_HEADER_ROUTES.some(route => 
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  );

  const shouldHideBottomNav = NO_BOTTOM_NAV_ROUTES.some(route => 
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  );

  const shouldHideBetSlip = NO_BETSLIP_ROUTES.some(route =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {!shouldHideHeader && <Header />}
      <div className="flex">
        <main className="flex-1 relative z-0 min-w-0">
          {children}
        </main>
        {!shouldHideBetSlip && <DesktopBetSlip />}
      </div>
      {!shouldHideBetSlip && <FloatingBetSlip />}
      {!shouldHideBottomNav && <MobileBottomNav />}
    </div>
  );
}
