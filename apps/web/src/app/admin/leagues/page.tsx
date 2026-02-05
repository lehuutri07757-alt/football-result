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
import { leaguesService, sportsService, League, Sport, apiFootballSyncService } from '@/services/match.service';
import { AdminLoading } from '@/components/admin/AdminLoading';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
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
      const response = await leaguesService.getAll(params);
      setLeagues(response.data);
      setReorderedLeagues(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
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

  const getActiveCount = () => leagues.filter((l) => l.isActive).length;
  const getFeaturedCount = () => leagues.filter((l) => l.isFeatured).length;
  const getMatchesCount = () => leagues.reduce((sum, l) => sum + (l._count?.matches || 0), 0);

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            League Management
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            Total {total} leagues
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
                Cancel
              </button>
              <button
                onClick={handleSaveReorder}
                disabled={actionLoading || !hasReorderChanges}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading && <Loader2 size={18} className="animate-spin" />}
                Save Order
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
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Total</p>
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
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Active</p>
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
            <Star className="text-yellow-500" size={24} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Featured</p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {getFeaturedCount()}
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
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Matches</p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {getMatchesCount()}
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
          <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>No leagues found</p>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className={`text-left ${
                      isDark ? 'bg-slate-700/50 text-gray-400' : 'bg-slate-50 text-slate-500'
                    }`}
                  >
                    {isReorderMode && <th className="px-4 py-3 w-12"></th>}
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">League</th>
                    <th className="px-4 py-3 font-medium">Sport</th>
                    <th className="px-4 py-3 font-medium">Country</th>
                    <th className="px-4 py-3 font-medium">Season</th>
                    <th className="px-4 py-3 font-medium">Matches</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Featured</th>
                    <th className="px-4 py-3 font-medium">Updated At</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
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
                          {league.isActive ? 'Active' : 'Inactive'}
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
                League Details
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
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Sport</span>
                  <span className={isDark ? 'text-white' : 'text-slate-800'}>
                    {selectedLeague.sport?.name || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Country</span>
                  <span className={isDark ? 'text-white' : 'text-slate-800'}>
                    {selectedLeague.country || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Season</span>
                  <span className={isDark ? 'text-white' : 'text-slate-800'}>
                    {selectedLeague.season || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Sort Order</span>
                  <span className={isDark ? 'text-white' : 'text-slate-800'}>
                    {selectedLeague.sortOrder}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Total Matches</span>
                  <span className="text-emerald-500 font-bold">
                    {selectedLeague._count?.matches || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Status</span>
                  <span
                    className={
                      selectedLeague.isActive ? 'text-emerald-500' : 'text-red-500'
                    }
                  >
                    {selectedLeague.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Featured</span>
                  <span
                    className={
                      selectedLeague.isFeatured ? 'text-yellow-500' : isDark ? 'text-gray-400' : 'text-slate-400'
                    }
                  >
                    {selectedLeague.isFeatured ? 'Yes' : 'No'}
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
                Edit League
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
                  Sport *
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
                  Name *
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
                    Season
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
                    Sort Order
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
                  <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>Active</span>
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
                  <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>Featured</span>
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
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Create New League
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
                  Sport *
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
                  Name *
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
                    Season
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
                    Sort Order
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
                  <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>Active</span>
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
                  <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>Featured</span>
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
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={actionLoading}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading && <Loader2 size={18} className="animate-spin" />}
                Create League
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
