'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeft, 
  AlertCircle, 
  RefreshCw,
  Trophy,
  Calendar,
  History,
  TrendingUp,
  MapPin,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { teamsService, Team, TeamMatch } from '@/services/teams.service';

interface TeamStats {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  winRate: number;
  form: ('W' | 'D' | 'L')[];
}

export default function TeamDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<TeamMatch[]>([]);
  const [finishedMatches, setFinishedMatches] = useState<TeamMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setIsRefreshing(true);
    setError(null);

    try {
      const [teamData, upcoming, finished] = await Promise.all([
        teamsService.getById(id),
        teamsService.getMatches(id, 'upcoming', 5),
        teamsService.getMatches(id, 'finished', 10)
      ]);

      setTeam(teamData);
      setUpcomingMatches(upcoming);
      setFinishedMatches(finished);
    } catch (err) {
      console.error('Error fetching team data:', err);
      setError('Failed to load team details. Please try again.');
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

  const stats = useMemo<TeamStats>(() => {
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    const form: ('W' | 'D' | 'L')[] = [];

    finishedMatches.forEach(match => {
      // Skip if score is missing
      if (match.homeScore === undefined || match.awayScore === undefined) return;

      const isHome = match.homeTeam.id === id;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;

      goalsFor += teamScore;
      goalsAgainst += opponentScore;

      if (teamScore > opponentScore) {
        wins++;
        form.push('W');
      } else if (teamScore === opponentScore) {
        draws++;
        form.push('D');
      } else {
        losses++;
        form.push('L');
      }
    });

    const matchesPlayed = wins + draws + losses;
    const winRate = matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0;

    return {
      matchesPlayed,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      winRate,
      form: form.slice(0, 5) // Last 5 matches form
    };
  }, [finishedMatches, id]);

  if (isLoading && !team) {
    return <TeamDetailSkeleton />;
  }

  if (error || !team) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <Card className="max-w-md w-full mx-auto">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Error Loading Team</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{error || 'Team not found'}</p>
            <Button onClick={() => fetchData(true)} className="bg-emerald-500 hover:bg-emerald-600">
              Thử lại
            </Button>
            <div className="mt-4">
              <Link href="/matches" className="text-emerald-500 hover:underline text-sm">
                Quay lại danh sách trận đấu
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-12">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/matches" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Chi tiết đội bóng</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => fetchData(false)}
            disabled={isRefreshing}
            className={isRefreshing ? 'opacity-50' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Cập nhật</span>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        <TeamHeader team={team} />

        <StatsSection stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Trận đấu sắp tới</h2>
            </div>
            
            {upcomingMatches.length > 0 ? (
              <div className="space-y-3">
                {upcomingMatches.map(match => (
                  <MatchCard key={match.id} match={match} currentTeamId={team.id} />
                ))}
              </div>
            ) : (
              <EmptyState message="Không có trận đấu sắp tới" />
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Lịch sử trận đấu</h2>
            </div>

            {finishedMatches.length > 0 ? (
              <div className="space-y-3">
                {finishedMatches.map(match => (
                  <MatchCard key={match.id} match={match} currentTeamId={team.id} isFinished />
                ))}
              </div>
            ) : (
              <EmptyState message="Chưa có lịch sử trận đấu" />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function TeamHeader({ team }: { team: Team }) {
  return (
    <Card className="overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border-none text-white shadow-xl">
      <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      <CardContent className="relative p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          <div className="relative">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white/10">
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={team.name} className="w-16 h-16 sm:w-24 sm:h-24 object-contain" />
              ) : (
                <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300" />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-slate-900">
              Active
            </div>
          </div>
          
          <div className="text-center sm:text-left space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{team.name}</h1>
            <div className="flex items-center justify-center sm:justify-start gap-4 text-slate-300 text-sm">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{team.country || 'Unknown Country'}</span>
              </div>
              {team.sportId && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10">
                  <Trophy className="h-3 w-3" />
                  <span className="uppercase text-xs font-bold tracking-wider">Football</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsSection({ stats }: { stats: TeamStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatsCard 
        label="Trận đã đấu" 
        value={stats.matchesPlayed} 
        icon={<Trophy className="h-5 w-5 text-purple-500" />}
        className="bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/20"
      />
      <StatsCard 
        label="Tỉ lệ thắng" 
        value={`${stats.winRate.toFixed(0)}%`} 
        icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
        className="bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20"
      />
      <StatsCard 
        label="Bàn thắng" 
        value={stats.goalsFor} 
        subValue={`Thủng lưới: ${stats.goalsAgainst}`}
        icon={<div className="h-5 w-5 flex items-center justify-center font-bold text-blue-500">⚽</div>}
        className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20"
      />
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phong độ</span>
            <span className="text-xs text-slate-400">5 trận gần nhất</span>
          </div>
          <div className="flex items-center justify-between h-8">
            {stats.form.length > 0 ? (
              <div className="flex gap-1">
                {stats.form.map((result, i) => (
                  <span 
                    key={i}
                    className={`
                      w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold
                      ${result === 'W' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                        result === 'D' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' : 
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
                    `}
                  >
                    {result}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sm text-slate-500">-</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({ label, value, subValue, icon, className }: { 
  label: string; 
  value: string | number; 
  subValue?: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`border ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{value}</span>
          {subValue && <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subValue}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function MatchCard({ match, currentTeamId, isFinished }: { match: TeamMatch; currentTeamId: string; isFinished?: boolean }) {
  const isHome = match.homeTeam.id === currentTeamId;
  const opponent = isHome ? match.awayTeam : match.homeTeam;
  const teamScore = isHome ? match.homeScore : match.awayScore;
  const opponentScore = isHome ? match.awayScore : match.homeScore;

  let resultColor = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  if (isFinished && teamScore !== undefined && opponentScore !== undefined) {
    if (teamScore > opponentScore) resultColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    else if (teamScore < opponentScore) resultColor = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  }

  return (
    <Link href={`/matches/${match.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex flex-col gap-1 min-w-[60px]">
            <span className="text-xs font-medium text-slate-500">
              {format(new Date(match.startTime), 'dd/MM')}
            </span>
            <span className="text-xs text-slate-400">
              {format(new Date(match.startTime), 'HH:mm')}
            </span>
          </div>

          <div className="flex-1 px-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${isHome ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  {match.homeTeam.name}
                </span>
                {isHome && <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">HOME</span>}
              </div>
              {isFinished && <span className="font-bold text-slate-900 dark:text-white">{match.homeScore}</span>}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${!isHome ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  {match.awayTeam.name}
                </span>
                {!isHome && <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">AWAY</span>}
              </div>
              {isFinished && <span className="font-bold text-slate-900 dark:text-white">{match.awayScore}</span>}
            </div>
          </div>

          {isFinished ? (
            <div className={`px-2 py-1 rounded text-xs font-bold ${resultColor} w-8 h-8 flex items-center justify-center`}>
              {teamScore !== undefined && opponentScore !== undefined ? (
                teamScore > opponentScore ? 'W' : teamScore === opponentScore ? 'D' : 'L'
              ) : '-'}
            </div>
          ) : (
            <div className="w-8 flex justify-center">
              <ChevronLeft className="h-4 w-4 text-slate-300 rotate-180" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}

function TeamDetailSkeleton() {
  return (
    <div className="min-h-full pb-12">
      <div className="h-14 border-b border-slate-200 bg-white" />
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        <Skeleton className="h-48 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
