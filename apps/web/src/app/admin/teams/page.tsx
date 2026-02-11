'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Globe,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { teamsService, sportsService, Team, Sport, apiFootballSyncService } from '@/services/match.service';
import { AdminLoading } from '@/components/admin/AdminLoading';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { useLanguageStore } from '@/stores/language.store';
import { t } from '@/lib/i18n';

export default function AdminTeamsPage() {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';
  const language = useLanguageStore((s) => s.language);

  const [teams, setTeams] = useState<Team[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [activeSaving, setActiveSaving] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);

  const [editForm, setEditForm] = useState({
    sportId: '',
    name: '',
    shortName: '',
    slug: '',
    country: '',
    countryCode: '',
    logoUrl: '',
    isActive: true,
  });

  const [createForm, setCreateForm] = useState({
    sportId: '',
    name: '',
    shortName: '',
    slug: '',
    country: '',
    countryCode: '',
    logoUrl: '',
    isActive: true,
  });

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page,
        limit: 20,
        search: searchQuery || undefined,
        sportId: sportFilter !== 'all' ? sportFilter : undefined,
        country: countryFilter !== 'all' ? countryFilter : undefined,
        isActive: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
        sortBy: 'name',
        sortOrder: 'asc',
      };
      const response = await teamsService.getAll(params);
      setTeams(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, sportFilter, countryFilter, statusFilter]);

  const fetchSports = async () => {
    try {
      const response = await sportsService.getAll({ limit: 100 });
      setSports(response.data);
    } catch (error) {
      console.error('Failed to fetch sports:', error);
    }
  };

  const fetchCountries = useCallback(async () => {
    try {
      const response = await teamsService.getAll({ limit: 1000 });
      const uniqueCountries = response.data
        .filter((team) => team.country && team.countryCode)
        .reduce((acc, team) => {
          const key = team.country!;
          if (!acc.has(key)) {
            acc.set(key, {
              code: team.countryCode!,
              name: team.country!,
            });
          }
          return acc;
        }, new Map<string, { code: string; name: string }>());

      const sortedCountries = Array.from(uniqueCountries.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setCountries(sortedCountries);
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    fetchSports();
    fetchCountries();
  }, [fetchCountries]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSportFilter('all');
    setCountryFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
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

  const handleToggleActive = async (teamId: string) => {
    try {
      setActiveSaving((prev) => ({ ...prev, [teamId]: true }));
      const updated = await teamsService.toggleActive(teamId);
      setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success('Team status updated');
    } catch (error) {
      toast.error('Failed to update team status');
    } finally {
      setActiveSaving((prev) => ({ ...prev, [teamId]: false }));
    }
  };

  const handleSyncTeams = async () => {
    try {
      setSyncLoading(true);
      const result = await apiFootballSyncService.syncTeams();
      toast.success(
        `Synced ${result.totalFetched} teams: ${result.created} created, ${result.updated} updated`
      );
      fetchTeams();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to sync teams from API-Football'));
    } finally {
      setSyncLoading(false);
    }
  };

  const handleDelete = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    try {
      await teamsService.delete(teamId);
      toast.success('Team deleted successfully');
      fetchTeams();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete team'));
    }
  };

  const handleCreate = async () => {
    if (!createForm.sportId || !createForm.name || !createForm.slug) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      setActionLoading(true);
      await teamsService.create(createForm);
      toast.success('Team created successfully');
      setShowCreateModal(false);
      setCreateForm({
        sportId: '',
        name: '',
        shortName: '',
        slug: '',
        country: '',
        countryCode: '',
        logoUrl: '',
        isActive: true,
      });
      fetchTeams();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create team'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTeam) return;
    if (!editForm.name || !editForm.slug) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      setActionLoading(true);
      await teamsService.update(selectedTeam.id, editForm);
      toast.success('Team updated successfully');
      setShowEditModal(false);
      fetchTeams();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update team'));
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (team: Team) => {
    setSelectedTeam(team);
    setEditForm({
      sportId: team.sportId,
      name: team.name,
      shortName: team.shortName || '',
      slug: team.slug,
      country: team.country || '',
      countryCode: team.countryCode || '',
      logoUrl: team.logoUrl || '',
      isActive: team.isActive,
    });
    setShowEditModal(true);
  };

  const getActiveCount = () => teams.filter((t) => t.isActive).length;
  const getTotalMatches = () =>
    teams.reduce((sum, t) => sum + (t._count?.homeMatches || 0) + (t._count?.awayMatches || 0), 0);

  const hasActiveFilters =
    searchQuery || sportFilter !== 'all' || countryFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {t(language, 'admin.teams.title')}
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            {t(language, 'admin.common.total')} {total} teams
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <button
            onClick={handleSyncTeams}
            disabled={loading || syncLoading}
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
            Sync Teams
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Add Team
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className={`p-4 rounded-2xl border ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search
                size={18}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-gray-500' : 'text-slate-400'
                }`}
              />
              <input
                type="text"
                placeholder={t(language, 'admin.common.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500'
                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 border rounded-xl transition-colors flex items-center gap-2 ${
              showFilters || hasActiveFilters
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                : isDark
                ? 'bg-slate-700 border-slate-600 text-gray-400 hover:text-white'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            <Filter size={18} />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* Refresh */}
          <button
            onClick={fetchTeams}
            disabled={loading}
            className={`p-2.5 border rounded-xl transition-colors ${
              isDark
                ? 'bg-slate-700 border-slate-600 text-gray-400 hover:text-white'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4 ${isDark ? 'border-slate-700' : 'border-slate-200'}">
            {/* Sport Filter */}
            <div>
              <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                {t(language, 'admin.common.sport')}
              </label>
              <select
                value={sportFilter}
                onChange={(e) => {
                  setSportFilter(e.target.value);
                  setPage(1);
                }}
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <option value="all">{t(language, 'admin.teams.allSports')}</option>
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Country Filter */}
            <div>
              <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                {t(language, 'admin.common.country')}
              </label>
              <select
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setPage(1);
                }}
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <option value="all">{t(language, 'admin.teams.allCountries')}</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                {t(language, 'admin.common.status')}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
                  setPage(1);
                }}
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <option value="all">{t(language, 'admin.teams.allStatus')}</option>
                <option value="active">{t(language, 'admin.common.active')}</option>
                <option value="inactive">{t(language, 'admin.common.inactive')}</option>
              </select>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <div className="md:col-span-3">
                <button
                  onClick={handleResetFilters}
                  className={`flex items-center gap-2 text-sm transition-colors ${
                    isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <X size={16} />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-xl border ${
            isDark
              ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30'
              : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <Users className="text-emerald-500" size={24} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t(language, 'admin.common.total')}</p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {total}
              </p>
            </div>
          </div>
        </div>
        <div
          className={`p-4 rounded-xl border ${
            isDark
              ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30'
              : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="text-blue-500" size={24} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t(language, 'admin.common.active')}</p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {getActiveCount()}
              </p>
            </div>
          </div>
        </div>
        <div
          className={`p-4 rounded-xl border ${
            isDark
              ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/30'
              : 'bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <Globe className="text-yellow-500" size={24} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t(language, 'admin.common.country')}</p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {countries.length}
              </p>
            </div>
          </div>
        </div>
        <div
          className={`p-4 rounded-xl border ${
            isDark
              ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30'
              : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <Globe className="text-purple-500" size={24} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t(language, 'admin.nav.matches')}</p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {getTotalMatches()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <AdminLoading text="Loading teams..." />
      ) : teams.length === 0 ? (
        <div className="text-center py-20">
          <Users className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-slate-300'}`} />
          <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t(language, 'admin.teams.noTeams')}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium"
          >
            Create first team
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
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr
                    className={`text-left ${
                      isDark ? 'bg-slate-700/50 text-gray-400' : 'bg-slate-50 text-slate-500'
                    }`}
                  >
                    <th className="px-4 py-3 font-medium">{t(language, 'admin.teams.title')}</th>
                    <th className="px-4 py-3 font-medium">{t(language, 'admin.teams.shortName')}</th>
                    <th className="px-4 py-3 font-medium">{t(language, 'admin.common.sport')}</th>
                    <th className="px-4 py-3 font-medium">{t(language, 'admin.common.country')}</th>
                    <th className="px-4 py-3 font-medium">{t(language, 'admin.nav.matches')}</th>
                    <th className="px-4 py-3 font-medium">{t(language, 'admin.common.status')}</th>
                    <th className="px-4 py-3 font-medium text-right">{t(language, 'admin.common.actions')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                  {teams.map((team) => (
                    <tr
                      key={team.id}
                      className={`transition-all ${
                        isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {team.logoUrl ? (
                            <img
                              src={team.logoUrl}
                              alt={team.name}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-200"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isDark
                                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                                  : 'bg-gradient-to-br from-emerald-400 to-emerald-500'
                              }`}
                            >
                              <Users className="text-white" size={20} />
                            </div>
                          )}
                          <div>
                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                              {team.name}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                              {team.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>
                          {team.shortName || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            isDark
                              ? 'bg-slate-700 text-slate-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {team.sport?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {team.countryCode && (
                            <img
                              src={`https://flagcdn.com/16x12/${team.countryCode.toLowerCase()}.png`}
                              alt={team.country}
                              className="w-4 h-3 object-cover"
                            />
                          )}
                          <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>
                            {team.country || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            isDark
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-purple-100 text-purple-600'
                          }`}
                        >
                          {(team._count?.homeMatches || 0) + (team._count?.awayMatches || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(team.id)}
                          disabled={!!activeSaving[team.id]}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            team.isActive
                              ? isDark
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-emerald-100 text-emerald-600'
                              : isDark
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-red-100 text-red-600'
                          } ${activeSaving[team.id] ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                        >
                          {activeSaving[team.id] ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : team.isActive ? (
                            <CheckCircle size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          {team.isActive ? t(language, 'admin.common.active') : t(language, 'admin.common.inactive')}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedTeam(team);
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
                            onClick={() => openEditModal(team)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark
                                ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                                : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                            }`}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(team.id)}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
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

      {/* Detail Modal */}
      {showDetailModal && selectedTeam && (
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
                {t(language, 'admin.teams.teamDetails')}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-slate-700 text-gray-400 hover:text-white'
                    : 'bg-slate-100 text-slate-400 hover:text-slate-800'
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedTeam.logoUrl ? (
                  <img
                    src={selectedTeam.logoUrl}
                    alt={selectedTeam.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <Users className="text-white" size={32} />
                  </div>
                )}
                <div>
                  <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {selectedTeam.name}
                  </h4>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    {selectedTeam.slug}
                  </p>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl space-y-3 ${
                  isDark ? 'bg-slate-700/50' : 'bg-slate-50'
                }`}
              >
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t(language, 'admin.teams.shortName')}</span>
                  <span className={isDark ? 'text-white' : 'text-slate-800'}>
                    {selectedTeam.shortName || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t(language, 'admin.common.sport')}</span>
                  <span className={isDark ? 'text-white' : 'text-slate-800'}>
                    {selectedTeam.sport?.name || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t(language, 'admin.common.country')}</span>
                  <span className={isDark ? 'text-white' : 'text-slate-800'}>
                    {selectedTeam.country || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t(language, 'admin.teams.totalMatches')}</span>
                  <span className="text-emerald-500 font-bold">
                    {(selectedTeam._count?.homeMatches || 0) + (selectedTeam._count?.awayMatches || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t(language, 'admin.common.status')}</span>
                  <span className={selectedTeam.isActive ? 'text-emerald-500' : 'text-red-500'}>
                    {selectedTeam.isActive ? t(language, 'admin.common.active') : t(language, 'admin.common.inactive')}
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
              {t(language, 'admin.common.close')}
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8">
          <div
            className={`rounded-2xl border p-6 w-full max-w-lg mx-4 ${
              isDark
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {t(language, 'admin.teams.editTeam')}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-slate-700 text-gray-400 hover:text-white'
                    : 'bg-slate-100 text-slate-400 hover:text-slate-800'
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  {t(language, 'admin.common.sport')} *
                </label>
                <select
                  value={editForm.sportId}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, sportId: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="">Select sport</option>
                  {sports.map((sport) => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  {t(language, 'admin.common.name')} *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setEditForm((prev) => ({
                      ...prev,
                      name,
                      slug: generateSlug(name),
                    }));
                  }}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  {t(language, 'admin.teams.shortName')}
                </label>
                <input
                  type="text"
                  value={editForm.shortName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, shortName: e.target.value }))}
                  placeholder="e.g., MUN"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500'
                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Slug *
                </label>
                <input
                  type="text"
                  value={editForm.slug}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, slug: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    {t(language, 'admin.common.country')}
                  </label>
                  <input
                    type="text"
                    value={editForm.country}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, country: e.target.value }))}
                    placeholder="e.g., England"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500'
                        : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    Country Code
                  </label>
                  <input
                    type="text"
                    value={editForm.countryCode}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, countryCode: e.target.value.toUpperCase() }))
                    }
                    placeholder="e.g., GB"
                    maxLength={2}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500'
                        : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Logo URL
                </label>
                <input
                  type="text"
                  value={editForm.logoUrl}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
                  placeholder="https://..."
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500'
                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="w-5 h-5 rounded-lg border-slate-300 text-emerald-500 focus:ring-emerald-500"
                />
                <label
                  htmlFor="editIsActive"
                  className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}
                >
                  {t(language, 'admin.common.active')}
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className={`flex-1 py-3 rounded-xl transition-colors ${
                  isDark
                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={actionLoading}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading && <Loader2 size={18} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
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
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {t(language, 'admin.teams.createTeam')}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-slate-700 text-gray-400 hover:text-white'
                    : 'bg-slate-100 text-slate-400 hover:text-slate-800'
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  {t(language, 'admin.common.sport')} *
                </label>
                <select
                  value={createForm.sportId}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, sportId: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="">Select sport</option>
                  {sports.map((sport) => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  {t(language, 'admin.common.name')} *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setCreateForm((prev) => ({
                      ...prev,
                      name,
                      slug: generateSlug(name),
                    }));
                  }}
                  placeholder="e.g., Manchester United"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500'
                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  {t(language, 'admin.teams.shortName')}
                </label>
                <input
                  type="text"
                  value={createForm.shortName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, shortName: e.target.value }))}
                  placeholder="e.g., MUN"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500'
                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Slug *
                </label>
                <input
                  type="text"
                  value={createForm.slug}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="manchester-united"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500'
                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    {t(language, 'admin.common.country')}
                  </label>
                  <input
                    type="text"
                    value={createForm.country}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, country: e.target.value }))}
                    placeholder="e.g., England"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500'
                        : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    Country Code
                  </label>
                  <input
                    type="text"
                    value={createForm.countryCode}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, countryCode: e.target.value.toUpperCase() }))
                    }
                    placeholder="e.g., GB"
                    maxLength={2}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500'
                        : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Logo URL
                </label>
                <input
                  type="text"
                  value={createForm.logoUrl}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
                  placeholder="https://..."
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500'
                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="createIsActive"
                  checked={createForm.isActive}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="w-5 h-5 rounded-lg border-slate-300 text-emerald-500 focus:ring-emerald-500"
                />
                <label
                  htmlFor="createIsActive"
                  className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}
                >
                  {t(language, 'admin.common.active')}
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className={`flex-1 py-3 rounded-xl transition-colors ${
                  isDark
                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                {t(language, 'admin.common.cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={actionLoading}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading && <Loader2 size={18} className="animate-spin" />}
                {t(language, 'admin.teams.createTeam')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
