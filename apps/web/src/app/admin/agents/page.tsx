'use client';

import { useState, useEffect } from 'react';
import {
  UserCog,
  Search,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  Network,
} from 'lucide-react';
import { adminService, Agent } from '@/services/admin.service';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { useLanguageStore } from '@/stores/language.store';
import { t } from '@/lib/i18n';
import { TableSkeleton } from '@/components/admin/AdminLoading';
import { toast } from 'sonner';

export default function AdminAgentsPage() {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';
  const language = useLanguageStore((s) => s.language);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCommission, setEditCommission] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAgents({
        page,
        limit: 10,
        search: searchQuery || undefined,
      });
      setAgents(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchAgents();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleUpdateCommission = async () => {
    if (!selectedAgent) return;
    const rate = parseFloat(editCommission);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Commission rate must be between 0 and 100');
      return;
    }
    setActionLoading(true);
    try {
      await adminService.updateAgent(selectedAgent.id, { commissionRate: rate });
      toast.success('Commission updated');
      fetchAgents();
      setShowEditModal(false);
    } catch (error) {
      toast.error('Failed to update commission');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getLevelBadge = (level: number) => {
    const darkStyles: Record<number, { bg: string; text: string; label: string }> = {
      1: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: t(language, 'admin.agents.masterAgent') },
      2: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: t(language, 'admin.agents.agent') },
      3: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: t(language, 'admin.agents.subAgent') },
    };
    const lightStyles: Record<number, { bg: string; text: string; label: string }> = {
      1: { bg: 'bg-purple-100', text: 'text-purple-700', label: t(language, 'admin.agents.masterAgent') },
      2: { bg: 'bg-blue-100', text: 'text-blue-700', label: t(language, 'admin.agents.agent') },
      3: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: t(language, 'admin.agents.subAgent') },
    };
    const styles = isDark ? darkStyles : lightStyles;
    const style = styles[level] || (isDark ? { bg: 'bg-slate-700', text: 'text-slate-400', label: `Level ${level}` } : { bg: 'bg-slate-100', text: 'text-slate-500', label: `Level ${level}` });
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const darkStyles: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-400',
      suspended: 'bg-orange-500/20 text-orange-400',
      inactive: 'bg-slate-500/20 text-slate-400',
    };
    const lightStyles: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700',
      suspended: 'bg-orange-100 text-orange-700',
      inactive: 'bg-slate-100 text-slate-500',
    };
    const labels: Record<string, string> = {
      active: t(language, 'admin.common.active'),
      suspended: t(language, 'admin.common.suspended'),
      inactive: t(language, 'admin.common.inactive'),
    };
    const styles = isDark ? darkStyles : lightStyles;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || (isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t(language, 'admin.agents.title')}</h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{total} total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} size={16} />
            <input
              type="text"
              placeholder={t(language, 'admin.common.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
              } border`}
            />
          </div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-white' 
                : 'bg-white border-slate-200 text-slate-900'
            } border`}
          >
            <option value="all">{t(language, 'admin.agents.allLevels')}</option>
            <option value="1">{t(language, 'admin.agents.masterAgent')}</option>
            <option value="2">{t(language, 'admin.agents.agent')}</option>
            <option value="3">{t(language, 'admin.agents.subAgent')}</option>
          </select>
          <button 
            onClick={fetchAgents}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`p-3 rounded-lg flex items-center gap-3 ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
          <Network className="text-purple-500" size={20} />
          <div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.agents.masterAgents')}</p>
            <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {agents.filter(a => a.level === 1).length}
            </p>
          </div>
        </div>
        <div className={`p-3 rounded-lg flex items-center gap-3 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
          <UserCog className="text-blue-500" size={20} />
          <div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.agents.agents')}</p>
            <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {agents.filter(a => a.level === 2).length}
            </p>
          </div>
        </div>
        <div className={`p-3 rounded-lg flex items-center gap-3 ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-50'}`}>
          <Users className="text-cyan-500" size={20} />
          <div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.agents.subAgents')}</p>
            <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {agents.filter(a => a.level === 3).length}
            </p>
          </div>
        </div>
        <div className={`p-3 rounded-lg flex items-center gap-3 ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
          <TrendingUp className="text-emerald-500" size={20} />
          <div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.agents.commission')}</p>
            <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(agents.reduce((sum, a) => sum + (a.totalCommission || 0), 0))}
            </p>
          </div>
        </div>
      </div>

      <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm border border-slate-100'}`}>
        {loading ? (
          <TableSkeleton columns={8} rows={10} />
        ) : agents.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-16 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <UserCog size={40} className="mb-3 opacity-50" />
            <p className="text-sm">{t(language, 'admin.agents.noAgents')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className={isDark ? 'bg-slate-700/50' : 'bg-slate-50'}>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.agents.agent')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.agents.code')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.agents.level')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.agents.commission')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.agents.downline')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.status')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.created')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.common.actions')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                  {agents.map((agent) => (
                    <tr key={agent.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                            {agent.user?.username?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{agent.user?.username || 'N/A'}</p>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{agent.user?.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded font-mono text-xs ${isDark ? 'bg-slate-700 text-emerald-400' : 'bg-slate-100 text-emerald-600'}`}>
                          {agent.agentCode}
                        </span>
                      </td>
                      <td className="px-4 py-3">{getLevelBadge(agent.level)}</td>
                      <td className="px-4 py-3">
                        <span className="text-amber-500 font-semibold text-sm">{agent.commissionRate}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Users size={14} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                          <span className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{agent.downlineCount || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(agent.status)}</td>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(agent.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              setSelectedAgent(agent);
                              setShowDetailModal(true);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-600 text-blue-400' : 'hover:bg-blue-50 text-blue-500'}`}
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedAgent(agent);
                              setEditCommission(agent.commissionRate.toString());
                              setShowEditModal(true);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-600 text-orange-400' : 'hover:bg-orange-50 text-orange-500'}`}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`px-4 py-3 border-t flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of {total}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="px-3 py-1 bg-emerald-500 text-white text-sm font-medium rounded-lg">{page}</span>
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ {totalPages}</span>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showDetailModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`rounded-xl p-5 w-full max-w-md mx-4 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t(language, 'admin.agents.agentDetails')}</h3>
              <button 
                onClick={() => setShowDetailModal(false)}
                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {selectedAgent.user?.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedAgent.user?.username}</p>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedAgent.user?.email}</p>
                  <div className="mt-1">{getLevelBadge(selectedAgent.level)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.agents.agentCode')}</p>
                  <p className="text-emerald-500 font-bold font-mono text-sm">{selectedAgent.agentCode}</p>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.agents.commission')}</p>
                  <p className="text-amber-500 font-bold">{selectedAgent.commissionRate}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.agents.downline')}</p>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedAgent.downlineCount || 0}</p>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.agents.totalEarned')}</p>
                  <p className="text-emerald-500 font-bold text-sm">{formatCurrency(selectedAgent.totalCommission || 0)}</p>
                </div>
              </div>

              <div className={`p-3 rounded-lg space-y-2 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                <div className="flex justify-between text-sm items-center">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t(language, 'admin.common.status')}</span>
                  {getStatusBadge(selectedAgent.status)}
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t(language, 'admin.common.created')}</span>
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>{formatDate(selectedAgent.createdAt)}</span>
                </div>
                {selectedAgent.parent && (
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t(language, 'admin.agents.upline')}</span>
                    <span className={isDark ? 'text-white' : 'text-slate-900'}>{selectedAgent.parent.user?.username}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => setShowDetailModal(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t(language, 'admin.common.close')}
              </button>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  setEditCommission(selectedAgent.commissionRate.toString());
                  setShowEditModal(true);
                }}
                className="flex-1 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
              >
                {t(language, 'admin.agents.editAgent')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`rounded-xl p-5 w-full max-w-sm mx-4 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t(language, 'admin.agents.editAgent')}</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Update commission for <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedAgent.user?.username}</span>
            </p>
            
            <div className="mb-4">
              <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(language, 'admin.agents.commission')} (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={editCommission}
                onChange={(e) => setEditCommission(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isDark 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                } border`}
              />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setShowEditModal(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t(language, 'admin.common.cancel')}
              </button>
              <button 
                onClick={handleUpdateCommission}
                disabled={actionLoading}
                className="flex-1 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {actionLoading ? `${t(language, 'admin.common.save')}...` : t(language, 'admin.common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
