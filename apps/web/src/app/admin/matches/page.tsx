'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Calendar,
  Clock,
  Play,
  CheckCircle,
  XCircle,
  Pause,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { matchesService, leaguesService, teamsService, Match, MatchStatus, League, Team } from '@/services/match.service';
import { AdminLoading } from '@/components/admin/AdminLoading';

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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
      const params: any = {
        page,
        limit: 12,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter as MatchStatus : undefined,
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
  }, [page, searchQuery, statusFilter]);

  const fetchLeaguesAndTeams = async () => {
    try {
      const [leaguesRes, teamsRes] = await Promise.all([
        leaguesService.getAll({ limit: 100 }),
        teamsService.getAll({ limit: 100 }),
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string; icon: React.ElementType }> = {
      scheduled: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Scheduled', icon: Calendar },
      live: { bg: 'bg-red-500/20', text: 'text-red-400', label: '🔴 LIVE', icon: Play },
      finished: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Finished', icon: CheckCircle },
      cancelled: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Cancelled', icon: XCircle },
      postponed: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Postponed', icon: Pause },
    };
    const c = config[status] || { bg: 'bg-gray-500/20', text: 'text-gray-400', label: status, icon: Calendar };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text} border border-current/30 flex items-center gap-1 ${status === 'live' ? 'animate-pulse' : ''}`}>
        {c.label}
      </span>
    );
  };

  const toggleBetting = async (matchId: string) => {
    try {
      await matchesService.toggleBetting(matchId);
      toast.success('Betting status updated');
      fetchMatches();
    } catch (error) {
      toast.error('Failed to update betting status');
    }
  };

  const handleDelete = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return;
    try {
      await matchesService.delete(matchId);
      toast.success('Match deleted successfully');
      fetchMatches();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete match');
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create match');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedMatch) return;
    try {
      setActionLoading(true);
      const updateData: any = {};
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update match');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-GB'),
      time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Match Management</h2>
          <p className="text-gray-400 text-sm mt-1">Total {total} matches</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search matches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-[#1e2a3a] border border-[#2a3a4a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88] transition-colors w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#1e2a3a] border border-[#2a3a4a] rounded-xl text-white focus:outline-none focus:border-[#00ff88] transition-colors"
          >
            <option value="all">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="finished">Finished</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button 
            onClick={() => fetchMatches()}
            disabled={loading}
            className="p-2.5 bg-[#1e2a3a] border border-[#2a3a4a] rounded-xl text-gray-400 hover:text-white hover:border-[#00ff88] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-[#1a2535] font-semibold rounded-xl hover:shadow-lg hover:shadow-[#00ff88]/20 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Add match
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-4 rounded-xl border border-blue-500/30">
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-400" size={24} />
            <div>
              <p className="text-gray-400 text-sm">Scheduled</p>
              <p className="text-white font-bold text-xl">
                {matches.filter(m => m.status === 'scheduled').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 p-4 rounded-xl border border-red-500/30">
          <div className="flex items-center gap-3">
            <Play className="text-red-400" size={24} />
            <div>
              <p className="text-gray-400 text-sm">Live</p>
              <p className="text-white font-bold text-xl">
                {matches.filter(m => m.status === 'live').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-500/20 to-gray-600/10 p-4 rounded-xl border border-gray-500/30">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-gray-400" size={24} />
            <div>
              <p className="text-gray-400 text-sm">Finished</p>
              <p className="text-white font-bold text-xl">
                {matches.filter(m => m.status === 'finished').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#00ff88]/20 to-[#00cc6a]/10 p-4 rounded-xl border border-[#00ff88]/30">
          <div className="flex items-center gap-3">
            <Trophy className="text-[#00ff88]" size={24} />
            <div>
              <p className="text-gray-400 text-sm">Total bets</p>
              <p className="text-white font-bold text-xl">
                {matches.reduce((sum, m) => sum + (m._count?.betSelections || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <AdminLoading text="Loading matches..." />
      ) : matches.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No matches found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-[#00ff88] text-[#1a2535] rounded-xl font-medium"
          >
            Create first match
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => {
              const { date, time } = formatDateTime(match.startTime);
              return (
                <div 
                  key={match.id} 
                  className={`bg-gradient-to-br from-[#1e2a3a] to-[#1a2535] p-6 rounded-2xl border transition-all duration-300 group ${
                    match.status === 'live' ? 'border-red-500/50 shadow-lg shadow-red-500/10' : 'border-[#2a3a4a] hover:border-[#00ff88]/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-gray-400 bg-[#2a3a4a] px-2 py-1 rounded">{match.league?.name || 'Unknown League'}</span>
                    {getStatusBadge(match.status)}
                  </div>
                  
                  <div className="space-y-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                        {match.homeTeam?.shortName || match.homeTeam?.name?.charAt(0) || 'H'}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{match.homeTeam?.name || 'Home Team'}</p>
                        <p className="text-gray-400 text-xs">Home</p>
                      </div>
                      {(match.status === 'live' || match.status === 'finished') && (
                        <span className="text-2xl font-bold text-white">{match.homeScore ?? 0}</span>
                      )}
                    </div>
                    <div className="text-center text-gray-500 text-sm">VS</div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {match.awayTeam?.shortName || match.awayTeam?.name?.charAt(0) || 'A'}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{match.awayTeam?.name || 'Away Team'}</p>
                        <p className="text-gray-400 text-xs">Away</p>
                      </div>
                      {(match.status === 'live' || match.status === 'finished') && (
                        <span className="text-2xl font-bold text-white">{match.awayScore ?? 0}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar size={14} />
                      <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock size={14} />
                      <span>{time}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#1a2535] rounded-xl mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Total bets:</span>
                      <span className="text-[#00ff88] font-semibold">{match._count?.betSelections || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400 text-sm">Betting enabled</span>
                    <button 
                      onClick={() => toggleBetting(match.id)}
                      disabled={match.status === 'finished' || match.status === 'cancelled'}
                      className={`w-12 h-6 rounded-full relative transition-colors disabled:opacity-50 ${match.bettingEnabled ? 'bg-[#00ff88]' : 'bg-[#2a3a4a]'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${match.bettingEnabled ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setSelectedMatch(match);
                        setShowDetailModal(true);
                      }}
                      className="flex-1 py-2.5 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      View
                    </button>
                    <button 
                      onClick={() => openEditModal(match)}
                      className="flex-1 py-2.5 bg-orange-500/20 text-orange-400 rounded-xl hover:bg-orange-500/30 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(match.id)}
                      className="py-2.5 px-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-[#1e2a3a] border border-[#2a3a4a] rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-gray-400 px-4">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 bg-[#1e2a3a] border border-[#2a3a4a] rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
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
            <div className="bg-gradient-to-br from-[#1e2a3a] to-[#1a2535] rounded-2xl border border-[#2a3a4a] p-6 w-full max-w-lg mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Match details</h3>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 rounded-lg bg-[#2a3a4a] text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="text-center p-4 bg-[#1a2535] rounded-xl">
                  <p className="text-gray-400 text-sm mb-2">{selectedMatch.league?.name}</p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-2">
                        {selectedMatch.homeTeam?.shortName || selectedMatch.homeTeam?.name?.charAt(0)}
                      </div>
                      <p className="text-white font-medium">{selectedMatch.homeTeam?.name}</p>
                    </div>
                    <div className="text-center">
                      {(selectedMatch.status === 'live' || selectedMatch.status === 'finished') ? (
                        <p className="text-3xl font-bold text-white">
                          {selectedMatch.homeScore ?? 0} - {selectedMatch.awayScore ?? 0}
                        </p>
                      ) : (
                        <p className="text-gray-400">VS</p>
                      )}
                      <p className="text-gray-400 text-sm mt-1">{time}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-2">
                        {selectedMatch.awayTeam?.shortName || selectedMatch.awayTeam?.name?.charAt(0)}
                      </div>
                      <p className="text-white font-medium">{selectedMatch.awayTeam?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#1a2535] rounded-xl space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    {getStatusBadge(selectedMatch.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date</span>
                    <span className="text-white">{date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time</span>
                    <span className="text-white">{time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total bets</span>
                    <span className="text-[#00ff88] font-bold">{selectedMatch._count?.betSelections || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Betting enabled</span>
                    <span className={selectedMatch.bettingEnabled ? 'text-emerald-400' : 'text-red-400'}>
                      {selectedMatch.bettingEnabled ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowDetailModal(false)}
                className="w-full mt-6 py-3 bg-[#2a3a4a] text-white rounded-xl hover:bg-[#3a4a5a] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        );
      })()}

      {showEditModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-[#1e2a3a] to-[#1a2535] rounded-2xl border border-[#2a3a4a] p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Edit match</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-lg bg-[#2a3a4a] text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Status</label>
                <select 
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as MatchStatus }))}
                  className="w-full px-4 py-3 bg-[#1a2535] border border-[#2a3a4a] rounded-xl text-white focus:outline-none focus:border-[#00ff88]"
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
                    <label className="text-gray-400 text-sm mb-2 block">Home score</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.homeScore}
                      onChange={(e) => setEditForm(prev => ({ ...prev, homeScore: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-[#1a2535] border border-[#2a3a4a] rounded-xl text-white focus:outline-none focus:border-[#00ff88]"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Away score</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.awayScore}
                      onChange={(e) => setEditForm(prev => ({ ...prev, awayScore: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-[#1a2535] border border-[#2a3a4a] rounded-xl text-white focus:outline-none focus:border-[#00ff88]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Start Time</label>
                <input
                  type="datetime-local"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#1a2535] border border-[#2a3a4a] rounded-xl text-white focus:outline-none focus:border-[#00ff88]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowEditModal(false)}
                disabled={actionLoading}
                className="flex-1 py-3 bg-[#2a3a4a] text-white rounded-xl hover:bg-[#3a4a5a] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate}
                disabled={actionLoading}
                className="flex-1 py-3 bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-[#1a2535] font-semibold rounded-xl hover:shadow-lg hover:shadow-[#00ff88]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading && <Loader2 size={18} className="animate-spin" />}
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-[#1e2a3a] to-[#1a2535] rounded-2xl border border-[#2a3a4a] p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Create new match</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg bg-[#2a3a4a] text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">League *</label>
                <select 
                  value={createForm.leagueId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, leagueId: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#1a2535] border border-[#2a3a4a] rounded-xl text-white focus:outline-none focus:border-[#00ff88]"
                >
                  <option value="">Select league</option>
                  {leagues.map(league => (
                    <option key={league.id} value={league.id}>{league.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Home Team *</label>
                <select 
                  value={createForm.homeTeamId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, homeTeamId: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#1a2535] border border-[#2a3a4a] rounded-xl text-white focus:outline-none focus:border-[#00ff88]"
                >
                  <option value="">Select home team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Away Team *</label>
                <select 
                  value={createForm.awayTeamId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, awayTeamId: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#1a2535] border border-[#2a3a4a] rounded-xl text-white focus:outline-none focus:border-[#00ff88]"
                >
                  <option value="">Select away team</option>
                  {teams.filter(t => t.id !== createForm.homeTeamId).map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Start Time *</label>
                <input
                  type="datetime-local"
                  value={createForm.startTime}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#1a2535] border border-[#2a3a4a] rounded-xl text-white focus:outline-none focus:border-[#00ff88]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowCreateModal(false)}
                disabled={actionLoading}
                className="flex-1 py-3 bg-[#2a3a4a] text-white rounded-xl hover:bg-[#3a4a5a] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreate}
                disabled={actionLoading}
                className="flex-1 py-3 bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-[#1a2535] font-semibold rounded-xl hover:shadow-lg hover:shadow-[#00ff88]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading && <Loader2 size={18} className="animate-spin" />}
                Create match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
