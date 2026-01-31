'use client';

import { useEffect, useState } from 'react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { adminService, ApiFootballSyncConfig } from '@/services/admin.service';
import { AdminLoading } from '@/components/admin/AdminLoading';
import { 
  RotateCw, 
  Save, 
  History, 
  Calendar, 
  Clock, 
  Activity, 
  Zap,
  Globe,
  Shield,
  AlertTriangle,
  RefreshCw,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export default function SyncSettingsPage() {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [config, setConfig] = useState<ApiFootballSyncConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<ApiFootballSyncConfig | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'fixtures' | 'live' | 'upcoming' | 'general'>('fixtures');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSyncConfig();
      setConfig(data);
      setOriginalConfig(JSON.parse(JSON.stringify(data)));
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to load sync configuration');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    
    try {
      setSaving(true);
      const updated = await adminService.updateSyncConfig(config);
      setConfig(updated);
      setOriginalConfig(JSON.parse(JSON.stringify(updated)));
      setHasChanges(false);
      toast.success('Configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleReloadSchedulers = async () => {
    if (!confirm('Are you sure you want to reload all schedulers? This will restart all active sync jobs.')) {
      return;
    }

    try {
      setReloading(true);
      const response = await adminService.reloadSchedulers();
      toast.success(response.message);
    } catch (error) {
      toast.error('Failed to reload schedulers');
      console.error(error);
    } finally {
      setReloading(false);
    }
  };

  const handleReset = () => {
    if (originalConfig) {
      setConfig(JSON.parse(JSON.stringify(originalConfig)));
      setHasChanges(false);
      toast.success('Changes reset to last saved state');
    }
  };

  const updateConfig = (section: keyof ApiFootballSyncConfig, key: string, value: any) => {
    if (!config) return;
    
    const newConfig = { ...config };
    // @ts-ignore
    newConfig[section][key] = value;
    
    setConfig(newConfig);
    setHasChanges(true);
  };

  const calculateDailyRequests = () => {
    if (!config) return 0;

    let total = 0;

    if (config.fixture.enabled) {
      const dailyRuns = (24 * 60) / config.fixture.intervalMinutes;
      total += dailyRuns * 2;
    }

    if (config.liveOdds.enabled) {
      const dailyRuns = (24 * 60) / config.liveOdds.intervalMinutes;
      total += dailyRuns;
    }

    if (config.upcomingOdds.enabled) {
      const dailyRuns = (24 * 60) / config.upcomingOdds.intervalMinutes;
      total += dailyRuns;
    }

    if (config.league.enabled) total += (24 * 60) / config.league.intervalMinutes;
    if (config.team.enabled) total += (24 * 60) / config.team.intervalMinutes;

    return Math.round(total);
  };

  const dailyUsage = calculateDailyRequests();
  const dailyLimit = config?.rateLimit.dailyLimit || 100000;
  const usagePercent = (dailyUsage / dailyLimit) * 100;

  if (loading) return <AdminLoading text="Loading configuration..." />;

  if (!config) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
        Configuration Unavailable
      </h3>
      <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Unable to load sync settings. Please try again later.
      </p>
      <button 
        onClick={loadConfig}
        className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Sync Configuration
          </h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Configure API sync intervals, data fetching rules, and rate limits
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-medium ${
              hasChanges
                ? isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                : 'opacity-50 cursor-not-allowed text-slate-400'
            }`}
          >
            <RotateCw size={18} />
            Reset
          </button>
          <button
            onClick={handleReloadSchedulers}
            disabled={reloading}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-medium ${
              isDark 
                ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20' 
                : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
            }`}
          >
            <RefreshCw size={18} className={reloading ? 'animate-spin' : ''} />
            Reload Schedulers
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-start justify-between mb-3">
            <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
              <Activity size={22} className="text-emerald-500" />
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              usagePercent > 80 
                ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                : usagePercent > 50
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
            }`}>
              {usagePercent > 80 ? 'Critical' : usagePercent > 50 ? 'Warning' : 'Optimized'}
            </span>
          </div>
          <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {dailyUsage.toLocaleString()}
          </h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Est. Daily Requests
          </p>
        </div>

        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-start justify-between mb-3">
            <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
              <Shield size={22} className="text-blue-500" />
            </div>
          </div>
          <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {dailyLimit.toLocaleString()}
          </h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Daily Quota Limit
          </p>
        </div>

        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-start justify-between mb-3">
            <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
              <Zap size={22} className="text-purple-500" />
            </div>
          </div>
          <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {config.rateLimit.delayBetweenRequests}ms
          </h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Request Delay
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'fixtures', label: 'Fixtures', icon: Calendar },
          { id: 'live', label: 'Live Odds', icon: Activity },
          { id: 'upcoming', label: 'Upcoming Odds', icon: Clock },
          { id: 'general', label: 'General & Limits', icon: Globe },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? isDark 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                  : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : isDark 
                  ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
        
        {activeTab === 'fixtures' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Fixture Synchronization</h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Configure how often match fixtures are updated</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.fixture.enabled}
                  onChange={(e) => updateConfig('fixture', 'enabled', e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Sync Interval (Minutes)
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="1440"
                    value={config.fixture.intervalMinutes}
                    onChange={(e) => updateConfig('fixture', 'intervalMinutes', parseInt(e.target.value))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                        : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                    } focus:ring-1 focus:ring-emerald-500 outline-none transition-colors`}
                  />
                  <p className="text-xs text-slate-500 mt-1">How often to sync fixtures (1-1440 minutes)</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Past Days History
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="7"
                    value={config.fixture.pastDays}
                    onChange={(e) => updateConfig('fixture', 'pastDays', parseInt(e.target.value))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                        : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                    } focus:ring-1 focus:ring-emerald-500 outline-none transition-colors`}
                  />
                  <p className="text-xs text-slate-500 mt-1">Number of past days to keep syncing for results</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Future Days
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="14"
                    value={config.fixture.futureDays}
                    onChange={(e) => updateConfig('fixture', 'futureDays', parseInt(e.target.value))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                        : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                    } focus:ring-1 focus:ring-emerald-500 outline-none transition-colors`}
                  />
                  <p className="text-xs text-slate-500 mt-1">Number of days ahead to fetch fixtures</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'live' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Live Odds Synchronization</h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Real-time odds updates for in-play matches</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.liveOdds.enabled}
                  onChange={(e) => updateConfig('liveOdds', 'enabled', e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Sync Interval (Minutes)
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="60"
                    value={config.liveOdds.intervalMinutes}
                    onChange={(e) => updateConfig('liveOdds', 'intervalMinutes', parseInt(e.target.value))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                        : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                    } focus:ring-1 focus:ring-emerald-500 outline-none transition-colors`}
                  />
                  <p className="text-xs text-amber-500 mt-1">Lower intervals consume more API quota (1-60 minutes)</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Max Matches Per Sync
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100"
                    value={config.liveOdds.maxMatchesPerSync}
                    onChange={(e) => updateConfig('liveOdds', 'maxMatchesPerSync', parseInt(e.target.value))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                        : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                    } focus:ring-1 focus:ring-emerald-500 outline-none transition-colors`}
                  />
                  <p className="text-xs text-slate-500 mt-1">Maximum live matches to process per sync</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Upcoming Odds Synchronization</h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pre-match odds updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.upcomingOdds.enabled}
                  onChange={(e) => updateConfig('upcomingOdds', 'enabled', e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Sync Interval (Minutes)
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="1440"
                    value={config.upcomingOdds.intervalMinutes}
                    onChange={(e) => updateConfig('upcomingOdds', 'intervalMinutes', parseInt(e.target.value))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                        : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                    } focus:ring-1 focus:ring-emerald-500 outline-none transition-colors`}
                  />
                  <p className="text-xs text-slate-500 mt-1">How often to sync upcoming odds (1-1440 minutes)</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Hours Ahead
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="72"
                    value={config.upcomingOdds.hoursAhead}
                    onChange={(e) => updateConfig('upcomingOdds', 'hoursAhead', parseInt(e.target.value))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                        : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                    } focus:ring-1 focus:ring-emerald-500 outline-none transition-colors`}
                  />
                  <p className="text-xs text-slate-500 mt-1">Sync odds for matches starting within this timeframe</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Max Matches Per Sync
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="200"
                    value={config.upcomingOdds.maxMatchesPerSync}
                    onChange={(e) => updateConfig('upcomingOdds', 'maxMatchesPerSync', parseInt(e.target.value))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                        : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                    } focus:ring-1 focus:ring-emerald-500 outline-none transition-colors`}
                  />
                  <p className="text-xs text-slate-500 mt-1">Maximum upcoming matches to process per sync</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>League & Team Sync</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Leagues</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={config.league.enabled}
                        onChange={(e) => updateConfig('league', 'enabled', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                  <div>
                    <label className={`block text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Interval (Minutes)</label>
                    <input 
                      type="number" 
                      value={config.league.intervalMinutes}
                      onChange={(e) => updateConfig('league', 'intervalMinutes', parseInt(e.target.value))}
                      className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white' 
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Teams</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={config.team.enabled}
                        onChange={(e) => updateConfig('team', 'enabled', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                  <div>
                    <label className={`block text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Interval (Minutes)</label>
                    <input 
                      type="number" 
                      value={config.team.intervalMinutes}
                      onChange={(e) => updateConfig('team', 'intervalMinutes', parseInt(e.target.value))}
                      className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white' 
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Rate Limits & Safety</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Daily Limit
                  </label>
                  <input 
                    type="number" 
                    value={config.rateLimit.dailyLimit}
                    readOnly
                    className={`w-full px-4 py-2 rounded-lg border opacity-75 cursor-not-allowed ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-slate-400' 
                        : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}
                  />
                  <p className="text-xs text-slate-500 mt-1">Set by API plan</p>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Requests / Minute
                  </label>
                  <input 
                    type="number" 
                    value={config.rateLimit.requestsPerMinute}
                    readOnly
                    className={`w-full px-4 py-2 rounded-lg border opacity-75 cursor-not-allowed ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-slate-400' 
                        : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}
                  />
                  <p className="text-xs text-slate-500 mt-1">Set by API plan</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Delay Between Requests (ms)
                  </label>
                  <input 
                    type="number" 
                    min="100"
                    max="2000"
                    value={config.rateLimit.delayBetweenRequests}
                    onChange={(e) => updateConfig('rateLimit', 'delayBetweenRequests', parseInt(e.target.value))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                        : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                    } focus:ring-1 focus:ring-emerald-500 outline-none transition-colors`}
                  />
                  <p className="text-xs text-slate-500 mt-1">Safety buffer</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {hasChanges && (
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in`}>
          <div className={`flex items-center gap-4 px-6 py-3 rounded-full shadow-2xl border ${
            isDark 
              ? 'bg-slate-900 border-slate-700 text-white' 
              : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <span className="text-sm font-medium">Unsaved changes</span>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
            <button 
              onClick={handleReset}
              className={`text-sm hover:underline ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Discard
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-full hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
