'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  RefreshCw,
  Loader2,
  TrendingUp,
  Users,
  ChevronDown,
  Search,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  standingsService,
  leaguesService,
  League,
  StandingsResponse,
  StandingTeam,
} from '@/services/match.service';
import { syncJobService } from '@/services/sync-job.service';
import { AdminLoading } from '@/components/admin/AdminLoading';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { useLanguageStore } from '@/stores/language.store';
import { t } from '@/lib/i18n';

export default function AdminStandingsPage() {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';
  const language = useLanguageStore((s) => s.language);

  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [standings, setStandings] = useState<StandingTeam[]>([]);
  const [leagueInfo, setLeagueInfo] = useState<StandingsResponse['league'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLeagueDropdownOpen, setIsLeagueDropdownOpen] = useState(false);

  const fetchLeagues = useCallback(async () => {
    try {
      setLoading(true);
      const response = await leaguesService.getAll({
        limit: 200,
        isActive: true,
      });
      setLeagues(response.data);
      
      if (response.data.length > 0 && !selectedLeagueId) {
        setSelectedLeagueId(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch leagues:', error);
      toast.error('Failed to load leagues');
    } finally {
      setLoading(false);
    }
  }, [selectedLeagueId]);

  const fetchStandings = useCallback(async () => {
    if (!selectedLeagueId) {
      setStandings([]);
      setLeagueInfo(null);
      return;
    }

    try {
      setStandingsLoading(true);
      const response = await standingsService.getByLeagueId(selectedLeagueId);
      setStandings(response.standings);
      setLeagueInfo(response.league);
    } catch (error) {
      console.error('Failed to fetch standings:', error);
      toast.error('Failed to load standings');
      setStandings([]);
      setLeagueInfo(null);
    } finally {
      setStandingsLoading(false);
    }
  }, [selectedLeagueId]);

  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]);

  useEffect(() => {
    if (selectedLeagueId) {
      fetchStandings();
    }
  }, [selectedLeagueId, fetchStandings]);

  const handleSyncStandings = async () => {
    try {
      setSyncLoading(true);
      await syncJobService.triggerStandingsSync();
      toast.success('Standings sync job created. Check Sync Dashboard for progress.');
      setTimeout(() => {
        fetchStandings();
      }, 3000);
    } catch (error) {
      console.error('Failed to trigger standings sync:', error);
      toast.error('Failed to trigger standings sync');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleLeagueSelect = (leagueId: string) => {
    setSelectedLeagueId(leagueId);
    setIsLeagueDropdownOpen(false);
  };

  const filteredLeagues = leagues.filter((league) =>
    league.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (league.country && league.country.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedLeague = leagues.find((l) => l.id === selectedLeagueId);

  const renderFormBadges = (form: string | null) => {
    if (!form) return <span className="text-gray-400">-</span>;

    return (
      <div className="flex gap-0.5">
        {form.split('').slice(-5).map((result, index) => {
          let bgColor = 'bg-gray-400';
          if (result === 'W') bgColor = 'bg-green-500';
          else if (result === 'D') bgColor = 'bg-yellow-500';
          else if (result === 'L') bgColor = 'bg-red-500';

          return (
            <span
              key={index}
              className={`${bgColor} text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded`}
            >
              {result}
            </span>
          );
        })}
      </div>
    );
  };

  const getPositionStyle = (position: number, totalTeams: number) => {
    const CHAMPIONS_LEAGUE_SPOTS = 4;
    const EUROPA_LEAGUE_SPOTS = 6;
    const RELEGATION_ZONE_SIZE = 3;

    if (position <= CHAMPIONS_LEAGUE_SPOTS) {
      return isDark
        ? 'border-l-4 border-l-blue-500 bg-blue-500/10'
        : 'border-l-4 border-l-blue-500 bg-blue-50';
    }
    if (position <= EUROPA_LEAGUE_SPOTS) {
      return isDark
        ? 'border-l-4 border-l-orange-500 bg-orange-500/10'
        : 'border-l-4 border-l-orange-500 bg-orange-50';
    }
    if (position > totalTeams - RELEGATION_ZONE_SIZE) {
      return isDark
        ? 'border-l-4 border-l-red-500 bg-red-500/10'
        : 'border-l-4 border-l-red-500 bg-red-50';
    }
    return '';
  };

  if (loading) {
    return <AdminLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {t(language, 'admin.standings.title')}
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            View and sync league standings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncStandings}
            disabled={syncLoading}
            className={`px-4 py-2.5 border rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 ${
              isDark
                ? 'bg-slate-700 border-slate-600 text-white hover:border-cyan-500 hover:bg-cyan-500/20'
                : 'bg-white border-slate-200 text-slate-800 hover:border-cyan-500 hover:bg-cyan-50'
            }`}
          >
            {syncLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
            Sync All Standings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`p-5 rounded-xl ${
            isDark
              ? 'bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/50'
              : 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-lg ${
                isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'
              }`}
            >
              <Trophy className="text-blue-500" size={24} />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                Active Leagues
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {leagues.length}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`p-5 rounded-xl ${
            isDark
              ? 'bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700/50'
              : 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-lg ${
                isDark ? 'bg-green-500/20' : 'bg-green-500/10'
              }`}
            >
              <Users className="text-green-500" size={24} />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                Teams in Standing
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {standings.length}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`p-5 rounded-xl ${
            isDark
              ? 'bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700/50'
              : 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-lg ${
                isDark ? 'bg-purple-500/20' : 'bg-purple-500/10'
              }`}
            >
              <TrendingUp className="text-purple-500" size={24} />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
                Selected League
              </p>
              <p
                className={`text-lg font-bold truncate max-w-[180px] ${
                  isDark ? 'text-white' : 'text-slate-800'
                }`}
                title={selectedLeague?.name || t(language, 'admin.standings.noneSelected')}
              >
                {selectedLeague?.name || t(language, 'admin.standings.noneSelected')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`p-4 rounded-xl ${
          isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-slate-200'
        }`}
      >
        <label
          className={`block text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-slate-700'
          }`}
        >
          Select League
        </label>
        <div className="relative">
          <button
            onClick={() => setIsLeagueDropdownOpen(!isLeagueDropdownOpen)}
            className={`w-full md:w-96 px-4 py-3 rounded-xl border flex items-center justify-between transition-colors ${
              isDark
                ? 'bg-slate-700 border-slate-600 text-white hover:border-cyan-500'
                : 'bg-white border-slate-300 text-slate-800 hover:border-cyan-500'
            }`}
          >
            <div className="flex items-center gap-3">
              {selectedLeague?.logoUrl && (
                <Image
                  src={selectedLeague.logoUrl}
                  alt={selectedLeague.name}
                  width={24}
                  height={24}
                  className="rounded"
                />
              )}
              <span>{selectedLeague?.name || 'Select a league...'}</span>
            </div>
            <ChevronDown
              size={20}
              className={`transition-transform ${isLeagueDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isLeagueDropdownOpen && (
            <div
              className={`absolute z-50 w-full md:w-96 mt-2 rounded-xl border shadow-lg max-h-80 overflow-hidden ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}
            >
              <div className={`p-2 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className="relative">
                  <Search
                    size={18}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-gray-400' : 'text-slate-400'
                    }`}
                  />
                  <input
                    type="text"
                    placeholder={t(language, 'admin.standings.searchLeagues')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400'
                        : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div className="overflow-y-auto max-h-60">
                {filteredLeagues.length === 0 ? (
                  <div
                    className={`p-4 text-center ${isDark ? 'text-gray-400' : 'text-slate-500'}`}
                  >
                    No leagues found
                  </div>
                ) : (
                  filteredLeagues.map((league) => (
                    <button
                      key={league.id}
                      onClick={() => handleLeagueSelect(league.id)}
                      className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                        league.id === selectedLeagueId
                          ? isDark
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-cyan-50 text-cyan-700'
                          : isDark
                          ? 'hover:bg-slate-700 text-white'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      {league.logoUrl ? (
                        <Image
                          src={league.logoUrl}
                          alt={league.name}
                          width={24}
                          height={24}
                          className="rounded"
                        />
                      ) : (
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center ${
                            isDark ? 'bg-slate-600' : 'bg-slate-200'
                          }`}
                        >
                          <Trophy size={14} />
                        </div>
                      )}
                      <div className="text-left">
                        <div className="font-medium">{league.name}</div>
                        {league.country && (
                          <div
                            className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}
                          >
                            {league.country}
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`rounded-xl overflow-hidden border ${
          isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
        }`}
      >
        {leagueInfo && (
          <div
            className={`px-6 py-4 border-b ${
              isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              {leagueInfo.logoUrl && (
                <Image
                  src={leagueInfo.logoUrl}
                  alt={leagueInfo.name}
                  width={40}
                  height={40}
                  className="rounded"
                />
              )}
              <div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {leagueInfo.name}
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  {standings.length} teams
                </p>
              </div>
            </div>
          </div>
        )}

        {standingsLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-cyan-500" />
          </div>
        ) : standings.length === 0 ? (
          <div
            className={`p-12 text-center ${isDark ? 'text-gray-400' : 'text-slate-500'}`}
          >
            {selectedLeagueId
              ? 'No standings available for this league. Try syncing standings first.'
              : 'Select a league to view standings.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr
                  className={`text-xs uppercase ${
                    isDark
                      ? 'bg-slate-900/50 text-gray-400'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <th className="px-4 py-3 text-left font-semibold">#</th>
                  <th className="px-4 py-3 text-left font-semibold">{t(language, 'results.team')}</th>
                  <th className="px-4 py-3 text-center font-semibold">{t(language, 'results.played')}</th>
                  <th className="px-4 py-3 text-center font-semibold">{t(language, 'results.won')}</th>
                  <th className="px-4 py-3 text-center font-semibold">{t(language, 'results.drawn')}</th>
                  <th className="px-4 py-3 text-center font-semibold">{t(language, 'results.lost')}</th>
                  <th className="px-4 py-3 text-center font-semibold">{t(language, 'results.goalsFor')}</th>
                  <th className="px-4 py-3 text-center font-semibold">{t(language, 'results.goalsAgainst')}</th>
                  <th className="px-4 py-3 text-center font-semibold">{t(language, 'results.goalDiff')}</th>
                  <th className="px-4 py-3 text-center font-semibold">{t(language, 'results.points')}</th>
                  <th className="px-4 py-3 text-center font-semibold">{t(language, 'results.form')}</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing, index) => (
                  <tr
                    key={`${standing.team.id}-${standing.position}`}
                    className={`border-b transition-colors ${
                      isDark
                        ? 'border-slate-700 hover:bg-slate-700/50'
                        : 'border-slate-100 hover:bg-slate-50'
                    } ${getPositionStyle(standing.position, standings.length)}`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold ${
                          standing.position <= 4
                            ? 'text-blue-500'
                            : standing.position <= 6
                            ? 'text-orange-500'
                            : standing.position > standings.length - 3
                            ? 'text-red-500'
                            : isDark
                            ? 'text-white'
                            : 'text-slate-800'
                        }`}
                      >
                        {standing.position}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {standing.team.logoUrl ? (
                          <Image
                            src={standing.team.logoUrl}
                            alt={standing.team.name}
                            width={28}
                            height={28}
                            className="rounded"
                          />
                        ) : (
                          <div
                            className={`w-7 h-7 rounded flex items-center justify-center ${
                              isDark ? 'bg-slate-600' : 'bg-slate-200'
                            }`}
                          >
                            <Users size={14} />
                          </div>
                        )}
                        <span
                          className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}
                        >
                          {standing.team.name}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`px-4 py-3 text-center ${
                        isDark ? 'text-gray-300' : 'text-slate-600'
                      }`}
                    >
                      {standing.played}
                    </td>
                    <td
                      className={`px-4 py-3 text-center ${
                        isDark ? 'text-gray-300' : 'text-slate-600'
                      }`}
                    >
                      {standing.won}
                    </td>
                    <td
                      className={`px-4 py-3 text-center ${
                        isDark ? 'text-gray-300' : 'text-slate-600'
                      }`}
                    >
                      {standing.drawn}
                    </td>
                    <td
                      className={`px-4 py-3 text-center ${
                        isDark ? 'text-gray-300' : 'text-slate-600'
                      }`}
                    >
                      {standing.lost}
                    </td>
                    <td
                      className={`px-4 py-3 text-center ${
                        isDark ? 'text-gray-300' : 'text-slate-600'
                      }`}
                    >
                      {standing.goalsFor}
                    </td>
                    <td
                      className={`px-4 py-3 text-center ${
                        isDark ? 'text-gray-300' : 'text-slate-600'
                      }`}
                    >
                      {standing.goalsAgainst}
                    </td>
                    <td
                      className={`px-4 py-3 text-center font-medium ${
                        standing.goalDiff > 0
                          ? 'text-green-500'
                          : standing.goalDiff < 0
                          ? 'text-red-500'
                          : isDark
                          ? 'text-gray-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {standing.goalDiff > 0 ? `+${standing.goalDiff}` : standing.goalDiff}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-bold text-lg ${
                          isDark ? 'text-white' : 'text-slate-800'
                        }`}
                      >
                        {standing.points}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        {renderFormBadges(standing.form)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {standings.length > 0 && (
          <div
            className={`px-6 py-4 border-t ${
              isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                  Champions League
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded" />
                <span className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                  Europa League
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                  Relegation Zone
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLeagueDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsLeagueDropdownOpen(false)}
        />
      )}
    </div>
  );
}
