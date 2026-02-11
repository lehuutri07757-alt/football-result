'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Star,
  RefreshCw,
  AlertCircle,
  Trophy,
  Clock,
  Calendar,
  MapPin
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { matchesService, Match } from '@/services/match.service';
import { oddsService } from '@/services/odds.service';
import { OddsTableRow, OddsCell } from '@/types/odds';
import { useLiveMatchTime } from '@/hooks/useLiveMatchTime';
import { useMatchStatistics } from '@/hooks/useMatchStatistics';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/language.store';
import { useBetSlipStore } from '@/stores/betslip.store';
import { t } from '@/lib/i18n';
import { formatDay, formatMonth, formatTime } from '@/lib/date';

type TabType = 'popular' | 'custom' | 'handicap' | 'goals' | 'intervals' | 'corners' | 'all';

export default function MatchDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const language = useLanguageStore((s) => s.language);
  const toggleSelection = useBetSlipStore((s) => s.toggleSelection);
  
  const [match, setMatch] = useState<Match | null>(null);
  const [odds, setOdds] = useState<OddsTableRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('popular');
  
  const { data: statistics } = useMatchStatistics();
  const footballCount = statistics?.total ?? 0;
  
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
  
  const isMatchBettable = match ? !['finished', 'cancelled', 'postponed'].includes(match.status) : false;

  const addToBetSlip = (
    marketName: string, 
    selectionName: string, 
    oddsCell: OddsCell
  ) => {
    if (oddsCell.suspended || !isMatchBettable) return;
    
    toggleSelection({
      fixtureId: match?.externalId ? parseInt(match.externalId) : 0,
      matchName: `${match?.homeTeam?.name} vs ${match?.awayTeam?.name}`,
      market: marketName,
      selection: selectionName,
      odds: oddsCell.odds,
      handicap: oddsCell.handicap,
      oddsId: oddsCell.oddsId,
    });
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'popular', label: t(language, 'tab.popular') },
    { id: 'custom', label: t(language, 'tab.custom') },
    { id: 'handicap', label: t(language, 'tab.handicapOU') },
    { id: 'goals', label: t(language, 'tab.goals') },
    { id: 'intervals', label: t(language, 'tab.intervals') },
    { id: 'corners', label: t(language, 'tab.corners') },
    { id: 'all', label: t(language, 'tab.all') },
  ];

  return (
    <div className="flex min-h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">{t(language, 'sidebar.sports')}</h3>
            <div className="space-y-1">
              <button
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all bg-emerald-50 text-emerald-600 font-medium dark:bg-emerald-500/10 dark:text-emerald-500"
              >
                <div className="flex items-center gap-3">
                  <span>⚽</span>
                  <span>{t(language, 'sidebar.football')}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold">
                  {footballCount}
                </span>
              </button>
            </div>
          </div>
          
          <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 p-5 text-center shadow-lg shadow-indigo-500/20">
              <Star className="h-8 w-8 text-yellow-300 mx-auto mb-3 fill-yellow-300" />
              <h4 className="font-bold text-white mb-1">{t(language, 'sidebar.vipClub')}</h4>
              <p className="text-xs text-indigo-100 mb-4">{t(language, 'sidebar.vipDesc')}</p>
              <Button size="sm" variant="secondary" className="w-full text-xs font-bold bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                {t(language, 'sidebar.viewStatus')}
              </Button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto scrollbar-hide">
          {isLoading && !match ? (
            <MatchSkeleton />
          ) : error || !match ? (
            <div className="flex items-center justify-center h-full p-6">
              <Card className="max-w-md w-full mx-auto border-red-100 dark:border-red-900/30">
                <CardContent className="pt-8 text-center pb-8">
<div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                     <AlertCircle className="h-8 w-8 text-red-500" />
                   </div>
                   <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{t(language, 'match.loadError')}</h2>
                   <p className="text-slate-500 dark:text-slate-400 mb-6">{error || t(language, 'match.noData')}</p>
                   <div className="flex gap-3 justify-center">
                     <Link href="/matches">
                       <Button variant="outline">{t(language, 'match.back')}</Button>
                     </Link>
                     <Button onClick={() => fetchData(true)} className="bg-emerald-600 hover:bg-emerald-700">{t(language, 'match.retry')}</Button>
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
              language={language}
              isMatchBettable={isMatchBettable}
            />
          )}
        </main>
    </div>
  );
}

function formatMatchDate(startTime: string, language: 'en' | 'vi'): string {
  const day = formatDay(startTime);
  const month = formatMonth(startTime, language);
  const time = formatTime(startTime, language);
  return `${day} ${month}, ${time}`;
}



function MatchContent({
  match,
  odds,
  isRefreshing,
  activeTab,
  setActiveTab,
  tabs,
  addToBetSlip,
  language,
  isMatchBettable
}: {
  match: Match;
  odds: OddsTableRow | null;
  isRefreshing: boolean;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  tabs: { id: TabType; label: string }[];
  addToBetSlip: (market: string, selection: string, odds: OddsCell) => void;
  language: 'en' | 'vi';
  isMatchBettable: boolean;
}) {
  const isLive = match.status === 'live';
  const homeTeamName = match.homeTeam?.name || 'HOME';
  const awayTeamName = match.awayTeam?.name || 'AWAY';
  const leagueName = match.league?.name || 'LEAGUE';
  const matchDate = formatMatchDate(match.startTime, language);

  const { displayTime, period } = useLiveMatchTime({
    startTime: match.startTime,
    period: match.period,
    liveMinute: match.liveMinute,
    isLive,
    status: match.status,
    updateInterval: 1000,
  });

  return (
    <div className="min-h-full pb-10">
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 lg:px-8 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/matches" className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            {match.league?.logoUrl ? (
              <img
                src={match.league.logoUrl}
                alt={leagueName}
                className="h-5 w-5 object-contain"
              />
            ) : (
              <Trophy className="h-4 w-4 text-slate-400" />
            )}
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[200px] lg:max-w-none">
              {leagueName}
            </span>
          </div>
        </div>
        <Link href="/matches" className="text-xs font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-500 transition-colors">
          {t(language, 'match.changeMatch')}
        </Link>
      </div>

      <div className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522770179533-24471fcdba45?q=80&w=2560&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/90 to-slate-900"></div>
        
        <div className="relative z-10 px-4 py-8 lg:py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center items-center gap-4 mb-8 text-xs font-medium tracking-wide text-slate-400 uppercase">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {matchDate}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 flex flex-col items-center text-center">
                <div className="relative mb-4 group">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative h-20 w-20 lg:h-24 lg:w-24 p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm shadow-xl flex items-center justify-center">
                    {match.homeTeam?.logoUrl ? (
                      <img
                        src={match.homeTeam.logoUrl}
                        alt={homeTeamName}
                        className="h-full w-full object-contain drop-shadow-md"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-slate-300">
                        {homeTeamName.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <h2 className="text-base lg:text-xl font-bold text-white leading-tight max-w-[160px]">
                  {homeTeamName}
                </h2>

              </div>

              <div className="flex flex-col items-center px-4 lg:px-12">
                {isLive ? (
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-500 text-xs font-bold border border-red-500/30 animate-pulse mb-4 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    LIVE
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700 mb-4">
                    {match.status === 'finished' ? 'FINISHED' : 'VS'}
                  </span>
                )}
                
                <div className="flex items-center gap-4 lg:gap-8 mb-2">
                  <span className="text-5xl lg:text-7xl font-bold text-white tracking-tighter tabular-nums drop-shadow-2xl">
                    {match.homeScore ?? 0}
                  </span>
                  <span className="text-3xl lg:text-4xl font-light text-slate-600">:</span>
                  <span className="text-5xl lg:text-7xl font-bold text-white tracking-tighter tabular-nums drop-shadow-2xl">
                    {match.awayScore ?? 0}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm lg:text-base font-medium bg-emerald-950/30 px-3 py-1 rounded-md border border-emerald-900/50">
                  <Clock className="h-4 w-4" />
                  {isLive ? displayTime : '00:00'}
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center text-center">
                <div className="relative mb-4 group">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative h-20 w-20 lg:h-24 lg:w-24 p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm shadow-xl flex items-center justify-center">
                    {match.awayTeam?.logoUrl ? (
                      <img
                        src={match.awayTeam.logoUrl}
                        alt={awayTeamName}
                        className="h-full w-full object-contain drop-shadow-md"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-slate-300">
                        {awayTeamName.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <h2 className="text-base lg:text-xl font-bold text-white leading-tight max-w-[160px]">
                  {awayTeamName}
                </h2>

              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-6 -mt-6 relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-1.5 mb-6 overflow-x-auto scrollbar-hide flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-semibold whitespace-nowrap rounded-lg transition-all duration-200 flex-shrink-0",
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-md dark:bg-emerald-600"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {activeTab === 'popular' ? (
            <MainMarketSection 
              homeTeamName={homeTeamName}
              awayTeamName={awayTeamName}
              odds={odds}
              onSelect={addToBetSlip}
              language={language}
              isMatchBettable={isMatchBettable}
            />
          ) : (
            <Card className="border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <RefreshCw className="h-6 w-6 opacity-50" />
                </div>
                <p className="font-medium">{t(language, 'market.updating')}</p>
                <p className="text-sm mt-1">{t(language, 'market.checkBack')}</p>
              </CardContent>
            </Card>
          )}

          {isRefreshing && (
            <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Updating odds...
              </div>
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
  onSelect,
  language,
  isMatchBettable
}: { 
  homeTeamName: string; 
  awayTeamName: string;
  odds: OddsTableRow | null;
  onSelect: (market: string, selection: string, odds: OddsCell) => void;
  language: 'en' | 'vi';
  isMatchBettable: boolean;
}) {
  const hasOdds = odds !== null;
  const hdp = odds?.hdp;
  const ou = odds?.overUnder;
  const oneXTwo = odds?.oneXTwo;
  const homeGoalOU = odds?.homeGoalOU;
  const awayGoalOU = odds?.awayGoalOU;
  const btts = odds?.btts;

  const hasMainTable = hdp || ou;

  return (
    <div className="grid gap-6">
      {hasMainTable && (
        <Card className="overflow-hidden border-0 shadow-md ring-1 ring-slate-200 dark:ring-slate-800">
          <div className="bg-slate-100/50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
              {t(language, 'market.main')}
            </h3>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-yellow-400">
              <Star className="h-4 w-4" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="px-4 py-3 min-w-[140px]">{homeTeamName}</th>
                  <th className="px-4 py-3 min-w-[140px]">{awayTeamName}</th>
                  <th className="px-4 py-3 min-w-[120px] border-l border-slate-200 dark:border-slate-800 text-center">{t(language, 'market.over')}</th>
                  <th className="px-4 py-3 min-w-[120px] text-center">{t(language, 'market.under')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <td className="p-3">
                    {hdp?.home ? (
                      <OddsButtonCell
                        handicap={hdp.home.handicap || ''}
                        odds={hdp.home.odds}
                        onClick={() => onSelect('Handicap', homeTeamName, hdp.home)}
                        disabled={!isMatchBettable}
                      />
                    ) : <SuspendedCell />}
                  </td>
                  <td className="p-3">
                    {hdp?.away ? (
                      <OddsButtonCell
                        handicap={hdp.away.handicap || ''}
                        odds={hdp.away.odds}
                        onClick={() => onSelect('Handicap', awayTeamName, hdp.away)}
                        disabled={!isMatchBettable}
                      />
                    ) : <SuspendedCell />}
                  </td>
                  <td className="p-3 border-l border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                    {ou?.home ? (
                      <OddsButtonCell
                        handicap={ou.home.handicap || ''}
                        odds={ou.home.odds}
                        isOverUnder
                        label="O"
                        onClick={() => onSelect('Over/Under', ou.home.label, ou.home)}
                        disabled={!isMatchBettable}
                      />
                    ) : <SuspendedCell />}
                  </td>
                  <td className="p-3 bg-slate-50/30 dark:bg-slate-900/30">
                    {ou?.away ? (
                      <OddsButtonCell
                        handicap={ou.away.handicap || ''}
                        odds={ou.away.odds}
                        isOverUnder
                        label="U"
                        onClick={() => onSelect('Over/Under', ou.away.label, ou.away)}
                        disabled={!isMatchBettable}
                      />
                    ) : <SuspendedCell />}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {oneXTwo && (
          <MarketCard title={t(language, 'market.1x2')}>
            <div className="grid grid-cols-3 gap-2">
              <SelectionButton
                label="1"
                value={oneXTwo.home.odds}
                onClick={() => onSelect('1x2', homeTeamName, oneXTwo.home)}
                disabled={!isMatchBettable}
              />
              <SelectionButton
                label="X"
                value={oneXTwo.draw?.odds ?? 0}
                onClick={() => oneXTwo.draw && onSelect('1x2', 'Draw', oneXTwo.draw)}
                disabled={!isMatchBettable}
              />
              <SelectionButton
                label="2"
                value={oneXTwo.away.odds}
                onClick={() => onSelect('1x2', awayTeamName, oneXTwo.away)}
                disabled={!isMatchBettable}
              />
            </div>
          </MarketCard>
        )}

        {homeGoalOU && (
          <MarketCard title={`${t(language, 'market.teamOU')} ${homeTeamName}`}>
            <div className="grid grid-cols-2 gap-2">
              <SelectionButton
                label={`${language === 'vi' ? 'Tài' : 'O'} ${homeGoalOU.home.handicap?.replace('O ', '') ?? '0.5'}`}
                value={homeGoalOU.home.odds}
                onClick={() => onSelect('Home Total', homeGoalOU.home.label, homeGoalOU.home)}
                disabled={!isMatchBettable}
              />
              <SelectionButton
                label={`${language === 'vi' ? 'Xỉu' : 'U'} ${homeGoalOU.away.handicap?.replace('U ', '') ?? '0.5'}`}
                value={homeGoalOU.away.odds}
                onClick={() => onSelect('Home Total', homeGoalOU.away.label, homeGoalOU.away)}
                disabled={!isMatchBettable}
              />
            </div>
          </MarketCard>
        )}

        {awayGoalOU && (
          <MarketCard title={`${t(language, 'market.teamOU')} ${awayTeamName}`}>
            <div className="grid grid-cols-2 gap-2">
              <SelectionButton
                label={`${language === 'vi' ? 'Tài' : 'O'} ${awayGoalOU.home.handicap?.replace('O ', '') ?? '0.5'}`}
                value={awayGoalOU.home.odds}
                onClick={() => onSelect('Away Total', awayGoalOU.home.label, awayGoalOU.home)}
                disabled={!isMatchBettable}
              />
              <SelectionButton
                label={`${language === 'vi' ? 'Xỉu' : 'U'} ${awayGoalOU.away.handicap?.replace('U ', '') ?? '0.5'}`}
                value={awayGoalOU.away.odds}
                onClick={() => onSelect('Away Total', awayGoalOU.away.label, awayGoalOU.away)}
                disabled={!isMatchBettable}
              />
            </div>
          </MarketCard>
        )}

        {btts && (
          <MarketCard title={t(language, 'market.bothScore')}>
            <div className="grid grid-cols-2 gap-2">
              <SelectionButton
                label={t(language, 'market.yes')}
                value={btts.home.odds}
                onClick={() => onSelect('Both Teams Score', 'Yes', btts.home)}
                disabled={!isMatchBettable}
              />
              <SelectionButton
                label={t(language, 'market.no')}
                value={btts.away.odds}
                onClick={() => onSelect('Both Teams Score', 'No', btts.away)}
                disabled={!isMatchBettable}
              />
            </div>
          </MarketCard>
        )}
      </div>

      {!hasOdds && (
        <Card className="border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 opacity-50" />
            </div>
            <p className="font-medium">{t(language, 'market.noOdds') || 'No odds available'}</p>
            <p className="text-sm mt-1">{t(language, 'market.checkBack')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MarketCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide truncate" title={title}>
          {title}
        </h4>
      </div>
      <div className="p-3">
        {children}
      </div>
    </Card>
  );
}

function SelectionButton({ label, value, onClick, disabled }: { label: string, value: number, onClick: () => void, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center py-2 px-1 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-all group",
        disabled 
          ? "opacity-50 cursor-not-allowed" 
          : "hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20"
      )}
    >
      <span className={cn("text-xs font-medium mb-0.5", disabled ? "text-slate-400 dark:text-slate-500" : "text-slate-500 dark:text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400")}>{label}</span>
      <span className={cn("text-sm font-bold", disabled ? "text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400")}>{value}</span>
    </button>
  );
}

function OddsButtonCell({ 
  handicap, 
  odds, 
  isOverUnder, 
  label,
  onClick,
  disabled
}: { 
  handicap: string; 
  odds: number; 
  isOverUnder?: boolean;
  label?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-between w-full px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-transparent transition-all group",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:border-emerald-500 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm"
      )}
    >
      <div className="flex items-center gap-2">
        {isOverUnder && label && (
          <span className={cn(
            "text-xs font-bold w-5 h-5 flex items-center justify-center rounded",
            label === 'O' ? "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400" : "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
          )}>
            {label}
          </span>
        )}
        <span className={cn(
          "text-sm font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors",
          isOverUnder ? "text-slate-500 dark:text-slate-400" : "text-slate-700 dark:text-slate-300"
        )}>
          {handicap}
        </span>
      </div>
      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
        {odds.toFixed(2)}
      </span>
    </button>
  );
}

function SuspendedCell() {
  return (
    <div className="flex items-center justify-center w-full px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 text-xs font-medium">
      —
    </div>
  );
}

function MatchSkeleton() {
  return (
    <div className="min-h-full">
      <Skeleton className="h-64 w-full bg-slate-800" />
      <div className="max-w-5xl mx-auto px-4 lg:px-6 -mt-12 relative z-10">
        <Skeleton className="h-12 w-full mb-6 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-32 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-32 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-32 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-32 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
