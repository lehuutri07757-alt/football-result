'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Trophy, 
  CheckCircle2,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronDown,
  X
} from 'lucide-react';
import { matchesService, Match, League, leaguesService, standingsService, StandingTeam } from '@/services/match.service';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/language.store';
import { t } from '@/lib/i18n';
import { formatDateLong, formatTime } from '@/lib/date';

const LEAGUES_PER_PAGE = 10;

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialLeagueId = searchParams.get('leagueId') || 'all';
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(initialLeagueId);
  const [standings, setStandings] = useState<StandingTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLeaguesCount, setVisibleLeaguesCount] = useState(LEAGUES_PER_PAGE);
  
  const language = useLanguageStore((s) => s.language);
  
  const filteredLeagues = useMemo(() => {
    if (!searchQuery.trim()) return leagues;
    const query = searchQuery.toLowerCase().trim();
    return leagues.filter(league => 
      league.name.toLowerCase().includes(query) ||
      league.country?.toLowerCase().includes(query)
    );
  }, [leagues, searchQuery]);
  
  const visibleLeagues = useMemo(() => {
    return filteredLeagues.slice(0, visibleLeaguesCount);
  }, [filteredLeagues, visibleLeaguesCount]);
  
  const hasMoreLeagues = visibleLeagues.length < filteredLeagues.length;
  
  const handleLoadMore = useCallback(() => {
    setVisibleLeaguesCount(prev => prev + LEAGUES_PER_PAGE);
  }, []);
  
  useEffect(() => {
    setVisibleLeaguesCount(LEAGUES_PER_PAGE);
  }, [searchQuery]);

  const handleLeagueSelect = useCallback((leagueId: string) => {
    setSelectedLeagueId(leagueId);
    const url = leagueId === 'all' ? '/results' : `/results?leagueId=${leagueId}`;
    router.push(url, { scroll: false });
  }, [router]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const matchParams: Parameters<typeof matchesService.getAll>[0] = {
        status: 'finished',
        limit: 50,
        sortBy: 'startTime',
        sortOrder: 'desc',
      };
      if (selectedLeagueId !== 'all') {
        matchParams.leagueId = selectedLeagueId;
      }

      const [matchesRes, leaguesRes] = await Promise.all([
        matchesService.getAll(matchParams),
        leaguesService.getAll({ 
          limit: 50, 
          isActive: true,
          sortBy: 'sortOrder',
          sortOrder: 'asc'
        })
      ]);
      
      setMatches(matchesRes.data);
      
      setLeagues(leaguesRes.data);
      
      if (selectedLeagueId !== 'all') {
        try {
          const standingsRes = await standingsService.getByLeagueId(selectedLeagueId);
          setStandings(standingsRes.standings);
        } catch {
          setStandings([]);
        }
      } else {
        setStandings([]);
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLeagueId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const groupedMatches = matches.reduce((acc, match) => {
    const date = formatDateLong(match.startTime, language);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  const selectedLeague = leagues.find(l => l.id === selectedLeagueId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-200 transition-colors duration-300">
      <div className="flex h-[calc(100vh-64px)]">
        <aside className={cn(
          "flex-shrink-0 border-r border-slate-200 bg-white/80 dark:border-white/5 dark:bg-slate-950/80 transition-all duration-300 overflow-hidden",
          sidebarCollapsed ? "w-0 lg:w-16" : "w-64"
        )}>
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t(language, 'results.selectLeague')}
                  </h3>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronLeft className="h-4 w-4 text-slate-500" />
                )}
              </button>
            </div>

            {!sidebarCollapsed && (
              <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t(language, 'results.searchLeagues')}
                    className="w-full pl-9 pr-8 py-2 text-sm bg-slate-100 dark:bg-slate-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                      <X className="h-3 w-3 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              <button
                onClick={() => handleLeagueSelect('all')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-slate-100 dark:border-slate-800/50",
                  selectedLeagueId === 'all' 
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                )}
              >
                {sidebarCollapsed ? (
                  <Trophy className={cn(
                    "h-5 w-5 mx-auto",
                    selectedLeagueId === 'all' ? "text-emerald-500" : "text-slate-400"
                  )} />
                ) : (
                  <>
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      selectedLeagueId === 'all' 
                        ? "bg-emerald-500/10" 
                        : "bg-slate-100 dark:bg-slate-800"
                    )}>
                      <Trophy className={cn(
                        "h-4 w-4",
                        selectedLeagueId === 'all' ? "text-emerald-500" : "text-slate-400"
                      )} />
                    </div>
                    <span className="truncate">{t(language, 'results.allLeagues')}</span>
                  </>
                )}
              </button>

              {visibleLeagues.map(league => (
                <button
                  key={league.id}
                  onClick={() => handleLeagueSelect(league.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-b border-slate-100/50 dark:border-slate-800/30",
                    selectedLeagueId === league.id 
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                  )}
                >
                  {sidebarCollapsed ? (
                    league.logoUrl ? (
                      <img src={league.logoUrl} alt="" className="h-6 w-6 object-contain mx-auto" />
                    ) : (
                      <Trophy className="h-5 w-5 text-slate-400 mx-auto" />
                    )
                  ) : (
                    <>
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden",
                        selectedLeagueId === league.id 
                          ? "bg-emerald-500/10" 
                          : "bg-slate-100 dark:bg-slate-800"
                      )}>
                        {league.logoUrl ? (
                          <img src={league.logoUrl} alt="" className="h-6 w-6 object-contain" />
                        ) : (
                          <Trophy className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="truncate font-medium">{league.name}</div>
                        {league.country && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{league.country}</div>
                        )}
                      </div>
                    </>
                  )}
                </button>
              ))}
              
              {!sidebarCollapsed && hasMoreLeagues && (
                <button
                  onClick={handleLoadMore}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  <ChevronDown className="h-4 w-4" />
                  {t(language, 'results.loadMore')} ({filteredLeagues.length - visibleLeagues.length})
                </button>
              )}
              
              {!sidebarCollapsed && searchQuery && filteredLeagues.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  {t(language, 'results.noLeaguesFound')}
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t(language, 'results.title')}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {selectedLeague ? selectedLeague.name : t(language, 'results.subtitle')}
              </p>
            </div>
            
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium"
            >
              <Trophy className="h-4 w-4 text-amber-500" />
              {selectedLeague?.name || t(language, 'results.allLeagues')}
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <span className="ml-3 text-slate-500 dark:text-slate-400">
                {t(language, 'results.loading')}
              </span>
            </div>
          ) : (
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-500" />
                      {t(language, 'results.matchResults')}
                      {matches.length > 0 && (
                        <span className="text-xs font-normal text-slate-500 ml-2">({matches.length})</span>
                      )}
                    </h2>
                  </div>
                  
                  {matches.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                      <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>{t(language, 'results.noResults')}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {Object.entries(groupedMatches).map(([date, dateMatches]) => (
                        <div key={date}>
                          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/30 flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400" />
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                              {date}
                            </span>
                          </div>
                          {dateMatches.map(match => (
                            <Link
                              key={match.id}
                              href={`/matches/${match.id}`}
                              className="flex items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                              {selectedLeagueId === 'all' && (
                                <div className="flex items-center gap-2 w-[140px]">
                                  {match.league?.logoUrl && (
                                    <img src={match.league.logoUrl} alt="" className="h-4 w-4 object-contain" />
                                  )}
                                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {match.league?.name}
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex-1 flex items-center justify-between gap-4">
                                <div className="flex-1 flex items-center justify-end gap-2">
                                  <span className="text-sm font-medium text-right truncate max-w-[120px]">
                                    {match.homeTeam?.name}
                                  </span>
                                  {match.homeTeam?.logoUrl && (
                                    <img src={match.homeTeam.logoUrl} alt="" className="h-6 w-6 object-contain" />
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2 min-w-[70px] justify-center">
                                  <span className={cn(
                                    "text-lg font-bold",
                                    (match.homeScore ?? 0) > (match.awayScore ?? 0) && "text-emerald-600 dark:text-emerald-400"
                                  )}>
                                    {match.homeScore ?? 0}
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-600">-</span>
                                  <span className={cn(
                                    "text-lg font-bold",
                                    (match.awayScore ?? 0) > (match.homeScore ?? 0) && "text-emerald-600 dark:text-emerald-400"
                                  )}>
                                    {match.awayScore ?? 0}
                                  </span>
                                </div>
                                
                                <div className="flex-1 flex items-center gap-2">
                                  {match.awayTeam?.logoUrl && (
                                    <img src={match.awayTeam.logoUrl} alt="" className="h-6 w-6 object-contain" />
                                  )}
                                  <span className="text-sm font-medium truncate max-w-[120px]">
                                    {match.awayTeam?.name}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="w-[80px] text-right flex flex-col items-end gap-0.5">
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {formatTime(match.startTime, language)}
                                </span>
                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  {t(language, 'results.ft')}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              {selectedLeagueId !== 'all' && (
                <>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Trophy size={18} className="text-amber-500" />
                        {t(language, 'results.standings')}
                      </h2>
                    </div>
                    
                    {standings.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>{t(language, 'results.noResults')}</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                              <th className="text-left px-3 py-2 font-medium">#</th>
                              <th className="text-left px-3 py-2 font-medium">{t(language, 'results.team')}</th>
                              <th className="text-center px-2 py-2 font-medium">{t(language, 'results.played')}</th>
                              <th className="text-center px-2 py-2 font-medium">{t(language, 'results.won')}</th>
                              <th className="text-center px-2 py-2 font-medium">{t(language, 'results.drawn')}</th>
                              <th className="text-center px-2 py-2 font-medium">{t(language, 'results.lost')}</th>
                              <th className="text-center px-2 py-2 font-medium">{t(language, 'results.goalDiff')}</th>
                              <th className="text-center px-2 py-2 font-medium">{t(language, 'results.points')}</th>
                              <th className="text-center px-2 py-2 font-medium">{t(language, 'results.form')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {standings.map((team, index) => (
                              <tr 
                                key={team.team.id}
                                className={cn(
                                  "border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors",
                                  index < 4 && "bg-emerald-50/30 dark:bg-emerald-900/10"
                                )}
                              >
                                <td className="px-3 py-2.5">
                                  <span className={cn(
                                    "inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold",
                                    index < 4 ? "bg-emerald-500 text-white" : 
                                    index < 6 ? "bg-blue-500 text-white" :
                                    index >= standings.length - 3 ? "bg-red-500 text-white" :
                                    "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                  )}>
                                    {team.position}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-2">
                                    {team.team.logoUrl ? (
                                      <img src={team.team.logoUrl} alt="" className="h-5 w-5 object-contain" />
                                    ) : (
                                      <div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-700" />
                                    )}
                                    <span className="font-medium truncate max-w-[100px]">{team.team.name}</span>
                                  </div>
                                </td>
                                <td className="text-center px-2 py-2.5 text-slate-600 dark:text-slate-300">{team.played}</td>
                                <td className="text-center px-2 py-2.5 text-emerald-600 dark:text-emerald-400">{team.won}</td>
                                <td className="text-center px-2 py-2.5 text-slate-500">{team.drawn}</td>
                                <td className="text-center px-2 py-2.5 text-red-500">{team.lost}</td>
                                <td className="text-center px-2 py-2.5">
                                  <span className={cn(
                                    "font-medium",
                                    team.goalDiff > 0 ? "text-emerald-600 dark:text-emerald-400" : 
                                    team.goalDiff < 0 ? "text-red-500" : "text-slate-500"
                                  )}>
                                    {team.goalDiff > 0 ? '+' : ''}{team.goalDiff}
                                  </span>
                                </td>
                                <td className="text-center px-2 py-2.5">
                                  <span className="font-bold text-slate-900 dark:text-white">{team.points}</span>
                                </td>
                                <td className="px-2 py-2.5">
                                  <div className="flex items-center justify-center gap-1">
                                    {team.form ? (
                                      team.form.split('').slice(-5).map((result, i) => (
                                        <span
                                          key={i}
                                          className={cn(
                                            "w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white",
                                            result === 'W' && "bg-emerald-500",
                                            result === 'D' && "bg-amber-500",
                                            result === 'L' && "bg-red-500"
                                          )}
                                        >
                                          {result}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-slate-400 text-xs">-</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {standings.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded bg-emerald-500"></span>
                          <span className="text-slate-600 dark:text-slate-400">Champions League</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded bg-blue-500"></span>
                          <span className="text-slate-600 dark:text-slate-400">Europa League</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded bg-red-500"></span>
                          <span className="text-slate-600 dark:text-slate-400">Relegation</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
