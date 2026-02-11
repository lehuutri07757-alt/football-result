'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Trophy,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Star,
  StarOff,
  CheckCircle,
  XCircle,
  Globe,
  Flag,
  Loader2,
  ToggleLeft,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  leaguesService,
  sportsService,
  League,
  Sport,
  LeagueStats,
  apiFootballSyncService,
} from '@/services/match.service';
import { AdminLoading } from '@/components/admin/AdminLoading';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { useLanguageStore } from '@/stores/language.store';
import { t } from '@/lib/i18n';
import {
  LeaguesFilters,
  type LeagueFeaturedFilter,
  type LeagueStatusFilter,
  type LeaguesFiltersValue,
} from './components/leagues-filters';
import { useDebounce } from '@/hooks/useDebounce';

interface DragItem {
  id: string;
  index: number;
}

export default function AdminLeaguesPage() {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';
  const language = useLanguageStore((s) => s.language);

  const [leagues, setLeagues] = useState<League[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<LeagueStatusFilter>('all');
  const [featuredFilter, setFeaturedFilter] = useState<LeagueFeaturedFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<LeagueStats | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderedLeagues, setReorderedLeagues] = useState<League[]>([]);
  const [hasReorderChanges, setHasReorderChanges] = useState(false);

  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [sortOrderDrafts, setSortOrderDrafts] = useState<Record<string, number>>({});
  const [sortOrderSaving, setSortOrderSaving] = useState<Record<string, boolean>>({});
  const [orderEditingId, setOrderEditingId] = useState<string | null>(null);
  const [activeSaving, setActiveSaving] = useState<Record<string, boolean>>({});
  const [featuredSaving, setFeaturedSaving] = useState<Record<string, boolean>>({});
  const [inactiveAllLoading, setInactiveAllLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  const [selectedLeagueIds, setSelectedLeagueIds] = useState<Set<string>>(() => new Set());
  const selectAllCheckboxRef = useRef<HTMLInputElement | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState<null | 'activate' | 'deactivate' | 'delete'>(null);

  const [editForm, setEditForm] = useState({
    sportId: '',
    name: '',
    slug: '',
    country: '',
    countryCode: '',
    logoUrl: '',
    season: '',
    sortOrder: 0,
    isActive: true,
    isFeatured: false,
  });

  const [createForm, setCreateForm] = useState({
    sportId: '',
    name: '',
    slug: '',
    country: '',
    countryCode: '',
    logoUrl: '',
    season: '',
    sortOrder: 0,
    isActive: true,
    isFeatured: false,
  });

  const fetchLeagues = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page,
        limit: 20,
        search: debouncedSearchQuery || undefined,
        sportId: sportFilter !== 'all' ? sportFilter : undefined,
        country: countryFilter !== 'all' ? countryFilter : undefined,
        isActive: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
        isFeatured: featuredFilter !== 'all' ? featuredFilter === 'featured' : undefined,
        sortBy: 'sortOrder',
        sortOrder: 'asc',
      };
      const [response, statsResponse] = await Promise.all([
        leaguesService.getAll(params),
        leaguesService.getStats({
          search: debouncedSearchQuery || undefined,
          sportId: sportFilter !== 'all' ? sportFilter : undefined,
          country: countryFilter !== 'all' ? countryFilter : undefined,
          isActive: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
          isFeatured: featuredFilter !== 'all' ? featuredFilter === 'featured' : undefined,
        }),
      ]);
      setLeagues(response.data);
      setReorderedLeagues(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
      setStats(statsResponse);
    } catch (error) {
      console.error('Failed to fetch leagues:', error);
      toast.error('Failed to load leagues');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearchQuery, sportFilter, countryFilter, statusFilter, featuredFilter]);

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
      const response = await leaguesService.getAll({ limit: 1000 });
      const uniqueCountries = response.data
        .filter((league) => league.country && league.countryCode)
        .reduce((acc, league) => {
          const key = league.country!;
          if (!acc.has(key)) {
            acc.set(key, {
              code: league.countryCode!,
              name: league.country!,
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
    fetchLeagues();
  }, [fetchLeagues]);

  useEffect(() => {
    // Keep selection valid after pagination/filter reloads.
    setSelectedLeagueIds((prev) => {
      if (prev.size === 0) return prev;
      const visibleIds = new Set(leagues.map((l) => l.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visibleIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [leagues]);

  useEffect(() => {
    if (isReorderMode) setSelectedLeagueIds(new Set());
  }, [isReorderMode]);

  useEffect(() => {
    fetchSports();
    fetchCountries();
  }, [fetchCountries]);

  const handleFiltersChange = (patch: Partial<LeaguesFiltersValue>) => {
    if (patch.searchQuery !== undefined) setSearchQuery(patch.searchQuery);
    if (patch.sportId !== undefined) setSportFilter(patch.sportId);
    if (patch.country !== undefined) setCountryFilter(patch.country);
    if (patch.status !== undefined) setStatusFilter(patch.status);
    if (patch.featured !== undefined) setFeaturedFilter(patch.featured);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSportFilter('all');
    setCountryFilter('all');
    setStatusFilter('all');
    setFeaturedFilter('all');
    setPage(1);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  useEffect(() => {
    setSortOrderDrafts((prev) => {
      const next = { ...prev };
      for (const league of leagues) {
        if (orderEditingId === league.id) {
          if (next[league.id] === undefined) next[league.id] = league.sortOrder;
          continue;
        }
        next[league.id] = league.sortOrder;
      }
      for (const id of Object.keys(next)) {
        if (!leagues.some((l) => l.id === id)) delete next[id];
      }
      return next;
    });
  }, [leagues, orderEditingId]);

  const updateLeagueSortOrderInState = (leagueId: string, sortOrder: number) => {
    setLeagues((prev) => {
      const updated = prev.map((l) => (l.id === leagueId ? { ...l, sortOrder } : l));
      return [...updated].sort((a, b) => a.sortOrder - b.sortOrder);
    });
    setReorderedLeagues((prev) => prev.map((l) => (l.id === leagueId ? { ...l, sortOrder } : l)));
  };

  const patchLeagueInState = (updated: League) => {
    setLeagues((prev) => {
      const next = prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l));
      return [...next].sort((a, b) => a.sortOrder - b.sortOrder);
    });
    setReorderedLeagues((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)));
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

  const saveSortOrder = async (league: League) => {
    const draft = sortOrderDrafts[league.id];
    if (draft === undefined) return;
    if (draft === league.sortOrder) return;

    try {
      setSortOrderSaving((prev) => ({ ...prev, [league.id]: true }));
      await leaguesService.update(league.id, { sortOrder: draft });
      updateLeagueSortOrderInState(league.id, draft);
      toast.success('Order updated');
    } catch (error) {
      setSortOrderDrafts((prev) => ({ ...prev, [league.id]: league.sortOrder }));
      toast.error(getApiErrorMessage(error, 'Failed to update order'));
    } finally {
      setSortOrderSaving((prev) => ({ ...prev, [league.id]: false }));
    }
  };

  const handleToggleActive = async (leagueId: string) => {
    try {
      setActiveSaving((prev) => ({ ...prev, [leagueId]: true }));
      const updated = await leaguesService.toggleActive(leagueId);
      patchLeagueInState(updated);
      toast.success('League status updated');
    } catch (error) {
      toast.error('Failed to update league status');
    } finally {
      setActiveSaving((prev) => ({ ...prev, [leagueId]: false }));
    }
  };

  const handleToggleFeatured = async (leagueId: string) => {
    try {
      setFeaturedSaving((prev) => ({ ...prev, [leagueId]: true }));
      const updated = await leaguesService.toggleFeatured(leagueId);
      patchLeagueInState(updated);
      toast.success('Featured status updated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update featured status'));
    } finally {
      setFeaturedSaving((prev) => ({ ...prev, [leagueId]: false }));
    }
  };

  const handleInactiveAll = async () => {
    const confirmed = confirm(
      'Are you sure you want to set ALL leagues to Inactive? This will disable them across the site.',
    );
    if (!confirmed) return;

    try {
      setInactiveAllLoading(true);
      const result = await leaguesService.inactiveAll();
      toast.success(result.message);
      fetchLeagues();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to set all leagues inactive'));
    } finally {
      setInactiveAllLoading(false);
    }
  };

  const handleSyncLeagues = async () => {
    try {
      setSyncLoading(true);
      const result = await apiFootballSyncService.syncLeagues();
      toast.success(
        `Synced ${result.totalFetched} leagues: ${result.created} created, ${result.updated} updated`,
      );
      fetchLeagues();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to sync leagues from API-Football'));
    } finally {
      setSyncLoading(false);
    }
  };

  const handleDelete = async (leagueId: string) => {
    if (!confirm('Are you sure you want to delete this league?')) return;
    try {
      await leaguesService.delete(leagueId);
      toast.success('League deleted successfully');
      fetchLeagues();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete league'));
    }
  };

  const bulkSetActive = async (isActive: boolean) => {
    const ids = Array.from(selectedLeagueIds);
    if (ids.length === 0) return;

    const confirmed = confirm(
      `Set ${ids.length} selected league(s) to ${isActive ? 'Active' : 'Inactive'}?`,
    );
    if (!confirmed) return;

    try {
      setBulkActionLoading(isActive ? 'activate' : 'deactivate');
      const results = await Promise.allSettled(
        ids.map((id) => leaguesService.update(id, { isActive })),
      );
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.length - successCount;

      if (failedCount === 0) {
        toast.success(`Updated ${successCount} league(s)`);
      } else {
        toast.error(`Updated ${successCount}; failed ${failedCount}`);
      }

      setSelectedLeagueIds(new Set());
      fetchLeagues();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update selected leagues'));
    } finally {
      setBulkActionLoading(null);
    }
  };

  const bulkDeleteSelected = async () => {
    const ids = Array.from(selectedLeagueIds);
    if (ids.length === 0) return;

    const confirmed = confirm(
      `Delete ${ids.length} selected league(s)? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      setBulkActionLoading('delete');
      const results = await Promise.allSettled(ids.map((id) => leaguesService.delete(id)));
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.length - successCount;

      if (failedCount === 0) {
        toast.success(`Deleted ${successCount} league(s)`);
      } else {
        toast.error(`Deleted ${successCount}; failed ${failedCount}`);
      }

      setSelectedLeagueIds(new Set());
      fetchLeagues();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete selected leagues'));
    } finally {
      setBulkActionLoading(null);
    }
  };

  const handleCreate = async () => {
    if (!createForm.sportId || !createForm.name || !createForm.slug) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      setActionLoading(true);
      await leaguesService.create(createForm);
      toast.success('League created successfully');
      setShowCreateModal(false);
      setCreateForm({
        sportId: '',
        name: '',
        slug: '',
        country: '',
        countryCode: '',
        logoUrl: '',
        season: '',
        sortOrder: 0,
        isActive: true,
        isFeatured: false,
      });
      fetchLeagues();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create league'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedLeague) return;
    if (!editForm.name || !editForm.slug) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      setActionLoading(true);
      await leaguesService.update(selectedLeague.id, editForm);
      toast.success('League updated successfully');
      setShowEditModal(false);
      fetchLeagues();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update league'));
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (league: League) => {
    setSelectedLeague(league);
    setEditForm({
      sportId: league.sportId,
      name: league.name,
      slug: league.slug,
      country: league.country || '',
      countryCode: league.countryCode || '',
      logoUrl: league.logoUrl || '',
      season: league.season || '',
      sortOrder: league.sortOrder,
      isActive: league.isActive,
      isFeatured: league.isFeatured,
    });
    setShowEditModal(true);
  };

  const handleDragStart = (e: React.DragEvent, id: string, index: number) => {
    setDraggedItem({ id, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItem && draggedItem.index !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.index === dropIndex) return;

    const newLeagues = [...reorderedLeagues];
    const [draggedLeague] = newLeagues.splice(draggedItem.index, 1);
    newLeagues.splice(dropIndex, 0, draggedLeague);

    const updatedLeagues = newLeagues.map((league, index) => ({
      ...league,
      sortOrder: index,
    }));

    setReorderedLeagues(updatedLeagues);
    setHasReorderChanges(true);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleSaveReorder = async () => {
    try {
      setActionLoading(true);
      const items = reorderedLeagues.map((league, index) => ({
        id: league.id,
        sortOrder: index,
      }));
      await leaguesService.reorder(items);
      toast.success('League order saved successfully');
      setHasReorderChanges(false);
      setIsReorderMode(false);
      fetchLeagues();
    } catch (error) {
      toast.error('Failed to save league order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelReorder = () => {
    setReorderedLeagues(leagues);
    setHasReorderChanges(false);
    setIsReorderMode(false);
  };

  const displayLeagues = isReorderMode ? reorderedLeagues : leagues;

  const selectableLeagueIds = !isReorderMode ? displayLeagues.map((l) => l.id) : [];
  const allVisibleSelected =
    selectableLeagueIds.length > 0 && selectableLeagueIds.every((id) => selectedLeagueIds.has(id));
  const someVisibleSelected = selectableLeagueIds.some((id) => selectedLeagueIds.has(id));

  useEffect(() => {
    if (!selectAllCheckboxRef.current) return;
    selectAllCheckboxRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
  }, [someVisibleSelected, allVisibleSelected]);

  const activeCount = stats?.active ?? 0;
  const featuredCount = stats?.featured ?? 0;
  const matchesCount = stats?.matches ?? 0;

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {t(language, 'admin.leagues.title')}
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            {t(language, 'admin.common.total')} {total}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {!isReorderMode ? (
            <>
              <button
                onClick={handleSyncLeagues}
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
                Sync Leagues
              </button>
              <button
                onClick={handleInactiveAll}
                disabled={loading || inactiveAllLoading}
                className={`px-4 py-2.5 border rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white hover:border-red-500 hover:bg-red-500/20'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-red-500 hover:bg-red-50'
                }`}
              >
                {inactiveAllLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ToggleLeft size={18} />
                )}
                Inactive All
              </button>
              <button
                onClick={() => setIsReorderMode(true)}
                className={`px-4 py-2.5 border rounded-xl transition-colors flex items-center gap-2 ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white hover:border-blue-500 hover:bg-blue-500/20'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-blue-500 hover:bg-blue-50'
                }`}
              >
                <ArrowUpDown size={18} />
                Reorder
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <Plus size={18} />
                Add League
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancelReorder}
                disabled={actionLoading}
                className={`px-4 py-2.5 border rounded-xl transition-colors ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'
                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                }`}
              >
                {t(language, 'admin.common.cancel')}
              </button>
              <button
                onClick={handleSaveReorder}
                disabled={actionLoading || !hasReorderChanges}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading && <Loader2 size={18} className="animate-spin" />}
                {t(language, 'admin.common.save')}
              </button>
            </>
          )}
        </div>
      </div>

      <LeaguesFilters
        isDark={isDark}
        loading={loading}
        disabled={isReorderMode}
        sports={sports}
        countries={countries}
        value={{
          searchQuery,
          sportId: sportFilter,
          country: countryFilter,
          status: statusFilter,
          featured: featuredFilter,
        }}
        onChange={handleFiltersChange}
        onReset={handleResetFilters}
        onRefresh={fetchLeagues}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                {activeCount}
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
            <Star className="text-yellow-500" size={24} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t(language, 'admin.common.featured')}</p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {featuredCount}
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
                {matchesCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      
      {isReorderMode && (
        <div
          className={`p-4 rounded-xl border ${
            isDark
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              : 'bg-blue-50 border-blue-200 text-blue-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <GripVertical size={20} />
            <span className="font-medium">
              Reorder Mode: Drag and drop leagues to change their display order
            </span>
          </div>
        </div>
      )}

      
      {loading ? (
        <AdminLoading text="Loading leagues..." />
      ) : displayLeagues.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-slate-300'}`} />
          <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t(language, 'admin.leagues.noLeagues')}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium"
          >
            Create first league
          </button>
        </div>
      ) : (
        <>
          
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
	            {!isReorderMode && selectedLeagueIds.size > 0 && (
	              <div
	                className={`px-6 py-3 border-b flex items-center justify-between ${
	                  isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'
	                }`}
	              >
	                <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>
	                  Selected {selectedLeagueIds.size}
	                </span>
	                <div className="flex items-center gap-2">
	                  <button
	                    onClick={() => void bulkSetActive(true)}
	                    disabled={bulkActionLoading !== null}
	                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60 ${
	                      isDark
	                        ? 'bg-slate-700 border-slate-600 text-white hover:border-emerald-500 hover:bg-emerald-500/10'
	                        : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-500 hover:bg-emerald-50'
	                    }`}
	                  >
	                    {bulkActionLoading === 'activate' ? (
	                      <Loader2 size={16} className="animate-spin" />
	                    ) : (
	                      <CheckCircle size={16} />
	                    )}
	                    Active
	                  </button>
	                  <button
	                    onClick={() => void bulkSetActive(false)}
	                    disabled={bulkActionLoading !== null}
	                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60 ${
	                      isDark
	                        ? 'bg-slate-700 border-slate-600 text-white hover:border-orange-500 hover:bg-orange-500/10'
	                        : 'bg-white border-slate-200 text-slate-800 hover:border-orange-500 hover:bg-orange-50'
	                    }`}
	                  >
	                    {bulkActionLoading === 'deactivate' ? (
	                      <Loader2 size={16} className="animate-spin" />
	                    ) : (
	                      <XCircle size={16} />
	                    )}
	                    Inactive
	                  </button>
	                  <button
	                    onClick={() => void bulkDeleteSelected()}
	                    disabled={bulkActionLoading !== null}
	                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60 ${
	                      isDark
	                        ? 'bg-slate-700 border-slate-600 text-white hover:border-red-500 hover:bg-red-500/10'
	                        : 'bg-white border-slate-200 text-slate-800 hover:border-red-500 hover:bg-red-50'
	                    }`}
	                  >
	                    {bulkActionLoading === 'delete' ? (
	                      <Loader2 size={16} className="animate-spin" />
	                    ) : (
	                      <Trash2 size={16} />
	                    )}
	                    Delete
	                  </button>
	                  <button
	                    onClick={() => setSelectedLeagueIds(new Set())}
	                    disabled={bulkActionLoading !== null}
	                    className={`text-sm font-medium underline underline-offset-4 disabled:opacity-60 ${
	                      isDark
	                        ? 'text-cyan-300 hover:text-cyan-200'
	                        : 'text-cyan-700 hover:text-cyan-600'
	                    }`}
	                  >
	                    Clear
	                  </button>
	                </div>
	              </div>
	            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr
                    className={`text-left ${
                      isDark ? 'bg-slate-700/50 text-gray-400' : 'bg-slate-50 text-slate-500'
                    }`}
                  >
                    {isReorderMode && <th className="px-4 py-3 w-12"></th>}
                    {!isReorderMode && (
                      <th className="px-4 py-3 w-12">
                        <input
                          ref={selectAllCheckboxRef}
                          type="checkbox"
                          aria-label="Select all leagues on this page"
                          checked={allVisibleSelected}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedLeagueIds((prev) => {
                              const next = new Set(prev);
                              for (const id of selectableLeagueIds) {
                                if (checked) next.add(id);
                                else next.delete(id);
                              }
                              return next;
                            });
                          }}
                          className={`h-4 w-4 rounded border ${
                            isDark
                              ? 'border-slate-500 bg-slate-800 accent-emerald-500'
                              : 'border-slate-300 bg-white accent-emerald-600'
                          }`}
                        />
                      </th>
                    )}
                    <th className="px-4 py-3 font-medium">{t(language, 'admin.common.order')}</th>
                    <th className="px-4 py-3 font-medium">{t(language, 'admin.common.name')}</th>
                    <th className="px-4 py-3 font-medium">{t(language, 'admin.common.sport')}</th>
                    <th className="px-4 py-3 font-medium">{t(language, 'admin.common.country')}</th>
                    <th className="px-4 py-3 font-medium">{t(language, 'admin.common.season')}</th>
                    <th className="px-4 py-3 font-medium">{t(language, 'admin.nav.matches')}</th>
                    <th className="px-4 py-3 font-medium">{t(language, 'admin.common.status')}</th>
                    <th className="px-4 py-3 font-medium">{t(language, 'admin.common.featured')}</th>
                    <th className="px-4 py-3 font-medium">{t(language, 'admin.common.updatedAt')}</th>
                    <th className="px-4 py-3 font-medium text-right">{t(language, 'admin.common.actions')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
	                  {displayLeagues.map((league, index) => (
	                    <tr
	                      key={league.id}
	                      draggable={isReorderMode}
	                      onDragStart={(e) => handleDragStart(e, league.id, index)}
	                      onDragEnd={handleDragEnd}
	                      onDragOver={(e) => handleDragOver(e, index)}
	                      onDrop={(e) => handleDrop(e, index)}
	                      className={`transition-all ${
	                        isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
	                      } ${isReorderMode ? 'cursor-move' : ''} ${
	                        !isReorderMode && selectedLeagueIds.has(league.id)
	                          ? isDark
	                            ? 'bg-emerald-500/10'
	                            : 'bg-emerald-50'
	                          : ''
	                      } ${
	                        dragOverIndex === index
	                          ? isDark
	                            ? 'bg-blue-500/20 border-t-2 border-blue-500'
	                            : 'bg-blue-50 border-t-2 border-blue-500'
	                          : ''
	                      }`}
	                    >
                      {isReorderMode && (
                        <td className="px-4 py-3">
                          <GripVertical
                            className={isDark ? 'text-gray-500' : 'text-slate-400'}
                            size={20}
                          />
                        </td>
                      )}
                      {!isReorderMode && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            aria-label={`Select league ${league.name}`}
                            checked={selectedLeagueIds.has(league.id)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectedLeagueIds((prev) => {
                                const next = new Set(prev);
                                if (checked) next.add(league.id);
                                else next.delete(league.id);
                                return next;
                              });
                            }}
                            className={`h-4 w-4 rounded border ${
                              isDark
                                ? 'border-slate-500 bg-slate-800 accent-emerald-500'
                                : 'border-slate-300 bg-white accent-emerald-600'
                            }`}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        {isReorderMode ? (
                          <span
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                              isDark
                                ? 'bg-slate-700 text-slate-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {index + 1}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={sortOrderDrafts[league.id] ?? league.sortOrder}
                              onFocus={() => setOrderEditingId(league.id)}
                              onBlur={() => {
                                setOrderEditingId(null);
                                void saveSortOrder(league);
                              }}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setSortOrderDrafts((prev) => ({ ...prev, [league.id]: value }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  (e.currentTarget as HTMLInputElement).blur();
                                }
                              }}
                              disabled={!!sortOrderSaving[league.id]}
                              className={`w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-60 ${
                                isDark
                                  ? 'bg-slate-700 border-slate-600 text-white'
                                  : 'bg-white border-slate-200 text-slate-800'
                              }`}
                            />
                            {sortOrderSaving[league.id] && (
                              <Loader2
                                size={16}
                                className={isDark ? 'animate-spin text-gray-400' : 'animate-spin text-slate-500'}
                              />
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {league.logoUrl ? (
                            <img
                              src={league.logoUrl}
                              alt={league.name}
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
                              <Trophy className="text-white" size={20} />
                            </div>
                          )}
                          <div>
                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                              {league.name}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                              {league.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            isDark
                              ? 'bg-slate-700 text-slate-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {league.sport?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {league.countryCode && (
                            <img
                              src={`https://flagcdn.com/16x12/${league.countryCode.toLowerCase()}.png`}
                              alt={league.country}
                              className="w-4 h-3 object-cover"
                            />
                          )}
                          <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>
                            {league.country || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>
                          {league.season || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            isDark
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-purple-100 text-purple-600'
                          }`}
                        >
                          {league._count?.matches || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(league.id)}
                          disabled={isReorderMode || !!activeSaving[league.id]}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            league.isActive
                              ? isDark
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-emerald-100 text-emerald-600'
                              : isDark
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-red-100 text-red-600'
                          } ${
                            isReorderMode || activeSaving[league.id]
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:opacity-80'
                          }`}
                        >
                          {activeSaving[league.id] ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : league.isActive ? (
                            <CheckCircle size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          {league.isActive ? t(language, 'admin.common.active') : t(language, 'admin.common.inactive')}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleFeatured(league.id)}
                          disabled={isReorderMode || !!featuredSaving[league.id]}
                          className={`p-1.5 rounded-lg transition-colors ${
                            league.isFeatured
                              ? 'bg-yellow-500/20 text-yellow-500'
                              : isDark
                              ? 'bg-slate-700 text-gray-500 hover:text-yellow-500'
                              : 'bg-slate-100 text-slate-400 hover:text-yellow-500'
                          } ${
                            isReorderMode || featuredSaving[league.id]
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                        >
                          {featuredSaving[league.id] ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : league.isFeatured ? (
                            <Star size={18} />
                          ) : (
                            <StarOff size={18} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                          {new Date(league.updatedAt).toLocaleString('en-CA', {
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
                              setSelectedLeague(league);
                              setShowDetailModal(true);
                            }}
                            disabled={isReorderMode}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark
                                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            } ${isReorderMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openEditModal(league)}
                            disabled={isReorderMode}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark
                                ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                                : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                            } ${isReorderMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(league.id)}
                            disabled={isReorderMode}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            } ${isReorderMode ? 'opacity-50 cursor-not-allowed' : ''}`}
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

          
          {totalPages > 1 && !isReorderMode && (
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

      
      {showDetailModal && selectedLeague && (
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
                {t(language, 'admin.leagues.leagueDetails')}
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
              <div className="flex items-center gap-4">
                {selectedLeague.logoUrl ? (
                  <img
                    src={selectedLeague.logoUrl}
                    alt={selectedLeague.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <Trophy className="text-white" size={32} />
                  </div>
                )}
                <div>
                  <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {selectedLeague.name}
                  </h4>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    {selectedLeague.slug}
                  </p>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl space-y-3 ${
                  isDark ? 'bg-slate-700/50' : 'bg-slate-50'
                }`}
              >
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t(language, 'admin.common.sport')}</span>
                  <span className={isDark ? 'text-white' : 'text-slate-800'}>
                    {selectedLeague.sport?.name || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t(language, 'admin.common.country')}</span>
                  <span className={isDark ? 'text-white' : 'text-slate-800'}>
                    {selectedLeague.country || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t(language, 'admin.common.season')}</span>
                  <span className={isDark ? 'text-white' : 'text-slate-800'}>
                    {selectedLeague.season || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t(language, 'admin.leagues.sortOrder')}</span>
                  <span className={isDark ? 'text-white' : 'text-slate-800'}>
                    {selectedLeague.sortOrder}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t(language, 'admin.leagues.totalMatches')}</span>
                  <span className="text-emerald-500 font-bold">
                    {selectedLeague._count?.matches || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t(language, 'admin.common.status')}</span>
                  <span
                    className={
                      selectedLeague.isActive ? 'text-emerald-500' : 'text-red-500'
                    }
                  >
                    {selectedLeague.isActive ? t(language, 'admin.common.active') : t(language, 'admin.common.inactive')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t(language, 'admin.common.featured')}</span>
                  <span
                    className={
                      selectedLeague.isFeatured ? 'text-yellow-500' : isDark ? 'text-gray-400' : 'text-slate-400'
                    }
                  >
                    {selectedLeague.isFeatured ? t(language, 'admin.common.yes') : t(language, 'admin.common.no')}
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

      
      {showEditModal && selectedLeague && (
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
                {t(language, 'admin.leagues.editLeague')}
              </h3>
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
                  <option value="">{t(language, 'admin.leagues.selectSport')}</option>
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
                    Country
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    {t(language, 'admin.common.season')}
                  </label>
                  <input
                    type="text"
                    value={editForm.season}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, season: e.target.value }))}
                    placeholder="e.g., 2024-2025"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500'
                        : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    {t(language, 'admin.leagues.sortOrder')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.sortOrder}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>{t(language, 'admin.common.active')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isFeatured}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, isFeatured: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>{t(language, 'admin.common.featured')}</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={actionLoading}
                className={`flex-1 py-3 rounded-xl transition-colors disabled:opacity-50 ${
                  isDark
                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                {t(language, 'admin.common.cancel')}
              </button>
              <button
                onClick={handleUpdate}
                disabled={actionLoading}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading && <Loader2 size={18} className="animate-spin" />}
                {t(language, 'admin.common.save')}
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
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {t(language, 'admin.leagues.createLeague')}
              </h3>
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
                  <option value="">{t(language, 'admin.leagues.selectSport')}</option>
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
                  placeholder="e.g., Premier League"
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
                  placeholder="e.g., premier-league"
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
                    Country
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
                      setCreateForm((prev) => ({
                        ...prev,
                        countryCode: e.target.value.toUpperCase(),
                      }))
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    {t(language, 'admin.common.season')}
                  </label>
                  <input
                    type="text"
                    value={createForm.season}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, season: e.target.value }))}
                    placeholder="e.g., 2024-2025"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500'
                        : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    {t(language, 'admin.leagues.sortOrder')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.sortOrder}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.isActive}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>{t(language, 'admin.common.active')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.isFeatured}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, isFeatured: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>{t(language, 'admin.common.featured')}</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={actionLoading}
                className={`flex-1 py-3 rounded-xl transition-colors disabled:opacity-50 ${
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
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading && <Loader2 size={18} className="animate-spin" />}
                {t(language, 'admin.leagues.createLeague')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
