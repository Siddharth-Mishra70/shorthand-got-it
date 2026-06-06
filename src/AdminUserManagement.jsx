import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, RefreshCw, CheckCircle2, Clock, XCircle,
  ChevronDown, Loader2, AlertCircle, UserCheck, ShieldAlert,
  SlidersHorizontal, CalendarDays, Mail, Plus, UserPlus
} from 'lucide-react';
import { supabase, adminAuthClient } from './supabaseClient';

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

const getComputedStatus = (u) => {
  if (!u) return 'pending';
  const status = (u.status || 'pending').toLowerCase();
  if (status === 'inactive') return 'inactive';
  
  let expirationDate = null;
  if (u.valid_until) {
    expirationDate = new Date(u.valid_until);
  } else if (u.created_at) {
    const created = new Date(u.created_at);
    created.setDate(created.getDate() + 29);
    expirationDate = created;
  }
  
  if (expirationDate && expirationDate < new Date()) {
    return 'inactive';
  }
  return status;
};

// ─── Status Dropdown for each row ─────────────────────────────────────────
const StatusDropdown = ({ userId, currentStatus, onUpdate, isUpdating }) => {
  const [open, setOpen] = useState(false);
  const statuses = ['active', 'inactive'];

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
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-[#0d6e70] rounded-xl text-xs font-black text-gray-600 hover:text-[#0d6e70] transition-all shadow-sm disabled:opacity-50"
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
                      : 'hover:bg-blue-50 hover:text-[#0d6e70] text-gray-700'
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
// ─── Enrollment Toggle Dropdown ───────────────────────────────────────────
const EnrollmentToggle = ({ user, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const enrolled = user.enrolled_courses || [];

  const toggleCourse = async (courseId) => {
    setUpdating(true);
    try {
      const newEnrolled = enrolled.includes(courseId)
        ? enrolled.filter(id => id !== courseId)
        : [...enrolled, courseId];

      const { error } = await supabase
        .from('users')
        .update({ enrolled_courses: newEnrolled })
        .eq('id', user.id);

      if (error) throw error;
      onUpdate(newEnrolled);
    } catch (err) {
      console.error('Failed to update enrollment:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={updating}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-[#0d6e70] rounded-xl text-xs font-black text-gray-600 hover:text-[#0d6e70] transition-all shadow-sm disabled:opacity-50"
      >
        {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
        Enrollment
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-gray-200/60 overflow-hidden w-64 p-2 space-y-1">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-3 py-2 border-b border-gray-50 mb-1">Select Access</p>
            {[
              { id: 'hc-formatting', label: 'Allahabad High Court' },
              { id: 'pitman-ex', label: 'Pitman Shorthand' },
              { id: 'audio-dict', label: 'Audio Dictations' },
              { id: 'kailash-chandra', label: 'Kailash Chandra' },
              { id: 'comprehension', label: 'Comprehension' },
              { id: 'state-exam', label: 'State Exams' }
            ].map(course => (
              <button
                key={course.id}
                onClick={() => toggleCourse(course.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  enrolled.includes(course.id)
                    ? 'bg-blue-50 text-[#0d6e70]'
                    : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                  enrolled.includes(course.id) ? 'bg-[#0d6e70] border-[#0d6e70]' : 'border-gray-300 bg-white'
                }`}>
                  {enrolled.includes(course.id) && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                </div>
                {course.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const AdminUserManagement = () => {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState('');
  const [searchTerm,  setSearchTerm]  = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'pending' | 'inactive'
  const [updatingId,  setUpdatingId]  = useState(null);
  const [toast,       setToast]       = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const STUDENTS_PER_PAGE = 15;

  // ─── Add Student State ───────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addFormData, setAddFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', state: '', city: '', gender: '',
    enrolledCourses: ['hc-formatting', 'pitman-ex', 'audio-dict', 'kailash-chandra', 'comprehension', 'state-exam'] // Default to all for convenience
  });

  // ─── Fetch all students ──────────────────────────────────────────────────
  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const { data, error: fetchErr } = await supabase
        .from('users')
        .select('id, first_name, last_name, name, email, phone, status, role, joinedDate, created_at, gender, state, city, enrolled_courses')
        .eq('role', 'student')
        .order('created_at', { ascending: true });

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
      const user = users.find(u => u.id === userId);
      const updatePayload = { status: newStatus };
      if (newStatus === 'active' && user && user.valid_until && new Date(user.valid_until) < new Date()) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 29);
        updatePayload.valid_until = expiry.toISOString();
      }

      const { error: updateErr } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', userId);

      if (updateErr) throw updateErr;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updatePayload } : u))
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

  // ─── Add Student ─────────────────────────────────────────────────────────
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    
    try {
      const email = addFormData.email.trim().toLowerCase();
      
      const { data: authData, error: signUpErr } = await adminAuthClient.auth.signUp({
        email: email,
        password: addFormData.password,
      });

      if (signUpErr) throw signUpErr;

      const { error: insertErr } = await supabase.from('users').insert([{
        first_name: addFormData.firstName.trim(),
        last_name: addFormData.lastName.trim(),
        name: `${addFormData.firstName.trim()} ${addFormData.lastName.trim()}`.trim(),
        email: email,
        phone: addFormData.phone.trim(),
        state: addFormData.state.trim(),
        city: addFormData.city.trim(),
        gender: addFormData.gender,
        status: 'active',
        role: 'student',
        enrolled_courses: addFormData.enrolledCourses,
        joinedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        created_at: new Date().toISOString(),
      }]);

      if (insertErr) throw insertErr;

      showToast('Student account created successfully!', 'success');
      setShowAddModal(false);
      setAddFormData({ firstName: '', lastName: '', email: '', phone: '', password: '', state: '', city: '', gender: '', enrolledCourses: ['hc-formatting', 'pitman-ex', 'audio-dict', 'kailash-chandra', 'comprehension', 'state-exam'] });
      fetchUsers(true);
    } catch (err) {
      showToast(err.message || 'Failed to create student.', 'error');
    } finally {
      setIsAdding(false);
    }
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
    const matchesStatus = statusFilter === 'all' || getComputedStatus(u) === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / STUDENTS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * STUDENTS_PER_PAGE,
    currentPage * STUDENTS_PER_PAGE
  );

  // ─── Stats ───────────────────────────────────────────────────────────────
  const stats = {
    total:    users.length,
    active:   users.filter((u) => getComputedStatus(u) === 'active').length,
    pending:  users.filter((u) => getComputedStatus(u) === 'pending').length,
    inactive: users.filter((u) => getComputedStatus(u) === 'inactive').length,
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

      {/* ── Add User Modal ───────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-10 rounded-t-3xl">
              <div>
                <h3 className="text-xl font-black text-gray-900">Add New Student</h3>
                <p className="text-xs text-gray-500 font-medium">Create a new student account instantly</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                  <input required value={addFormData.firstName} onChange={e => setAddFormData({...addFormData, firstName: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0d6e70] focus:ring-1 focus:ring-[#0d6e70] outline-none transition-all text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                  <input required value={addFormData.lastName} onChange={e => setAddFormData({...addFormData, lastName: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0d6e70] focus:ring-1 focus:ring-[#0d6e70] outline-none transition-all text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input required type="email" value={addFormData.email} onChange={e => setAddFormData({...addFormData, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0d6e70] focus:ring-1 focus:ring-[#0d6e70] outline-none transition-all text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                  <input required type="tel" value={addFormData.phone} onChange={e => setAddFormData({...addFormData, phone: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0d6e70] focus:ring-1 focus:ring-[#0d6e70] outline-none transition-all text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Temporary Password <span className="text-red-500">*</span></label>
                  <input required type="text" minLength="6" value={addFormData.password} onChange={e => setAddFormData({...addFormData, password: e.target.value})} placeholder="Min 6 chars" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0d6e70] focus:ring-1 focus:ring-[#0d6e70] outline-none transition-all text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
                  <select required value={addFormData.gender} onChange={e => setAddFormData({...addFormData, gender: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0d6e70] focus:ring-1 focus:ring-[#0d6e70] outline-none transition-all text-sm font-medium bg-white">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                  <input required value={addFormData.state} onChange={e => setAddFormData({...addFormData, state: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0d6e70] focus:ring-1 focus:ring-[#0d6e70] outline-none transition-all text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                  <input required value={addFormData.city} onChange={e => setAddFormData({...addFormData, city: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0d6e70] focus:ring-1 focus:ring-[#0d6e70] outline-none transition-all text-sm font-medium" />
                </div>
              </div>

              {/* Enrollment Selection */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-black text-gray-800">Course Enrollment</label>
                  <button 
                    type="button" 
                    onClick={() => {
                      const allIds = ['hc-formatting', 'pitman-ex', 'audio-dict', 'kailash-chandra', 'comprehension', 'state-exam'];
                      setAddFormData({...addFormData, enrolledCourses: addFormData.enrolledCourses.length === allIds.length ? [] : allIds});
                    }}
                    className="text-xs text-[#0d6e70] font-bold underline"
                  >
                    {addFormData.enrolledCourses.length === 6 ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'hc-formatting', label: 'Allahabad High Court Formatting' },
                    { id: 'pitman-ex', label: 'Pitman Shorthand Exercise' },
                    { id: 'audio-dict', label: 'Audio Dictations' },
                    { id: 'kailash-chandra', label: 'Kailash Chandra' },
                    { id: 'comprehension', label: 'Comprehension' },
                    { id: 'state-exam', label: 'State Exams' }
                  ].map(course => (
                    <label key={course.id} className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                      addFormData.enrolledCourses.includes(course.id) 
                        ? 'border-[#0d6e70] bg-blue-50' 
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={addFormData.enrolledCourses.includes(course.id)}
                        onChange={(e) => {
                          const current = addFormData.enrolledCourses;
                          setAddFormData({
                            ...addFormData,
                            enrolledCourses: e.target.checked 
                              ? [...current, course.id]
                              : current.filter(id => id !== course.id)
                          });
                        }}
                      />
                      <div className={`w-5 h-5 rounded-md border-2 mr-3 flex items-center justify-center transition-all ${
                        addFormData.enrolledCourses.includes(course.id) ? 'bg-[#0d6e70] border-[#0d6e70]' : 'border-gray-300 bg-white'
                      }`}>
                        {addFormData.enrolledCourses.includes(course.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{course.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={isAdding} className="flex-1 py-3 px-4 rounded-xl bg-[#0d6e70] text-white font-bold hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#0d6e70]/10 rounded-2xl border border-[#0d6e70]/10">
            <Users className="w-6 h-6 text-[#0d6e70]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 leading-none">Student Management</h2>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">
              Active/Disabled Management
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0d6e70] hover:bg-blue-800 text-white rounded-xl text-sm font-black transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Add Student
          </button>
          <button
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-[#0d6e70] rounded-xl text-sm font-black text-gray-500 hover:text-[#0d6e70] transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stats Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: stats.total,    color: 'text-[#0d6e70]', bg: 'bg-blue-50',   border: 'border-blue-100', icon: Users       },
          { label: 'Active',         value: stats.active,   color: 'text-green-700', bg: 'bg-green-50',  border: 'border-green-100',icon: UserCheck    },
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
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white outline-none focus:border-[#0d6e70] focus:ring-2 focus:ring-[#0d6e70]/10 transition-all"
          />
        </div>
        {/* Status filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'active', 'inactive'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                statusFilter === s
                  ? 'bg-[#0d6e70] text-white border-[#0d6e70] shadow-md'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-[#0d6e70] hover:text-[#0d6e70]'
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
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                {['Student', 'Email', 'Phone', 'State / City', 'Registered'].map((col) => (
                  <th key={col} className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">
                    {col}
                  </th>
                ))}
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap sticky right-[120px] bg-gray-50/80 z-10 hidden md:table-cell">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap sticky right-0 bg-gray-50/80 z-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-[#0d6e70] animate-spin" />
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
              ) : paginatedUsers.map((u) => (
                <tr key={u.id} className="group hover:bg-blue-50/20 transition-all duration-200">
                  {/* Student Name */}
                  <td className="px-6 py-4 max-w-[200px]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0d6e70] to-blue-500 flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0 group-hover:shadow-md transition-shadow">
                        {displayName(u).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 leading-none group-hover:text-[#0d6e70] transition-colors truncate">
                          {displayName(u)}
                        </p>
                        {u.gender && (
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{u.gender}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4 max-w-[200px]">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      <span className="text-sm text-gray-600 font-medium truncate" title={u.email}>{u.email || '—'}</span>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600 font-medium">{u.phone || '—'}</span>
                  </td>

                  {/* State / City */}
                  <td className="px-6 py-4 max-w-[150px]">
                    <span className="text-sm text-gray-600 font-medium truncate block" title={u.state && u.city ? `${u.city}, ${u.state}` : (u.state || u.city || '—')}>
                      {u.state && u.city ? `${u.city}, ${u.state}` : (u.state || u.city || '—')}
                    </span>
                  </td>

                  {/* Registration Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      <span className="text-sm text-gray-500 font-medium">
                        {u.joinedDate || formatDate(u.created_at)}
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4 whitespace-nowrap sticky right-[120px] bg-white group-hover:bg-blue-50/20 transition-colors z-10 hidden md:table-cell shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)] border-l border-gray-50">
                    <StatusBadge status={getComputedStatus(u)} />
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 flex items-center gap-2 whitespace-nowrap sticky right-0 bg-white group-hover:bg-blue-50/20 transition-colors z-10 md:shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)] shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.1)] border-l md:border-l-0 border-gray-50">
                    <StatusDropdown
                      userId={u.id}
                      currentStatus={getComputedStatus(u)}
                      onUpdate={handleStatusUpdate}
                      isUpdating={updatingId === u.id}
                    />
                    <EnrollmentToggle 
                      user={u} 
                      onUpdate={(courses) => {
                        setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, enrolled_courses: courses } : usr));
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer with pagination */}
        {!loading && filteredUsers.length > 0 && (
          <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Showing {Math.min((currentPage - 1) * STUDENTS_PER_PAGE + 1, filteredUsers.length)}–{Math.min(currentPage * STUDENTS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} students
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-[#0d6e70] hover:text-white hover:border-[#0d6e70] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                      currentPage === p
                        ? 'bg-[#0d6e70] text-white shadow-md'
                        : 'border border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-[#0d6e70]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-[#0d6e70] hover:text-white hover:border-[#0d6e70] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserManagement;
