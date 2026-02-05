'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';

interface MainLayoutProps {
  children: React.ReactNode;
}

const NO_HEADER_ROUTES = ['/admin', '/'];
const NO_BOTTOM_NAV_ROUTES = ['/admin', '/', '/auth', '/login', '/register'];

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  
  const shouldHideHeader = NO_HEADER_ROUTES.some(route => 
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  );

  const shouldHideBottomNav = NO_BOTTOM_NAV_ROUTES.some(route => 
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  );

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {!shouldHideHeader && <Header />}
      <main className="relative z-0">
        {children}
      </main>
      {!shouldHideBottomNav && <MobileBottomNav />}
    </div>
  );
}
