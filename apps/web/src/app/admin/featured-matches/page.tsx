'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Star,
  Trophy,
  Users,
  Swords,
  Settings,
  Loader2,
  Save,
  Zap,
  Eye,
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Search,
  X,
  CheckCircle,
  Clock,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  featuredMatchesService,
  leaguesService,
  teamsService,
  matchesService,
  FeaturedMatchesSettings,
  FeaturedMatchesStats,
  League,
  Team,
  Match,
} from '@/services/match.service';
import { AdminLoading } from '@/components/admin/AdminLoading';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

interface DerbyPair {
  homeTeamId: string;
  awayTeamId: string;
  name?: string;
  homeTeamName?: string;
  awayTeamName?: string;
}

export default function FeaturedMatchesSettingsPage() {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSelecting, setAutoSelecting] = useState(false);

  const [settings, setSettings] = useState<FeaturedMatchesSettings>({
    featuredLeagueIds: [],
    topTeamRankThreshold: 4,
    topTeamIds: [],
    derbyPairs: [],
    maxFeaturedMatches: 10,
    autoSelectEnabled: true,
    includeUpcoming: true,
    includeLive: true,
    upcomingHours: 24,
  });

  const [stats, setStats] = useState<FeaturedMatchesStats | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [featuredMatches, setFeaturedMatches] = useState<Match[]>([]);

  const [expandedSections, setExpandedSections] = useState({
    leagues: true,
    teams: true,
    derby: true,
    general: true,
    preview: true,
  });

  const [leagueSearch, setLeagueSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [newDerby, setNewDerby] = useState<DerbyPair>({
    homeTeamId: '',
    awayTeamId: '',
    name: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [settingsData, statsData, leaguesData, teamsData, matchesData] = await Promise.all([
        featuredMatchesService.getSettings(),
        featuredMatchesService.getStats(),
        featuredMatchesService.getAvailableLeagues(),
        featuredMatchesService.getAvailableTeams(),
        featuredMatchesService.getFeaturedMatches(),
      ]);
      setSettings(settingsData);
      setStats(statsData);
      setLeagues(leaguesData);
      setTeams(teamsData);
      setFeaturedMatches(matchesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await featuredMatchesService.updateSettings(settings);
      toast.success('Settings saved successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoSelect = async () => {
    try {
      setAutoSelecting(true);
      const result = await featuredMatchesService.autoSelect();
      toast.success(`Auto-selected ${result.updated} matches`);
      fetchData();
    } catch (error) {
      console.error('Failed to auto-select:', error);
      toast.error('Failed to auto-select matches');
    } finally {
      setAutoSelecting(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleLeague = (leagueId: string) => {
    setSettings((prev) => ({
      ...prev,
      featuredLeagueIds: prev.featuredLeagueIds.includes(leagueId)
        ? prev.featuredLeagueIds.filter((id) => id !== leagueId)
        : [...prev.featuredLeagueIds, leagueId],
    }));
  };

  const toggleTeam = (teamId: string) => {
    setSettings((prev) => ({
      ...prev,
      topTeamIds: prev.topTeamIds.includes(teamId)
        ? prev.topTeamIds.filter((id) => id !== teamId)
        : [...prev.topTeamIds, teamId],
    }));
  };

  const addDerbyPair = () => {
    if (!newDerby.homeTeamId || !newDerby.awayTeamId) {
      toast.error('Please select both teams');
      return;
    }
    if (newDerby.homeTeamId === newDerby.awayTeamId) {
      toast.error('Teams must be different');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      derbyPairs: [...prev.derbyPairs, { ...newDerby }],
    }));
    setNewDerby({ homeTeamId: '', awayTeamId: '', name: '' });
  };

  const removeDerbyPair = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      derbyPairs: prev.derbyPairs.filter((_, i) => i !== index),
    }));
  };

  const filteredLeagues = leagues.filter(
    (league) =>
      league.name.toLowerCase().includes(leagueSearch.toLowerCase()) ||
      league.country?.toLowerCase().includes(leagueSearch.toLowerCase())
  );

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(teamSearch.toLowerCase())
  );

  const getTeamName = (teamId: string) => {
    return teams.find((t) => t.id === teamId)?.name || teamId;
  };

  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <AdminLoading text="Loading featured matches settings..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Featured Matches Settings
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            Configure criteria for selecting featured matches
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAutoSelect}
            disabled={autoSelecting}
            className={`px-4 py-2.5 border rounded-xl transition-colors flex items-center gap-2 ${
              isDark
                ? 'bg-slate-700 border-slate-600 text-white hover:border-cyan-500 hover:bg-cyan-500/20'
                : 'bg-white border-slate-200 text-slate-800 hover:border-cyan-500 hover:bg-cyan-50'
            }`}
          >
            {autoSelecting ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
            Auto Select
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Settings
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  {stats.totalFeatured}
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
                  {stats.liveCount}
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
              <Clock className="text-blue-500" size={24} />
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Upcoming</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {stats.upcomingCount}
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
              <Trophy className="text-purple-500" size={24} />
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Leagues</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {stats.byLeague.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          <button
            onClick={() => toggleSection('leagues')}
            className={`w-full flex items-center justify-between p-4 ${
              isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Trophy className="text-emerald-500" size={20} />
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Featured Leagues ({settings.featuredLeagueIds.length})
              </span>
            </div>
            {expandedSections.leagues ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {expandedSections.leagues && (
            <div className={`p-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className="relative mb-4">
                <Search
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-gray-500' : 'text-slate-400'
                  }`}
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search leagues..."
                  value={leagueSearch}
                  onChange={(e) => setLeagueSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500'
                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredLeagues.map((league) => (
                  <button
                    key={league.id}
                    onClick={() => toggleLeague(league.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                      settings.featuredLeagueIds.includes(league.id)
                        ? isDark
                          ? 'bg-emerald-500/20 border border-emerald-500/50'
                          : 'bg-emerald-50 border border-emerald-200'
                        : isDark
                        ? 'bg-slate-700/50 hover:bg-slate-700'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {league.logoUrl ? (
                        <img
                          src={league.logoUrl}
                          alt={league.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <div
                          className={`w-8 h-8 rounded flex items-center justify-center ${
                            isDark ? 'bg-slate-600' : 'bg-slate-200'
                          }`}
                        >
                          <Trophy size={16} />
                        </div>
                      )}
                      <div className="text-left">
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          {league.name}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                          {league.country} - {league._count?.matches || 0} matches
                        </p>
                      </div>
                    </div>
                    {settings.featuredLeagueIds.includes(league.id) && (
                      <CheckCircle className="text-emerald-500" size={20} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          <button
            onClick={() => toggleSection('teams')}
            className={`w-full flex items-center justify-between p-4 ${
              isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="text-blue-500" size={20} />
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Top Teams ({settings.topTeamIds.length})
              </span>
            </div>
            {expandedSections.teams ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {expandedSections.teams && (
            <div className={`p-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className="relative mb-4">
                <Search
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-gray-500' : 'text-slate-400'
                  }`}
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500'
                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredTeams.slice(0, 50).map((team) => (
                  <button
                    key={team.id}
                    onClick={() => toggleTeam(team.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                      settings.topTeamIds.includes(team.id)
                        ? isDark
                          ? 'bg-blue-500/20 border border-blue-500/50'
                          : 'bg-blue-50 border border-blue-200'
                        : isDark
                        ? 'bg-slate-700/50 hover:bg-slate-700'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {team.logoUrl ? (
                        <img
                          src={team.logoUrl}
                          alt={team.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <div
                          className={`w-8 h-8 rounded flex items-center justify-center ${
                            isDark ? 'bg-slate-600' : 'bg-slate-200'
                          }`}
                        >
                          <Users size={16} />
                        </div>
                      )}
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {team.name}
                      </p>
                    </div>
                    {settings.topTeamIds.includes(team.id) && (
                      <CheckCircle className="text-blue-500" size={20} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          <button
            onClick={() => toggleSection('derby')}
            className={`w-full flex items-center justify-between p-4 ${
              isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Swords className="text-orange-500" size={20} />
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Derby Matches ({settings.derbyPairs.length})
              </span>
            </div>
            {expandedSections.derby ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {expandedSections.derby && (
            <div className={`p-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  placeholder="Derby name (optional)"
                  value={newDerby.name || ''}
                  onChange={(e) => setNewDerby((prev) => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500'
                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newDerby.homeTeamId}
                    onChange={(e) => setNewDerby((prev) => ({ ...prev, homeTeamId: e.target.value }))}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="">Team 1</option>
                    {teams.slice(0, 100).map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newDerby.awayTeamId}
                    onChange={(e) => setNewDerby((prev) => ({ ...prev, awayTeamId: e.target.value }))}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="">Team 2</option>
                    {teams.slice(0, 100).map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={addDerbyPair}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl transition-colors ${
                    isDark
                      ? 'border-orange-500/50 text-orange-400 hover:bg-orange-500/20'
                      : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  <Plus size={18} />
                  Add Derby Pair
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {settings.derbyPairs.map((pair, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      isDark ? 'bg-slate-700/50' : 'bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {pair.name || `Derby ${index + 1}`}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                        {getTeamName(pair.homeTeamId)} vs {getTeamName(pair.awayTeamId)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeDerbyPair(index)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark
                          ? 'hover:bg-red-500/20 text-red-400'
                          : 'hover:bg-red-50 text-red-600'
                      }`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          <button
            onClick={() => toggleSection('general')}
            className={`w-full flex items-center justify-between p-4 ${
              isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings className="text-gray-500" size={20} />
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                General Settings
              </span>
            </div>
            {expandedSections.general ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {expandedSections.general && (
            <div className={`p-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className="space-y-4">
                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    Max Featured Matches
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.maxFeaturedMatches}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        maxFeaturedMatches: parseInt(e.target.value) || 10,
                      }))
                    }
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    Upcoming Hours Window
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={settings.upcomingHours}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        upcomingHours: parseInt(e.target.value) || 24,
                      }))
                    }
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div className="space-y-3">
                  <label
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer ${
                      isDark ? 'bg-slate-700/50' : 'bg-slate-50'
                    }`}
                  >
                    <span className={isDark ? 'text-white' : 'text-slate-800'}>Auto Select Enabled</span>
                    <input
                      type="checkbox"
                      checked={settings.autoSelectEnabled}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, autoSelectEnabled: e.target.checked }))
                      }
                      className="w-5 h-5 rounded accent-emerald-500"
                    />
                  </label>

                  <label
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer ${
                      isDark ? 'bg-slate-700/50' : 'bg-slate-50'
                    }`}
                  >
                    <span className={isDark ? 'text-white' : 'text-slate-800'}>Include Live Matches</span>
                    <input
                      type="checkbox"
                      checked={settings.includeLive}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, includeLive: e.target.checked }))
                      }
                      className="w-5 h-5 rounded accent-emerald-500"
                    />
                  </label>

                  <label
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer ${
                      isDark ? 'bg-slate-700/50' : 'bg-slate-50'
                    }`}
                  >
                    <span className={isDark ? 'text-white' : 'text-slate-800'}>Include Upcoming Matches</span>
                    <input
                      type="checkbox"
                      checked={settings.includeUpcoming}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, includeUpcoming: e.target.checked }))
                      }
                      className="w-5 h-5 rounded accent-emerald-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}
      >
        <button
          onClick={() => toggleSection('preview')}
          className={`w-full flex items-center justify-between p-4 ${
            isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Eye className="text-purple-500" size={20} />
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Preview Featured Matches ({featuredMatches.length})
            </span>
          </div>
          {expandedSections.preview ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.preview && (
          <div className={`border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
            {featuredMatches.length === 0 ? (
              <div className="p-8 text-center">
                <Star className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-slate-300'}`} />
                <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
                  No featured matches yet. Configure settings and click "Auto Select".
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {featuredMatches.map((match) => (
                  <div
                    key={match.id}
                    className={`flex items-center justify-between p-4 ${
                      isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          match.status === 'live'
                            ? 'bg-red-500/20 text-red-500'
                            : 'bg-blue-500/20 text-blue-500'
                        }`}
                      >
                        {match.status === 'live' ? 'LIVE' : formatMatchTime(match.startTime)}
                      </div>
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          {match.homeTeam?.name} vs {match.awayTeam?.name}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                          {match.league?.name}
                        </p>
                      </div>
                    </div>
                    {match.status === 'live' && (
                      <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {match.homeScore ?? 0} - {match.awayScore ?? 0}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
