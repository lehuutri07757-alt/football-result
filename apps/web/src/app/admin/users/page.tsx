'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Eye,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Edit,
  UserPlus,
  Loader2,
  EyeOff,
} from 'lucide-react';
import { adminService, AdminUser } from '@/services/admin.service';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { TableSkeleton } from '@/components/admin/AdminLoading';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const router = useRouter();
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminService.getUsers({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setUsers(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== debouncedSearch) {
        setDebouncedSearch(searchQuery);
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearch]);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      await adminService.updateUserStatus(userId, newStatus);
      toast.success('Status updated');
      fetchUsers();
      setShowStatusModal(false);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.username || !createForm.password) {
      toast.error('Username and password are required');
      return;
    }
    if (createForm.username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    if (createForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setCreateLoading(true);
    try {
      await adminService.createUser({
        username: createForm.username,
        password: createForm.password,
        email: createForm.email || undefined,
        phone: createForm.phone || undefined,
        firstName: createForm.firstName || undefined,
        lastName: createForm.lastName || undefined,
      });
      toast.success(`User "${createForm.username}" created successfully`);
      setShowCreateModal(false);
      setCreateForm({ username: '', password: '', email: '', phone: '', firstName: '', lastName: '' });
      fetchUsers();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create user';
      toast.error(message);
    } finally {
      setCreateLoading(false);
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

  const getStatusBadge = (status: string) => {
    const darkStyles: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-400',
      suspended: 'bg-orange-500/20 text-orange-400',
      blocked: 'bg-red-500/20 text-red-400',
      self_excluded: 'bg-purple-500/20 text-purple-400',
    };
    const lightStyles: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700',
      suspended: 'bg-orange-100 text-orange-700',
      blocked: 'bg-red-100 text-red-700',
      self_excluded: 'bg-purple-100 text-purple-700',
    };
    const labels: Record<string, string> = {
      active: 'Active',
      suspended: 'Suspended',
      blocked: 'Blocked',
      self_excluded: 'Self-excluded',
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
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Users</h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{total} total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} size={16} />
            <input
              type="text"
              placeholder="Search..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-white' 
                : 'bg-white border-slate-200 text-slate-900'
            } border`}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="blocked">Blocked</option>
          </select>
          <button 
            onClick={fetchUsers}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Create User</span>
          </button>
        </div>
      </div>

      <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm border border-slate-100'}`}>
        {loading ? (
          <TableSkeleton columns={7} rows={10} />
        ) : users.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-16 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Users size={40} className="mb-3 opacity-50" />
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDark ? 'bg-slate-700/50' : 'bg-slate-50'}>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>User</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Balance</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Role</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Created</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                  {users.map((user) => (
                    <tr key={user.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <button
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                              className={`text-sm font-medium hover:underline text-left ${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}
                            >
                              {user.username}
                            </button>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {user.firstName} {user.lastName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{user.email || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="text-emerald-500 font-medium text-sm">
                          {formatCurrency(user.wallet?.realBalance || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                          {user.role?.name || 'User'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-600 text-emerald-400' : 'hover:bg-emerald-50 text-emerald-500'}`}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDetailModal(true);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-600 text-blue-400' : 'hover:bg-blue-50 text-blue-500'}`}
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowStatusModal(true);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.status === 'active'
                                ? isDark ? 'hover:bg-slate-600 text-amber-400' : 'hover:bg-amber-50 text-amber-500'
                                : isDark ? 'hover:bg-slate-600 text-emerald-400' : 'hover:bg-emerald-50 text-emerald-500'
                            }`}
                            title={user.status === 'active' ? 'Suspend' : 'Activate'}
                          >
                            {user.status === 'active' ? <Lock size={16} /> : <Unlock size={16} />}
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
                <span className="px-3 py-1 bg-emerald-500 text-white text-sm font-medium rounded-lg">
                  {page}
                </span>
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

      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`rounded-xl p-5 w-full max-w-md mx-4 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>User Details</h3>
              <button 
                onClick={() => setShowDetailModal(false)}
                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedUser.username}</p>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedUser.email || 'No email'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Real balance</p>
                  <p className="text-emerald-500 font-bold">
                    {formatCurrency(selectedUser.wallet?.realBalance || 0)}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bonus balance</p>
                  <p className="text-amber-500 font-bold">
                    {formatCurrency(selectedUser.wallet?.bonusBalance || 0)}
                  </p>
                </div>
              </div>

              <div className={`p-3 rounded-lg space-y-2 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Role</span>
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>{selectedUser.role?.name || 'User'}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Status</span>
                  {getStatusBadge(selectedUser.status)}
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Created</span>
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>{formatDate(selectedUser.createdAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Last login</span>
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>
                    {selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => setShowDetailModal(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  setShowStatusModal(true);
                }}
                className="flex-1 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Change Status
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`rounded-xl p-5 w-full max-w-md mx-4 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Create New User</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Username *</label>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={(e) => setCreateForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="username"
                  className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  } border`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Password *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={createForm.password}
                    onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="min 6 characters"
                    className={`w-full px-3 py-2 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    } border`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>First Name</label>
                  <input
                    type="text"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="John"
                    className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    } border`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Last Name</label>
                  <input
                    type="text"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="Doe"
                    className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    } border`}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="user@example.com"
                  className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  } border`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Phone</label>
                <input
                  type="text"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="0901234567"
                  className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  } border`}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowCreateModal(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={createLoading}
                className="flex-1 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createLoading ? (
                  <><Loader2 size={16} className="animate-spin" /> Creating...</>
                ) : (
                  <><UserPlus size={16} /> Create User</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`rounded-xl p-5 w-full max-w-sm mx-4 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Change Status</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Select status for <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedUser.username}</span>
            </p>
            
            <div className="space-y-2">
              {['active', 'suspended', 'blocked'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(selectedUser.id, status)}
                  disabled={actionLoading || selectedUser.status === status}
                  className={`w-full p-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                    selectedUser.status === status
                      ? 'bg-emerald-500/10 border-emerald-500 border-2'
                      : isDark 
                        ? 'border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-700'
                        : 'border border-slate-200 hover:border-emerald-500/50 hover:bg-slate-50'
                  } disabled:opacity-50`}
                >
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>
                    {status === 'active' ? 'Active' : status === 'suspended' ? 'Suspended' : 'Blocked'}
                  </span>
                  {selectedUser.status === status && (
                    <span className="text-emerald-500 text-xs">Current</span>
                  )}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowStatusModal(false)}
              className={`w-full mt-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
