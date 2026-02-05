'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Play,
  CheckCircle,
  XCircle,
  Pause,
  Loader2,
  Gamepad2,
  Star,
  StarOff,
  Zap,
  ZapOff,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { matchesService, leaguesService, teamsService, apiFootballSyncService, Match, MatchStatus, League, Team } from '@/services/match.service';
import { AdminLoading, TableSkeleton } from '@/components/admin/AdminLoading';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { SearchableSelect } from '../leagues/components/searchable-select';
import {
  MatchesFilters,
  type MatchStatusFilter,
  type MatchBettingFilter,
  type MatchFeaturedFilter,
  type MatchesFiltersValue,
} from './components/matches-filters';

export default function AdminMatchesPage() {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';

  const [matches, setMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<MatchStatusFilter>('all');
  const [bettingFilter, setBettingFilter] = useState<MatchBettingFilter>('all');
  const [featuredFilter, setFeaturedFilter] = useState<MatchFeaturedFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [bettingSaving, setBettingSaving] = useState<Record<string, boolean>>({});
  const [featuredSaving, setFeaturedSaving] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState(false);

  const [editForm, setEditForm] = useState({
    status: '' as MatchStatus | '',
    homeScore: 0,
    awayScore: 0,
    startTime: '',
  });

  const [createForm, setCreateForm] = useState({
    leagueId: '',
    homeTeamId: '',
    awayTeamId: '',
    startTime: '',
  });

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page,
        limit: 20,
        search: searchQuery || undefined,
        leagueId: leagueFilter !== 'all' ? leagueFilter : undefined,
        teamId: teamFilter !== 'all' ? teamFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        bettingEnabled: bettingFilter !== 'all' ? bettingFilter === 'enabled' : undefined,
        isFeatured: featuredFilter !== 'all' ? featuredFilter === 'featured' : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy: 'startTime',
        sortOrder: 'desc',
      };
      const response = await matchesService.getAll(params);
      setMatches(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, leagueFilter, teamFilter, statusFilter, bettingFilter, featuredFilter, dateFrom, dateTo]);

  const fetchLeaguesAndTeams = async () => {
    try {
      const [leaguesRes, teamsRes] = await Promise.all([
        leaguesService.getAll({ limit: 500, isActive: true }),
        teamsService.getAll({ limit: 500, isActive: true }),
      ]);
      setLeagues(leaguesRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      console.error('Failed to fetch leagues/teams:', error);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    fetchLeaguesAndTeams();
  }, []);

  const handleFiltersChange = (patch: Partial<MatchesFiltersValue>) => {
    if (patch.searchQuery !== undefined) setSearchQuery(patch.searchQuery);
    if (patch.leagueId !== undefined) setLeagueFilter(patch.leagueId);
    if (patch.teamId !== undefined) setTeamFilter(patch.teamId);
    if (patch.status !== undefined) setStatusFilter(patch.status);
    if (patch.betting !== undefined) setBettingFilter(patch.betting);
    if (patch.featured !== undefined) setFeaturedFilter(patch.featured);
    if (patch.dateFrom !== undefined) setDateFrom(patch.dateFrom);
    if (patch.dateTo !== undefined) setDateTo(patch.dateTo);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setLeagueFilter('all');
    setTeamFilter('all');
    setStatusFilter('all');
    setBettingFilter('all');
    setFeaturedFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleSyncFromApiFootball = async () => {
    try {
      setSyncing(true);
      const today = new Date();
      const from = new Date(today);
      from.setDate(from.getDate() - 1);
      const to = new Date(today);
      to.setDate(to.getDate() + 7);

      const fromStr = from.toISOString().split('T')[0];
      const toStr = to.toISOString().split('T')[0];

      const result = await apiFootballSyncService.syncFixtures(fromStr, toStr);
      
      if (result.errors.length > 0) {
        toast.warning(`Sync completed with ${result.errors.length} errors. Created: ${result.created}, Updated: ${result.updated}`);
      } else {
        toast.success(`Sync completed! Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}`);
      }
      
      fetchMatches();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to sync matches from API-Football'));
    } finally {
      setSyncing(false);
    }
  };

  const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === 'object' && error !== null) {
      const response = (error as { response?: { data?: { message?: unknown } } }).response;
      const message = response?.data?.message;
      if (typeof message === 'string' && message.trim().length > 0) return message;
    }
    if (error instanceof Error && error.message.trim().length > 0) return error.message;
    return fallback;
  };

  const patchMatchInState = (updated: Match) => {
    setMatches((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
  };

  const handleToggleBetting = async (matchId: string) => {
    try {
      setBettingSaving((prev) => ({ ...prev, [matchId]: true }));
      const updated = await matchesService.toggleBetting(matchId);
      patchMatchInState(updated);
      toast.success('Betting status updated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update betting status'));
    } finally {
      setBettingSaving((prev) => ({ ...prev, [matchId]: false }));
    }
  };

  const handleToggleFeatured = async (matchId: string) => {
    try {
      setFeaturedSaving((prev) => ({ ...prev, [matchId]: true }));
      const updated = await matchesService.toggleFeatured(matchId);
      patchMatchInState(updated);
      toast.success('Featured status updated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update featured status'));
    } finally {
      setFeaturedSaving((prev) => ({ ...prev, [matchId]: false }));
    }
  };

  const handleDelete = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return;
    try {
      await matchesService.delete(matchId);
      toast.success('Match deleted successfully');
      fetchMatches();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete match'));
    }
  };

  const handleCreate = async () => {
    if (!createForm.leagueId || !createForm.homeTeamId || !createForm.awayTeamId || !createForm.startTime) {
      toast.error('Please fill all required fields');
      return;
    }
    if (createForm.homeTeamId === createForm.awayTeamId) {
      toast.error('Home team and away team cannot be the same');
      return;
    }
    try {
      setActionLoading(true);
      await matchesService.create({
        leagueId: createForm.leagueId,
        homeTeamId: createForm.homeTeamId,
        awayTeamId: createForm.awayTeamId,
        startTime: new Date(createForm.startTime).toISOString(),
      });
      toast.success('Match created successfully');
      setShowCreateModal(false);
      setCreateForm({ leagueId: '', homeTeamId: '', awayTeamId: '', startTime: '' });
      fetchMatches();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create match'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedMatch) return;
    try {
      setActionLoading(true);
      const updateData: Record<string, unknown> = {};
      if (editForm.status) updateData.status = editForm.status;
      if (editForm.startTime) updateData.startTime = new Date(editForm.startTime).toISOString();

      if (editForm.status === 'live' || editForm.status === 'finished' || selectedMatch.status === 'live') {
        await matchesService.updateScore(selectedMatch.id, {
          homeScore: editForm.homeScore,
          awayScore: editForm.awayScore,
          status: editForm.status as MatchStatus || undefined,
        });
      } else if (Object.keys(updateData).length > 0) {
        await matchesService.update(selectedMatch.id, updateData);
      }

      toast.success('Match updated successfully');
      setShowEditModal(false);
      fetchMatches();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update match'));
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (match: Match) => {
    setSelectedMatch(match);
    const dt = new Date(match.startTime);
    setEditForm({
      status: match.status,
      homeScore: match.homeScore || 0,
      awayScore: match.awayScore || 0,
      startTime: dt.toISOString().slice(0, 16),
    });
    setShowEditModal(true);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-GB'),
      time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getStatusBadge = (status: string) => {
    const darkConfig: Record<string, { bg: string; text: string; label: string; icon: React.ElementType }> = {
      scheduled: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Scheduled', icon: Calendar },
      live: { bg: 'bg-red-500/20', text: 'text-red-400', label: '🔴 LIVE', icon: Play },
      finished: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Finished', icon: CheckCircle },
      cancelled: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Cancelled', icon: XCircle },
      postponed: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Postponed', icon: Pause },
    };
    const lightConfig: Record<string, { bg: string; text: string; label: string; icon: React.ElementType }> = {
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Scheduled', icon: Calendar },
      live: { bg: 'bg-red-100', text: 'text-red-700', label: '🔴 LIVE', icon: Play },
      finished: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Finished', icon: CheckCircle },
      cancelled: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Cancelled', icon: XCircle },
      postponed: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Postponed', icon: Pause },
    };
    const config = isDark ? darkConfig : lightConfig;
    const c = config[status] || { bg: isDark ? 'bg-gray-500/20' : 'bg-gray-100', text: isDark ? 'text-gray-400' : 'text-gray-700', label: status, icon: Calendar };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text} ${status === 'live' ? 'animate-pulse' : ''}`}>
        {c.label}
      </span>
    );
  };

  const getScheduledCount = () => matches.filter((m) => m.status === 'scheduled').length;
  const getLiveCount = () => matches.filter((m) => m.status === 'live').length;
  const getFinishedCount = () => matches.filter((m) => m.status === 'finished').length;
  const getTotalBets = () => matches.reduce((sum, m) => sum + (m._count?.betSelections || 0), 0);

  const leagueOptions = leagues.map((l) => ({ value: l.id, label: l.name }));
  const teamOptions = teams.map((t) => ({ value: t.id, label: t.name }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Match Management
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            Total {total} matches
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <button
            onClick={handleSyncFromApiFootball}
            disabled={syncing}
            className={`px-4 py-2.5 font-semibold rounded-xl transition-all flex items-center gap-2 ${
              isDark
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/20'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {syncing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
            {syncing ? 'Syncing...' : 'Sync from API-Football'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Add Match
          </button>
        </div>
      </div>

      <MatchesFilters
        isDark={isDark}
        loading={loading}
        leagues={leagues.map((l) => ({ id: l.id, name: l.name }))}
        teams={teams.map((t) => ({ id: t.id, name: t.name }))}
        value={{
          searchQuery,
          leagueId: leagueFilter,
          teamId: teamFilter,
          status: statusFilter,
          betting: bettingFilter,
          featured: featuredFilter,
          dateFrom,
          dateTo,
        }}
        onChange={handleFiltersChange}
        onReset={handleResetFilters}
        onRefresh={fetchMatches}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-xl border ${
            isDark
              ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30'
              : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-500" size={24} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Scheduled</p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {getScheduledCount()}
              </p>
            </div>
          </div>
        </div>
        <div
          className={`p-4 rounded-xl border ${
            isDark
              ? 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30'
              : 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <Play className="text-red-500" size={24} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Live</p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {getLiveCount()}
              </p>
            </div>
          </div>
        </div>
        <div
          className={`p-4 rounded-xl border ${
            isDark
              ? 'bg-gradient-to-br from-gray-500/20 to-gray-600/10 border-gray-500/30'
              : 'bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <CheckCircle className={isDark ? 'text-gray-400' : 'text-gray-500'} size={24} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Finished</p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {getFinishedCount()}
              </p>
            </div>
          </div>
        </div>
        <div
          className={`p-4 rounded-xl border ${
            isDark
              ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30'
              : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <Trophy className="text-emerald-500" size={24} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Total Bets</p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {getTotalBets()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <TableSkeleton columns={9} rows={10} />
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-20">
          <Gamepad2 className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-slate-300'}`} />
          <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>No matches found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium"
          >
            Create first match
          </button>
        </div>
      ) : (
        <>
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className={`text-left ${
                      isDark ? 'bg-slate-700/50 text-gray-400' : 'bg-slate-50 text-slate-500'
                    }`}
                  >
                    <th className="px-4 py-3 font-medium">Match</th>
                    <th className="px-4 py-3 font-medium">League</th>
                    <th className="px-4 py-3 font-medium">Date/Time</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Bets</th>
                    <th className="px-4 py-3 font-medium">Betting</th>
                    <th className="px-4 py-3 font-medium">Featured</th>
                    <th className="px-4 py-3 font-medium">Created At</th>
                    <th className="px-4 py-3 font-medium">Updated At</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                  {matches.map((match) => {
                    const { date, time } = formatDateTime(match.startTime);
                    return (
                      <tr
                        key={match.id}
                        className={`transition-all ${
                          isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
                        } ${match.status === 'live' ? (isDark ? 'bg-red-500/5' : 'bg-red-50/50') : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                                  isDark
                                    ? 'bg-gradient-to-br from-red-500 to-red-600'
                                    : 'bg-gradient-to-br from-red-400 to-red-500'
                                } text-white`}
                              >
                                {match.homeTeam?.shortName?.charAt(0) || match.homeTeam?.name?.charAt(0) || 'H'}
                              </div>
                              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                {match.homeTeam?.name || 'Home Team'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                                  isDark
                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                    : 'bg-gradient-to-br from-blue-400 to-blue-500'
                                } text-white`}
                              >
                                {match.awayTeam?.shortName?.charAt(0) || match.awayTeam?.name?.charAt(0) || 'A'}
                              </div>
                              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                {match.awayTeam?.name || 'Away Team'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-medium ${
                              isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {match.league?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className={`text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{date}</span>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{time}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {match.status === 'live' || match.status === 'finished' ? (
                            <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                              {match.homeScore ?? 0} - {match.awayScore ?? 0}
                            </span>
                          ) : (
                            <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>--</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(match.status)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-bold ${
                              isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                            }`}
                          >
                            {match._count?.betSelections || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleBetting(match.id)}
                            disabled={match.status === 'finished' || match.status === 'cancelled' || !!bettingSaving[match.id]}
                            className={`p-1.5 rounded-lg transition-colors ${
                              match.bettingEnabled
                                ? isDark
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-emerald-100 text-emerald-600'
                                : isDark
                                ? 'bg-slate-700 text-gray-500 hover:text-emerald-400'
                                : 'bg-slate-100 text-slate-400 hover:text-emerald-500'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {bettingSaving[match.id] ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : match.bettingEnabled ? (
                              <Zap size={18} />
                            ) : (
                              <ZapOff size={18} />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleFeatured(match.id)}
                            disabled={!!featuredSaving[match.id]}
                            className={`p-1.5 rounded-lg transition-colors ${
                              match.isFeatured
                                ? 'bg-yellow-500/20 text-yellow-500'
                                : isDark
                                ? 'bg-slate-700 text-gray-500 hover:text-yellow-500'
                                : 'bg-slate-100 text-slate-400 hover:text-yellow-500'
                            } disabled:opacity-50`}
                          >
                            {featuredSaving[match.id] ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : match.isFeatured ? (
                              <Star size={18} />
                            ) : (
                              <StarOff size={18} />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            {new Date(match.createdAt).toLocaleString('en-CA', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            }).replace(',', '')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            {new Date(match.updatedAt).toLocaleString('en-CA', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            }).replace(',', '')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedMatch(match);
                                setShowDetailModal(true);
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                isDark
                                  ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                              }`}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(match)}
                              className={`p-2 rounded-lg transition-colors ${
                                isDark
                                  ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                                  : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                              }`}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(match.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                isDark
                                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                  : 'bg-red-100 text-red-600 hover:bg-red-200'
                              }`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`p-2 border rounded-lg transition-colors disabled:opacity-50 ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-gray-400 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-800'
                }`}
              >
                <ChevronLeft size={18} />
              </button>
              <span className={isDark ? 'text-gray-400 px-4' : 'text-slate-500 px-4'}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`p-2 border rounded-lg transition-colors disabled:opacity-50 ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-gray-400 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-800'
                }`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {showDetailModal && selectedMatch && (() => {
        const { date, time } = formatDateTime(selectedMatch.startTime);
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div
              className={`rounded-2xl border p-6 w-full max-w-lg mx-4 ${
                isDark
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Match Details
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-slate-700 text-gray-400 hover:text-white'
                      : 'bg-slate-100 text-slate-400 hover:text-slate-800'
                  }`}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    {selectedMatch.league?.name}
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-2 ${
                          isDark
                            ? 'bg-gradient-to-br from-red-500 to-red-600'
                            : 'bg-gradient-to-br from-red-400 to-red-500'
                        } text-white`}
                      >
                        {selectedMatch.homeTeam?.shortName || selectedMatch.homeTeam?.name?.charAt(0)}
                      </div>
                      <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {selectedMatch.homeTeam?.name}
                      </p>
                    </div>
                    <div className="text-center">
                      {selectedMatch.status === 'live' || selectedMatch.status === 'finished' ? (
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          {selectedMatch.homeScore ?? 0} - {selectedMatch.awayScore ?? 0}
                        </p>
                      ) : (
                        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>VS</p>
                      )}
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{time}</p>
                    </div>
                    <div className="text-center">
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-2 ${
                          isDark
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                            : 'bg-gradient-to-br from-blue-400 to-blue-500'
                        } text-white`}
                      >
                        {selectedMatch.awayTeam?.shortName || selectedMatch.awayTeam?.name?.charAt(0)}
                      </div>
                      <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {selectedMatch.awayTeam?.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl space-y-3 ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Status</span>
                    {getStatusBadge(selectedMatch.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Date</span>
                    <span className={isDark ? 'text-white' : 'text-slate-800'}>{date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Time</span>
                    <span className={isDark ? 'text-white' : 'text-slate-800'}>{time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Total Bets</span>
                    <span className="text-emerald-500 font-bold">{selectedMatch._count?.betSelections || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Betting</span>
                    <span className={selectedMatch.bettingEnabled ? 'text-emerald-500' : 'text-red-500'}>
                      {selectedMatch.bettingEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Featured</span>
                    <span className={selectedMatch.isFeatured ? 'text-yellow-500' : (isDark ? 'text-gray-400' : 'text-slate-400')}>
                      {selectedMatch.isFeatured ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDetailModal(false)}
                className={`w-full mt-6 py-3 rounded-xl transition-colors ${
                  isDark
                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        );
      })()}

      {showEditModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8">
          <div
            className={`rounded-2xl border p-6 w-full max-w-lg mx-4 ${
              isDark
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Edit Match</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-slate-700 text-gray-400 hover:text-white'
                    : 'bg-slate-100 text-slate-400 hover:text-slate-800'
                }`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value as MatchStatus }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live</option>
                  <option value="finished">Finished</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="postponed">Postponed</option>
                </select>
              </div>

              {(editForm.status === 'live' || editForm.status === 'finished' || selectedMatch.status === 'live') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      Home Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.homeScore}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, homeScore: parseInt(e.target.value) || 0 }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                        isDark
                          ? 'bg-slate-700 border-slate-600 text-white'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      Away Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.awayScore}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, awayScore: parseInt(e.target.value) || 0 }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                        isDark
                          ? 'bg-slate-700 border-slate-600 text-white'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, startTime: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={actionLoading}
                className={`flex-1 py-3 rounded-xl transition-colors ${
                  isDark
                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={actionLoading}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading && <Loader2 size={18} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8">
          <div
            className={`rounded-2xl border p-6 w-full max-w-lg mx-4 ${
              isDark
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Create New Match</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-slate-700 text-gray-400 hover:text-white'
                    : 'bg-slate-100 text-slate-400 hover:text-slate-800'
                }`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  League *
                </label>
                <SearchableSelect
                  value={createForm.leagueId}
                  options={leagueOptions}
                  onChange={(newValue) => setCreateForm((prev) => ({ ...prev, leagueId: newValue }))}
                  placeholder="Select league"
                  isDark={isDark}
                  allLabel="Select a league"
                />
              </div>

              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Home Team *
                </label>
                <SearchableSelect
                  value={createForm.homeTeamId}
                  options={teamOptions}
                  onChange={(newValue) => setCreateForm((prev) => ({ ...prev, homeTeamId: newValue }))}
                  placeholder="Select home team"
                  isDark={isDark}
                  allLabel="Select a team"
                />
              </div>

              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Away Team *
                </label>
                <SearchableSelect
                  value={createForm.awayTeamId}
                  options={teamOptions.filter((t) => t.value !== createForm.homeTeamId)}
                  onChange={(newValue) => setCreateForm((prev) => ({ ...prev, awayTeamId: newValue }))}
                  placeholder="Select away team"
                  isDark={isDark}
                  allLabel="Select a team"
                />
              </div>

              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={createForm.startTime}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, startTime: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={actionLoading}
                className={`flex-1 py-3 rounded-xl transition-colors ${
                  isDark
                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={actionLoading}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading && <Loader2 size={18} className="animate-spin" />}
                Create Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
