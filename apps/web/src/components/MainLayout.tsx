'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

const NO_HEADER_ROUTES = ['/admin', '/'];

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  
  const shouldHideHeader = NO_HEADER_ROUTES.some(route => 
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {!shouldHideHeader && <Header />}
      {children}
    </div>
  );
}
