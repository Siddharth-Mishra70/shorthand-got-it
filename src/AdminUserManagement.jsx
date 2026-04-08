import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, RefreshCw, CheckCircle2, Clock, XCircle,
  ChevronDown, Loader2, AlertCircle, UserCheck, ShieldAlert,
  SlidersHorizontal, CalendarDays, Mail
} from 'lucide-react';
import { supabase } from './supabaseClient';

// ─── Status badge config ───────────────────────────────────────────────────
const STATUS_CONFIG = {
  active:   { label: 'Active',   dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200',  icon: CheckCircle2 },
  pending:  { label: 'Pending',  dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200',  icon: Clock        },
  inactive: { label: 'Blocked',  dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200',        icon: XCircle      },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── Status Dropdown for each row ─────────────────────────────────────────
const StatusDropdown = ({ userId, currentStatus, onUpdate, isUpdating }) => {
  const [open, setOpen] = useState(false);
  const statuses = ['active', 'pending', 'inactive'];

  const handleSelect = (s) => {
    if (s === currentStatus) { setOpen(false); return; }
    setOpen(false);
    onUpdate(userId, s);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isUpdating}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-[#1e3a8a] rounded-xl text-xs font-black text-gray-600 hover:text-[#1e3a8a] transition-all shadow-sm disabled:opacity-50"
      >
        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <SlidersHorizontal className="w-3 h-3" />}
        Change
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-gray-200/60 overflow-hidden w-36">
            {statuses.map((s) => {
              const cfg = STATUS_CONFIG[s];
              const Icon = cfg.icon;
              const isCurrent = s === currentStatus;
              return (
                <button
                  key={s}
                  onClick={() => handleSelect(s)}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-black transition-colors text-left ${
                    isCurrent
                      ? 'bg-gray-50 text-gray-400 cursor-default'
                      : 'hover:bg-blue-50 hover:text-[#1e3a8a] text-gray-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                  {isCurrent && <CheckCircle2 className="w-3 h-3 ml-auto text-gray-300" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AdminUserManagement — Student table with status management
// ─────────────────────────────────────────────────────────────────────────────
const AdminUserManagement = () => {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState('');
  const [searchTerm,  setSearchTerm]  = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'pending' | 'inactive'
  const [updatingId,  setUpdatingId]  = useState(null);
  const [toast,       setToast]       = useState(null);

  // ─── Fetch all students ──────────────────────────────────────────────────
  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const { data, error: fetchErr } = await supabase
        .from('users')
        .select('id, first_name, last_name, name, email, phone, status, role, joinedDate, created_at, gender, state, city')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setUsers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch students.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ─── Update user status ──────────────────────────────────────────────────
  const handleStatusUpdate = async (userId, newStatus) => {
    setUpdatingId(userId);
    try {
      const { error: updateErr } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (updateErr) throw updateErr;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );

      const cfg = STATUS_CONFIG[newStatus];
      showToast(`Status updated to ${cfg.label}`, 'success');
    } catch (err) {
      showToast(err.message || 'Update failed.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // ─── Toast helper ────────────────────────────────────────────────────────
  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Filter logic ────────────────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const fullName = u.first_name ? `${u.first_name} ${u.last_name || ''}` : (u.name || '');
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      fullName.toLowerCase().includes(search) ||
      (u.email || '').toLowerCase().includes(search) ||
      (u.phone || '').includes(search);
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ─── Stats ───────────────────────────────────────────────────────────────
  const stats = {
    total:    users.length,
    active:   users.filter((u) => u.status === 'active').length,
    pending:  users.filter((u) => u.status === 'pending').length,
    inactive: users.filter((u) => u.status === 'inactive').length,
  };

  const displayName = (u) =>
    u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : (u.name || 'Unknown');

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try { return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return dateStr; }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm transition-all animate-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#1e3a8a]/10 rounded-2xl border border-[#1e3a8a]/10">
            <Users className="w-6 h-6 text-[#1e3a8a]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 leading-none">Student Management</h2>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">
              OTP Approval Dashboard
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchUsers(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-[#1e3a8a] rounded-xl text-sm font-black text-gray-500 hover:text-[#1e3a8a] transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Stats Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: stats.total,    color: 'text-[#1e3a8a]', bg: 'bg-blue-50',   border: 'border-blue-100', icon: Users       },
          { label: 'Active',         value: stats.active,   color: 'text-green-700', bg: 'bg-green-50',  border: 'border-green-100',icon: UserCheck    },
          { label: 'Pending',        value: stats.pending,  color: 'text-amber-700', bg: 'bg-amber-50',  border: 'border-amber-100',icon: Clock        },
          { label: 'Blocked',        value: stats.inactive, color: 'text-red-700',   bg: 'bg-red-50',    border: 'border-red-100',  icon: ShieldAlert  },
        ].map(({ label, value, color, bg, border, icon: Icon }) => (
          <div key={label} className={`${bg} border ${border} rounded-2xl p-4 flex items-center gap-3`}>
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center border ${border}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className={`text-xl font-black ${color} leading-none`}>{value}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/10 transition-all"
          />
        </div>
        {/* Status filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'active', 'pending', 'inactive'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                statusFilter === s
                  ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-[#1e3a8a] hover:text-[#1e3a8a]'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => fetchUsers()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/80 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                {['Student', 'Email', 'Phone', 'State / City', 'Registered', 'Status', 'Actions'].map((col) => (
                  <th key={col} className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin" />
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Students...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-200" />
                      </div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        {searchTerm || statusFilter !== 'all' ? 'No matching students found.' : 'No students registered yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.map((u) => (
                <tr key={u.id} className="group hover:bg-blue-50/20 transition-all duration-200">
                  {/* Student Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-blue-500 flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0 group-hover:shadow-md transition-shadow">
                        {displayName(u).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-none group-hover:text-[#1e3a8a] transition-colors">
                          {displayName(u)}
                        </p>
                        {u.gender && (
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{u.gender}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      <span className="text-sm text-gray-600 font-medium">{u.email || '—'}</span>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 font-medium">{u.phone || '—'}</span>
                  </td>

                  {/* State / City */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 font-medium">
                      {u.state && u.city ? `${u.city}, ${u.state}` : (u.state || u.city || '—')}
                    </span>
                  </td>

                  {/* Registration Date */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      <span className="text-sm text-gray-500 font-medium">
                        {u.joinedDate || formatDate(u.created_at)}
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4">
                    <StatusBadge status={u.status || 'pending'} />
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <StatusDropdown
                      userId={u.id}
                      currentStatus={u.status || 'pending'}
                      onUpdate={handleStatusUpdate}
                      isUpdating={updatingId === u.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && filteredUsers.length > 0 && (
          <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Showing {filteredUsers.length} of {users.length} students
            </p>
            {stats.pending > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-black text-amber-700">
                  {stats.pending} student{stats.pending !== 1 ? 's' : ''} awaiting approval
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserManagement;
