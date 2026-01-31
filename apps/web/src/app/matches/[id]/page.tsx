'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Star,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { matchesService, Match } from '@/services/match.service';
import { oddsService } from '@/services/odds.service';
import { OddsTableRow, OddsCell } from '@/types/odds';
import { useLiveMatchTime } from '@/hooks/useLiveMatchTime';

interface BetSelection {
  id: string;
  marketName: string;
  selectionName: string;
  odds: number;
  matchId: string;
  matchName: string;
  handicap?: string;
}

type TabType = 'popular' | 'custom' | 'handicap' | 'goals' | 'intervals' | 'corners' | 'all';

const sportsCategories = [
  { id: 1, name: 'Football', icon: '⚽', count: 1046, active: true },
  { id: 2, name: 'eSports', icon: '🎮', count: 71, active: false },
  { id: 3, name: 'Basketball', icon: '🏀', count: 306, active: false },
  { id: 4, name: 'Tennis', icon: '🎾', count: 192, active: false },
  { id: 5, name: 'Hockey', icon: '🏒', count: 259, active: false },
  { id: 6, name: 'Baseball', icon: '⚾', count: 89, active: false },
];

export default function MatchDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [match, setMatch] = useState<Match | null>(null);
  const [odds, setOdds] = useState<OddsTableRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('popular');
  
  const [betSlip, setBetSlip] = useState<BetSelection[]>([]);
  
  const fetchData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setIsRefreshing(true);
    setError(null);
    
    try {
      const matchData = await matchesService.getById(id);
      setMatch(matchData);
      
      if (matchData.externalId) {
        const fixtureId = parseInt(matchData.externalId);
        if (!isNaN(fixtureId)) {
          try {
            const oddsData = await oddsService.getFixtureOdds(fixtureId);
            setOdds(oddsData);
          } catch (oddsError) {
            console.warn('Could not fetch odds:', oddsError);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching match data:', err);
      setError('Failed to load match details. Please try again.');
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  useEffect(() => {
    if (id) {
      fetchData(true);
    }
  }, [id]);
  
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (match?.isLive && !isLoading) {
      intervalId = setInterval(() => {
        fetchData(false);
      }, 30000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [match?.isLive, isLoading]);
  
  const addToBetSlip = (
    marketName: string, 
    selectionName: string, 
    oddsCell: OddsCell
  ) => {
    if (oddsCell.suspended) return;
    
    const selection: BetSelection = {
      id: `${marketName}-${selectionName}`,
      marketName,
      selectionName,
      odds: oddsCell.odds,
      matchId: match?.id || '',
      matchName: `${match?.homeTeam?.name} vs ${match?.awayTeam?.name}`,
      handicap: oddsCell.handicap
    };
    
    setBetSlip([selection]);
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'popular', label: 'PHỔ BIẾN' },
    { id: 'custom', label: 'CƯỢC TÙY CHỌN' },
    { id: 'handicap', label: 'CƯỢC CHẤP & CƯỢC TRÊN DƯỚI' },
    { id: 'goals', label: 'BÀN THẮNG' },
    { id: 'intervals', label: 'INTERVALS' },
    { id: 'corners', label: 'PHẠT GÓC' },
    { id: 'all', label: 'TẤT CẢ LOẠI CƯỢC' },
  ];

  return (
    <div className="flex min-h-[calc(100vh-64px)] overflow-hidden">
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white/50 dark:border-white/5 dark:bg-slate-950/50">
          <div className="p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Sports</h3>
            <div className="space-y-1">
              {sportsCategories.map((sport) => (
                <button
                  key={sport.id}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all ${
                    sport.active 
                      ? 'bg-emerald-500/10 text-emerald-600 font-medium dark:text-emerald-500'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span>{sport.icon}</span>
                    <span>{sport.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-md ${
                    sport.active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-500' : 'bg-slate-200 text-slate-600 dark:bg-slate-900'
                  }`}>
                    {sport.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-auto p-4 border-t border-slate-200 dark:border-white/5">
            <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-center dark:from-indigo-600">
              <Star className="h-8 w-8 text-yellow-300 mx-auto mb-2" />
              <h4 className="font-bold text-white mb-1">VIP Club</h4>
              <p className="text-xs text-indigo-100 mb-3">Unlock exclusive bonuses</p>
              <button className="w-full py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-lg transition-colors backdrop-blur-sm">
                View Status
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto scrollbar-hide">
          {isLoading && !match ? (
            <MatchSkeleton />
          ) : error || !match ? (
            <div className="flex items-center justify-center h-full">
              <Card className="max-w-md mx-auto">
                <CardContent className="pt-6 text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">Error Loading Match</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">{error || 'Match not found'}</p>
                  <Button onClick={() => fetchData(true)} className="bg-emerald-500 hover:bg-emerald-600">Retry</Button>
                  <div className="mt-4">
                    <Link href="/matches" className="text-emerald-500 hover:underline text-sm">
                      Back to Matches
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <MatchContent 
              match={match}
              odds={odds}
              isRefreshing={isRefreshing}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              tabs={tabs}
              addToBetSlip={addToBetSlip}
            />
          )}
        </main>
    </div>
  );
}

function MatchContent({
  match,
  odds,
  isRefreshing,
  activeTab,
  setActiveTab,
  tabs,
  addToBetSlip
}: {
  match: Match;
  odds: OddsTableRow | null;
  isRefreshing: boolean;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  tabs: { id: TabType; label: string }[];
  addToBetSlip: (market: string, selection: string, odds: OddsCell) => void;
}) {
  const isLive = match.status === 'live';
  const homeTeamName = match.homeTeam?.name?.toUpperCase() || 'HOME';
  const awayTeamName = match.awayTeam?.name?.toUpperCase() || 'AWAY';
  const leagueName = match.league?.name?.toUpperCase() || 'LEAGUE';
  
  const homeStats = { redCards: 0, yellowCards: 1, corners: 2 };
  const awayStats = { redCards: 0, yellowCards: 3, corners: 4 };
  
  const { displayTime, period } = useLiveMatchTime({
    startTime: match.startTime,
    period: match.period,
    liveMinute: match.liveMinute,
    isLive,
    status: match.status,
    updateInterval: 1000,
  });

  return (
    <div className="min-h-full">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Link href="/matches" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{leagueName}</span>
        </div>
        <Link href="/matches" className="text-emerald-600 dark:text-emerald-500 text-sm font-medium hover:underline">
          Đổi Trận Đấu
        </Link>
      </div>

      <div className="p-4 lg:p-6">
        <Card className="relative overflow-hidden bg-gradient-to-b from-green-600/10 via-green-500/5 to-transparent dark:from-green-900/20 dark:via-green-800/10 border-slate-200 dark:border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 via-transparent to-green-600/10 dark:from-green-700/20 dark:to-green-700/20" />
          
          <CardContent className="relative z-10 py-8">
            <div className="flex items-center justify-center gap-8">
              <div className="flex flex-col items-center">
                <span className="text-slate-900 dark:text-white font-bold text-lg tracking-wide">{homeTeamName}</span>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-4 bg-red-600 rounded-sm inline-block"></span>
                    <span className="text-slate-600 dark:text-slate-300">{homeStats.redCards}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-4 bg-yellow-400 rounded-sm inline-block"></span>
                    <span className="text-slate-600 dark:text-slate-300">{homeStats.yellowCards}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-slate-400">⚑</span>
                    <span className="text-slate-600 dark:text-slate-300">{homeStats.corners}</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-4">
                  <span className="text-5xl font-bold text-slate-900 dark:text-white">{match.homeScore ?? 0}</span>
                  <span className="text-5xl font-bold text-slate-900 dark:text-white">{match.awayScore ?? 0}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  {isLive ? displayTime : 'VS'}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-slate-900 dark:text-white font-bold text-lg tracking-wide">{awayTeamName}</span>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-4 bg-red-600 rounded-sm inline-block"></span>
                    <span className="text-slate-600 dark:text-slate-300">{awayStats.redCards}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-4 bg-yellow-400 rounded-sm inline-block"></span>
                    <span className="text-slate-600 dark:text-slate-300">{awayStats.yellowCards}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-slate-400">⚑</span>
                    <span className="text-slate-600 dark:text-slate-300">{awayStats.corners}</span>
                  </span>
                </div>
              </div>
            </div>

            {isRefreshing && (
              <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <RefreshCw className="h-3 w-3 animate-spin" /> Updating...
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === 'popular' && (
            <div className="space-y-4">
              <MainMarketSection 
                homeTeamName={homeTeamName}
                awayTeamName={awayTeamName}
                odds={odds}
                onSelect={addToBetSlip}
              />

              <div className="mt-6">
                <div className="inline-block bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300">
                  60 - 75 Phút ({match.homeScore ?? 0} - {match.awayScore ?? 0})
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'popular' && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <p>Đang phát triển...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MainMarketSection({ 
  homeTeamName, 
  awayTeamName, 
  odds,
  onSelect 
}: { 
  homeTeamName: string; 
  awayTeamName: string;
  odds: OddsTableRow | null;
  onSelect: (market: string, selection: string, odds: OddsCell) => void;
}) {
  const mockOdds = {
    handicap: [
      { home: { handicap: '+0/0.5', odds: 0.59 }, away: { handicap: '-0/0.5', odds: 1.44 }, over: { handicap: 'O0.5', odds: 0.82 }, under: { handicap: 'U0.5', odds: 1.06 } },
      { home: { handicap: '0', odds: 1.58 }, away: { handicap: '0', odds: 0.53 }, over: { handicap: 'O0.5/1', odds: 1.20 }, under: { handicap: 'U0.5/1', odds: 0.71 } },
    ],
    oneXTwo: { home: 4.85, draw: 1.74, away: 3.15 },
    team1OU: { over: { handicap: 'O0.5', odds: 2.12 }, under: { handicap: 'U0.5', odds: 0.30 } },
    team2OU: { over: { handicap: 'O0.5', odds: 1.44 }, under: { handicap: 'U0.5', odds: 0.52 } },
    oddEven: { odd: 1.38, even: 0.59 },
    bothScore: { yes: 9.3, no: 1.02 },
  };

  const createOddsCell = (label: string, oddsValue: number, handicap: string): OddsCell => ({
    label,
    odds: oddsValue,
    handicap,
    suspended: false
  });

  return (
    <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <span className="font-bold text-slate-900 dark:text-white">CƯỢC CHÍNH</span>
        <button className="text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-500 transition-colors">
          <Star className="h-5 w-5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-center text-slate-600 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <th className="py-3 px-4 font-medium">{homeTeamName}</th>
              <th className="py-3 px-4 font-medium">{awayTeamName}</th>
              <th className="py-3 px-4 border-l border-slate-200 dark:border-slate-700 font-medium">Trên</th>
              <th className="py-3 px-4 font-medium">Dưới</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-950">
            <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
              <td className="py-4 px-4">
                <OddsButtonCell 
                  handicap="+0/0.5" 
                  odds={mockOdds.handicap[0].home.odds}
                  onClick={() => onSelect('Handicap', homeTeamName, createOddsCell(homeTeamName, mockOdds.handicap[0].home.odds, '+0/0.5'))}
                />
              </td>
              <td className="py-4 px-4">
                <OddsButtonCell 
                  handicap="-0/0.5" 
                  odds={mockOdds.handicap[0].away.odds}
                  onClick={() => onSelect('Handicap', awayTeamName, createOddsCell(awayTeamName, mockOdds.handicap[0].away.odds, '-0/0.5'))}
                />
              </td>
              <td className="py-4 px-4 border-l border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                <OddsButtonCell 
                  handicap="O0.5" 
                  odds={mockOdds.handicap[0].over.odds}
                  onClick={() => onSelect('Over/Under', 'Over 0.5', createOddsCell('Over 0.5', mockOdds.handicap[0].over.odds, '0.5'))}
                />
              </td>
              <td className="py-4 px-4 bg-slate-50/50 dark:bg-slate-800/30">
                <OddsButtonCell 
                  handicap="U0.5" 
                  odds={mockOdds.handicap[0].under.odds}
                  onClick={() => onSelect('Over/Under', 'Under 0.5', createOddsCell('Under 0.5', mockOdds.handicap[0].under.odds, '0.5'))}
                />
              </td>
            </tr>

            <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
              <td className="py-4 px-4">
                <OddsButtonCell 
                  handicap="0" 
                  odds={mockOdds.handicap[1].home.odds}
                  onClick={() => onSelect('Handicap', homeTeamName, createOddsCell(homeTeamName, mockOdds.handicap[1].home.odds, '0'))}
                />
              </td>
              <td className="py-4 px-4">
                <OddsButtonCell 
                  handicap="0" 
                  odds={mockOdds.handicap[1].away.odds}
                  onClick={() => onSelect('Handicap', awayTeamName, createOddsCell(awayTeamName, mockOdds.handicap[1].away.odds, '0'))}
                />
              </td>
              <td className="py-4 px-4 border-l border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                <OddsButtonCell 
                  handicap="O0.5/1" 
                  odds={mockOdds.handicap[1].over.odds}
                  onClick={() => onSelect('Over/Under', 'Over 0.5/1', createOddsCell('Over 0.5/1', mockOdds.handicap[1].over.odds, '0.5/1'))}
                />
              </td>
              <td className="py-4 px-4 bg-slate-50/50 dark:bg-slate-800/30">
                <OddsButtonCell 
                  handicap="U0.5/1" 
                  odds={mockOdds.handicap[1].under.odds}
                  onClick={() => onSelect('Over/Under', 'Under 0.5/1', createOddsCell('Under 0.5/1', mockOdds.handicap[1].under.odds, '0.5/1'))}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div className="grid grid-cols-5 border-t border-slate-200 dark:border-slate-700 text-sm">
          <div className="border-r border-slate-200 dark:border-slate-700">
            <div className="py-2 px-3 text-center text-slate-600 dark:text-slate-400 text-xs border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-medium">1 X 2</div>
            <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-950">
              <button className="py-3 px-2 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="text-slate-500 dark:text-slate-400 text-xs">1</div>
                <div className="text-emerald-600 dark:text-emerald-500 font-bold">{mockOdds.oneXTwo.home}</div>
              </button>
              <button className="py-3 px-2 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="text-slate-500 dark:text-slate-400 text-xs">X</div>
                <div className="text-emerald-600 dark:text-emerald-500 font-bold">{mockOdds.oneXTwo.draw}</div>
              </button>
              <button className="py-3 px-2 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="text-slate-500 dark:text-slate-400 text-xs">2</div>
                <div className="text-emerald-600 dark:text-emerald-500 font-bold">{mockOdds.oneXTwo.away}</div>
              </button>
            </div>
          </div>

          <div className="border-r border-slate-200 dark:border-slate-700">
            <div className="py-2 px-3 text-center text-slate-600 dark:text-slate-400 text-xs border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-medium">Đội 1 Trên/Dưới</div>
            <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-950">
              <button className="py-3 px-2 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="text-slate-500 dark:text-slate-400 text-xs">O0.5</div>
                <div className="text-emerald-600 dark:text-emerald-500 font-bold">{mockOdds.team1OU.over.odds}</div>
              </button>
              <button className="py-3 px-2 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="text-slate-500 dark:text-slate-400 text-xs">U0.5</div>
                <div className="text-emerald-600 dark:text-emerald-500 font-bold">{mockOdds.team1OU.under.odds}</div>
              </button>
            </div>
          </div>

          <div className="border-r border-slate-200 dark:border-slate-700">
            <div className="py-2 px-3 text-center text-slate-600 dark:text-slate-400 text-xs border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-medium">Đội 2 Trên/Dưới</div>
            <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-950">
              <button className="py-3 px-2 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="text-slate-500 dark:text-slate-400 text-xs">O0.5</div>
                <div className="text-emerald-600 dark:text-emerald-500 font-bold">{mockOdds.team2OU.over.odds}</div>
              </button>
              <button className="py-3 px-2 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="text-slate-500 dark:text-slate-400 text-xs">U0.5</div>
                <div className="text-emerald-600 dark:text-emerald-500 font-bold">{mockOdds.team2OU.under.odds}</div>
              </button>
            </div>
          </div>

          <div className="border-r border-slate-200 dark:border-slate-700">
            <div className="py-2 px-3 text-center text-slate-600 dark:text-slate-400 text-xs border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-medium">Lẻ/Chẵn</div>
            <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-950">
              <button className="py-3 px-2 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="text-slate-500 dark:text-slate-400 text-xs">Lẻ</div>
                <div className="text-emerald-600 dark:text-emerald-500 font-bold">{mockOdds.oddEven.odd}</div>
              </button>
              <button className="py-3 px-2 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="text-slate-500 dark:text-slate-400 text-xs">Chẵn</div>
                <div className="text-emerald-600 dark:text-emerald-500 font-bold">{mockOdds.oddEven.even}</div>
              </button>
            </div>
          </div>

          <div>
            <div className="py-2 px-3 text-center text-slate-600 dark:text-slate-400 text-xs border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-medium">2 Đội Ghi Bàn</div>
            <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-950">
              <button className="py-3 px-2 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="text-slate-500 dark:text-slate-400 text-xs">Có</div>
                <div className="text-emerald-600 dark:text-emerald-500 font-bold">{mockOdds.bothScore.yes}</div>
              </button>
              <button className="py-3 px-2 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="text-slate-500 dark:text-slate-400 text-xs">Không</div>
                <div className="text-emerald-600 dark:text-emerald-500 font-bold">{mockOdds.bothScore.no}</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function OddsButtonCell({ handicap, odds, onClick }: { handicap: string; odds: number; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center justify-center gap-2 w-full hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded py-1 px-2 transition-colors"
    >
      <span className="text-slate-500 dark:text-slate-400 text-sm">{handicap}</span>
      <span className="text-emerald-600 dark:text-emerald-500 font-bold">{odds.toFixed(2)}</span>
    </button>
  );
}

function MatchSkeleton() {
  return (
    <div className="min-h-full">
      <div className="h-12 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50" />
      <div className="p-4 lg:p-6">
        <div className="bg-slate-100 dark:bg-slate-900/50 py-8 rounded-lg">
          <div className="flex items-center justify-center gap-8">
            <Skeleton className="h-20 w-32 bg-slate-200 dark:bg-slate-700" />
            <Skeleton className="h-16 w-24 bg-slate-200 dark:bg-slate-700" />
            <Skeleton className="h-20 w-32 bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
        <Skeleton className="h-12 w-full mt-6 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        <div className="mt-4 space-y-4">
          <Skeleton className="h-64 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <Skeleton className="h-32 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
