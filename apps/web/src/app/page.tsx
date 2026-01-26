'use client';

import type React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useHomeFeed } from '@/hooks/useHomeFeed';
import { 
  Trophy, 
  Search, 
  Bell, 
  Menu, 
  Flame, 
  Clock, 
  Calendar, 
  ChevronRight,
  MonitorPlay,
  Gamepad2,
  Dribbble
} from 'lucide-react';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useLanguageStore } from '@/stores/language.store';
import { t } from '@/lib/i18n';
import type { HomeMatch } from '@/types/home';

type MatchStatus = 'LIVE' | 'UPCOMING' | 'FINISHED';

interface Match {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  time: string;
  status: MatchStatus;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
  isHot?: boolean;
}

const CATEGORIES = [
  { id: 'all', name: 'All Sports', icon: Trophy },
  { id: 'football', name: 'Football', icon: Dribbble },
  { id: 'esports', name: 'Esports', icon: Gamepad2 },
  { id: 'basketball', name: 'Basketball', icon: Trophy },
  { id: 'tennis', name: 'Tennis', icon: Trophy },
];

const MOCK_MATCHES: Match[] = [
  {
    id: '1',
    league: 'Premier League',
    homeTeam: 'Manchester City',
    awayTeam: 'Arsenal',
    homeScore: 1,
    awayScore: 1,
    time: '65\'',
    status: 'LIVE',
    odds: { home: 2.15, draw: 3.10, away: 3.80 },
    isHot: true,
  },
  {
    id: '2',
    league: 'La Liga',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    time: '20:00',
    status: 'UPCOMING',
    odds: { home: 2.05, draw: 3.50, away: 3.20 },
    isHot: true,
  },
  {
    id: '3',
    league: 'Champions League',
    homeTeam: 'Bayern Munich',
    awayTeam: 'PSG',
    time: 'Tomorrow, 19:45',
    status: 'UPCOMING',
    odds: { home: 1.95, draw: 3.80, away: 3.60 },
  },
  {
    id: '4',
    league: 'Serie A',
    homeTeam: 'Juventus',
    awayTeam: 'AC Milan',
    homeScore: 0,
    awayScore: 0,
    time: '12\'',
    status: 'LIVE',
    odds: { home: 2.40, draw: 3.00, away: 3.10 },
  },
  {
    id: '5',
    league: 'NBA',
    homeTeam: 'Lakers',
    awayTeam: 'Warriors',
    time: '09:00',
    status: 'UPCOMING',
    odds: { home: 1.85, draw: 12.0, away: 1.95 },
  },
];

const Navbar = () => {
  const language = useLanguageStore((s) => s.language);
  
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-white/5 dark:bg-slate-950/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white lg:hidden">
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
              <Trophy className="h-5 w-5 text-white dark:text-slate-950" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sports<span className="text-emerald-500">Bet</span>
            </span>
          </Link>
        </div>

        <div className="hidden max-w-md flex-1 px-8 lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Search events, teams or leagues..." 
              className="w-full rounded-full border border-slate-200 bg-slate-100 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitch className="hidden sm:flex text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" />
          <button className="relative rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
          </button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
          <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
            Login
          </Link>
          <Link 
            href="/register" 
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-600 dark:text-slate-950 dark:hover:bg-emerald-400"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
};

const Hero = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-slate-800 p-6 sm:p-10 dark:from-emerald-900 dark:to-slate-900">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      
      <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-white border border-emerald-500/20 dark:text-emerald-400">
            <Flame className="h-3 w-3" />
            <span>Hot Match of the Day</span>
          </div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Manchester City <span className="text-emerald-400">vs</span> Arsenal
          </h1>
          <p className="text-slate-100 dark:text-slate-400">
            Premier League Title Decider. Get enhanced odds for this massive showdown at Etihad Stadium.
          </p>
          <div className="flex gap-3">
            <button className="rounded-lg bg-emerald-500 px-6 py-3 font-bold text-white dark:text-slate-950 transition hover:bg-emerald-600 dark:hover:bg-emerald-400 shadow-lg shadow-emerald-900/20">
              Bet Now
            </button>
            <button className="rounded-lg bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20">
              View Analytics
            </button>
          </div>
        </div>
        
        <div className="hidden lg:block">
          <div className="w-80 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md dark:border-white/10 dark:bg-black/20">
            <div className="flex items-center justify-between text-sm text-slate-200 dark:text-slate-400 mb-4">
              <span className="flex items-center gap-1"><MonitorPlay className="h-3 w-3" /> Live • 65'</span>
              <span>Premier League</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-bold shadow-lg">M</div>
                <span className="text-white font-bold">MCI</span>
              </div>
              <div className="text-3xl font-bold text-white tracking-widest drop-shadow-lg">1 - 1</div>
              <div className="text-center">
                <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-red-100 flex items-center justify-center text-red-900 font-bold shadow-lg">A</div>
                <span className="text-white font-bold">ARS</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded bg-emerald-500/20 py-1 text-center text-sm font-bold text-emerald-300 border border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20">2.15</div>
              <div className="rounded bg-white/10 py-1 text-center text-sm font-bold text-slate-200 dark:bg-white/5 dark:text-slate-300">3.10</div>
              <div className="rounded bg-white/10 py-1 text-center text-sm font-bold text-slate-200 dark:bg-white/5 dark:text-slate-300">3.80</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoryFilter = ({ active, setActive }: { active: string; setActive: (id: string) => void }) => {
  return (
    <div className="no-scrollbar -mx-4 flex overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
      <div className="flex gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActive(cat.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
              active === cat.id
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white'
            }`}
          >
            <cat.icon className="h-4 w-4" />
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};

const MatchCard = ({ match }: { match: Match }) => {
  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-emerald-500/50 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/50">
      <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          {match.status === 'LIVE' ? (
            <span className="flex items-center gap-1 font-bold text-red-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </span>
              LIVE
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Calendar className="h-3 w-3" />
              {match.status}
            </span>
          )}
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
          <span className="text-slate-600 dark:text-slate-300">{match.league}</span>
        </div>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {match.time}
        </span>
      </div>

      <div className="mb-5 flex items-center justify-between">
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800" />
              <span className="font-semibold text-slate-900 dark:text-white">{match.homeTeam}</span>
            </div>
            {match.status !== 'UPCOMING' && (
              <span className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">{match.homeScore}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800" />
              <span className="font-semibold text-slate-900 dark:text-white">{match.awayTeam}</span>
            </div>
            {match.status !== 'UPCOMING' && (
              <span className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">{match.awayScore}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button className="flex flex-col items-center justify-center rounded bg-slate-50 py-2 transition hover:bg-emerald-500 hover:text-white dark:bg-slate-950 dark:hover:bg-emerald-500 dark:hover:text-slate-950 group/btn">
          <span className="text-xs text-slate-500 group-hover/btn:text-emerald-100 dark:text-slate-500 dark:group-hover/btn:text-slate-800">1</span>
          <span className="font-bold text-emerald-600 group-hover/btn:text-white dark:text-emerald-400 dark:group-hover/btn:text-slate-900">{match.odds.home.toFixed(2)}</span>
        </button>
        <button className="flex flex-col items-center justify-center rounded bg-slate-50 py-2 transition hover:bg-emerald-500 hover:text-white dark:bg-slate-950 dark:hover:bg-emerald-500 dark:hover:text-slate-950 group/btn">
          <span className="text-xs text-slate-500 group-hover/btn:text-emerald-100 dark:text-slate-500 dark:group-hover/btn:text-slate-800">X</span>
          <span className="font-bold text-emerald-600 group-hover/btn:text-white dark:text-emerald-400 dark:group-hover/btn:text-slate-900">{match.odds.draw.toFixed(2)}</span>
        </button>
        <button className="flex flex-col items-center justify-center rounded bg-slate-50 py-2 transition hover:bg-emerald-500 hover:text-white dark:bg-slate-950 dark:hover:bg-emerald-500 dark:hover:text-slate-950 group/btn">
          <span className="text-xs text-slate-500 group-hover/btn:text-emerald-100 dark:text-slate-500 dark:group-hover/btn:text-slate-800">2</span>
          <span className="font-bold text-emerald-600 group-hover/btn:text-white dark:text-emerald-400 dark:group-hover/btn:text-slate-900">{match.odds.away.toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
};

const BottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/90 px-6 pb-6 pt-2 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
      <div className="flex justify-between">
        <Link href="/" className="flex flex-col items-center gap-1 text-emerald-600 dark:text-emerald-500">
          <Trophy className="h-6 w-6" />
          <span className="text-[10px] font-medium">Sports</span>
        </Link>
        <Link href="/live" className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white">
          <MonitorPlay className="h-6 w-6" />
          <span className="text-[10px] font-medium">Live</span>
        </Link>
        <div className="relative -top-6 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20 ring-4 ring-white dark:ring-slate-950">
            <Search className="h-6 w-6 text-white dark:text-slate-950" />
          </div>
        </div>
        <Link href="/my-bets" className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white">
          <Calendar className="h-6 w-6" />
          <span className="text-[10px] font-medium">My Bets</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white">
          <Menu className="h-6 w-6" />
          <span className="text-[10px] font-medium">Menu</span>
        </Link>
      </div>
    </div>
  );
};

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const { data: homeFeed } = useHomeFeed({ limit: 20 });

  const matchesForUI: Match[] =
    homeFeed?.topLiveMatches.map((m: HomeMatch) => ({
      id: m.id,
      league: m.leagueName,
      homeTeam: m.homeTeam.name,
      awayTeam: m.awayTeam.name,
      homeScore: m.homeScore ?? undefined,
      awayScore: m.awayScore ?? undefined,
      time: m.isLive ? `${m.liveMinute ?? 0}'` : new Date(m.startTime).toLocaleTimeString(),
      status: m.isLive ? 'LIVE' : 'UPCOMING',
      odds: { home: 0, draw: 0, away: 0 },
      isHot: false,
    })) ?? MOCK_MATCHES;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-200 transition-colors duration-300">
      <Navbar />

      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="mb-8">
          <Hero />
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Featured Matches</h2>
          <Link href="/matches" className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-500 dark:hover:text-emerald-400">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="mb-6">
          <CategoryFilter active={activeCategory} setActive={setActiveCategory} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {matchesForUI.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-slate-800 p-6 dark:from-blue-900 dark:to-slate-900 shadow-lg">
            <h3 className="mb-2 text-xl font-bold text-white">First Deposit Bonus</h3>
            <p className="mb-4 text-blue-100 dark:text-slate-400">Get 100% up to $200 on your first deposit. T&C apply.</p>
            <button className="rounded-lg bg-white text-blue-600 px-4 py-2 font-semibold hover:bg-blue-50 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-500 transition-colors">
              Claim Now
            </button>
          </div>
          <div className="overflow-hidden rounded-xl bg-gradient-to-br from-purple-600 to-slate-800 p-6 dark:from-purple-900 dark:to-slate-900 shadow-lg">
            <h3 className="mb-2 text-xl font-bold text-white">VIP Club</h3>
            <p className="mb-4 text-purple-100 dark:text-slate-400">Join our exclusive VIP club for higher limits and fast withdrawals.</p>
            <button className="rounded-lg bg-white text-purple-600 px-4 py-2 font-semibold hover:bg-purple-50 dark:bg-purple-600 dark:text-white dark:hover:bg-purple-500 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-12 pb-32 dark:border-slate-900 dark:bg-slate-950 lg:pb-12">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <div className="mb-4 flex justify-center gap-6">
            <Link href="#" className="hover:text-slate-900 dark:hover:text-white">About</Link>
            <Link href="#" className="hover:text-slate-900 dark:hover:text-white">Terms</Link>
            <Link href="#" className="hover:text-slate-900 dark:hover:text-white">Privacy</Link>
            <Link href="#" className="hover:text-slate-900 dark:hover:text-white">Contact</Link>
          </div>
          <p>© 2024 SportsBet. Demo/Learning project only.</p>
        </div>
      </footer>
      
      <BottomNav />
    </div>
  );
}
