import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Loader2, AlertCircle, CheckCircle, UserCheck, Users,
  Search, ChevronDown, ChevronUp, X, Shield, UserPlus,
} from 'lucide-react';
import {
  getUsers, updateDospemStatus, assignAdvisor,
  bulkAssignAdvisor, getAdvisorSummary,
} from '../userService';
import DashboardJumbotron from '@/components/shared/DashboardJumbotron';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

// ============================================================
// Admin — Dosen Pembimbing (Advisor) Assignment Page
// ============================================================

const AdvisorAssignmentPage = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('advisors'); // 'advisors' | 'students'

  // Data
  const [dosenList, setDosenList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [advisorSummary, setAdvisorSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [bulkAdvisorId, setBulkAdvisorId] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [expandedAdvisor, setExpandedAdvisor] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dosenRes, studentRes, summaryRes] = await Promise.all([
        getUsers({ role: 'DOSEN' }),
        getUsers({ role: 'MAHASISWA' }),
        getAdvisorSummary().catch(() => ({ data: [] })),
      ]);
      setDosenList(dosenRes.data || []);
      setStudentList(studentRes.data || []);
      setAdvisorSummary(summaryRes.data || []);
    } catch (err) {
      setError(err?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle Dospem status
  const handleToggleDospem = async (userId, currentStatus) => {
    setProcessingId(userId);
    try {
      await updateDospemStatus(userId, !currentStatus);
      setDosenList(prev =>
        prev.map(d => d.id === userId ? { ...d, isDospem: !currentStatus } : d)
      );
      showToast(`Status Dospem berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
      // Refresh summary
      const summaryRes = await getAdvisorSummary().catch(() => ({ data: [] }));
      setAdvisorSummary(summaryRes.data || []);
    } catch (err) {
      showToast(err?.message || 'Gagal mengubah status Dospem', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Assign single student
  const handleAssignAdvisor = async (studentId, advisorId) => {
    setProcessingId(studentId);
    try {
      await assignAdvisor(studentId, advisorId || null);
      setStudentList(prev =>
        prev.map(s => {
          if (s.id !== studentId) return s;
          const advisor = advisorId ? dosenList.find(d => d.id === advisorId) : null;
          return { ...s, advisorId: advisorId || null, advisor: advisor ? { id: advisor.id, name: advisor.name, email: advisor.email } : null };
        })
      );
      showToast(advisorId ? 'Dosen pembimbing berhasil ditetapkan' : 'Dosen pembimbing berhasil dihapus');
    } catch (err) {
      showToast(err?.message || 'Gagal menetapkan dosen pembimbing', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Bulk assign
  const handleBulkAssign = async () => {
    if (selectedStudents.size === 0 || !bulkAdvisorId) return;
    setBulkProcessing(true);
    try {
      await bulkAssignAdvisor(Array.from(selectedStudents), bulkAdvisorId);
      const advisor = dosenList.find(d => d.id === bulkAdvisorId);
      setStudentList(prev =>
        prev.map(s => {
          if (!selectedStudents.has(s.id)) return s;
          return { ...s, advisorId: bulkAdvisorId, advisor: advisor ? { id: advisor.id, name: advisor.name, email: advisor.email } : null };
        })
      );
      showToast(`${selectedStudents.size} mahasiswa berhasil ditetapkan`);
      setSelectedStudents(new Set());
      setBulkAdvisorId('');
    } catch (err) {
      showToast(err?.message || 'Gagal bulk assign', 'error');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Toggle student selection
  const toggleStudent = (id) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAllStudents = () => {
    const visible = filteredStudents.map(s => s.id);
    setSelectedStudents(prev => {
      const allSelected = visible.every(id => prev.has(id));
      const next = new Set(prev);
      visible.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  // Dospem list (only isDospem = true)
  const activeDospem = useMemo(() => dosenList.filter(d => d.isDospem), [dosenList]);

  // Filtered lists
  const filteredDosen = useMemo(() => {
    if (!searchQuery.trim()) return dosenList;
    const q = searchQuery.toLowerCase();
    return dosenList.filter(d => d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q));
  }, [dosenList, searchQuery]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentList;
    const q = searchQuery.toLowerCase();
    return studentList.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.advisor?.name?.toLowerCase()?.includes(q)
    );
  }, [studentList, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const totalDospem = activeDospem.length;
    const totalStudents = studentList.length;
    const assigned = studentList.filter(s => s.advisorId).length;
    return { totalDospem, totalStudents, assigned, unassigned: totalStudents - assigned };
  }, [activeDospem, studentList]);

  return (
    <div className="space-y-6 pb-20">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <DashboardJumbotron
        icon={UserCheck}
        title="Dosen Pembimbing Akademik"
        subtitle="Kelola status Dospem dan tetapkan dosen pembimbing untuk setiap mahasiswa."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Shield size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{stats.totalDospem}</p>
            <p className="text-xs text-slate-500">Total Dospem</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Users size={20} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{stats.totalStudents}</p>
            <p className="text-xs text-slate-500">Total Mahasiswa</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <UserPlus size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{stats.assigned}</p>
            <p className="text-xs text-slate-500">Sudah Ditetapkan</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
            <AlertCircle size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{stats.unassigned}</p>
            <p className="text-xs text-slate-500">Belum Ditetapkan</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => { setActiveTab('advisors'); setSearchQuery(''); }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'advisors' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Shield size={14} className="inline mr-1.5" />
          Dosen Pembimbing
        </button>
        <button
          onClick={() => { setActiveTab('students'); setSearchQuery(''); }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'students' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Users size={14} className="inline mr-1.5" />
          Mahasiswa
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={activeTab === 'advisors' ? 'Cari dosen...' : 'Cari mahasiswa atau dosen...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-2">
          <AlertCircle size={32} />
          <p className="text-sm">{error}</p>
          <button onClick={fetchData} className="text-blue-600 text-sm underline">Coba lagi</button>
        </div>
      ) : activeTab === 'advisors' ? (
        /* ============ ADVISORS TAB ============ */
        <div className="space-y-4">
          <div className="bg-white rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dosen</TableHead>
                  <TableHead className="text-center">Status Dospem</TableHead>
                  <TableHead className="text-center">Jumlah Mahasiswa</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDosen.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-400 py-10">
                      Tidak ada dosen ditemukan
                    </TableCell>
                  </TableRow>
                ) : filteredDosen.map(dosen => {
                  const studentCount = dosen._count?.advisedStudents || dosen.advisedStudentCount || 0;
                  return (
                    <TableRow key={dosen.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                            {dosen.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{dosen.name}</p>
                            <p className="text-xs text-slate-500">{dosen.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {dosen.isDospem ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <UserCheck size={12} /> Aktif
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Tidak aktif</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {studentCount > 0 ? (
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{studentCount}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleToggleDospem(dosen.id, dosen.isDospem)}
                          disabled={processingId === dosen.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${dosen.isDospem
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                        >
                          {processingId === dosen.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : dosen.isDospem ? (
                            <>
                              <X size={12} /> Nonaktifkan
                            </>
                          ) : (
                            <>
                              <UserCheck size={12} /> Aktifkan
                            </>
                          )}
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Advisor Summary Cards */}
          {advisorSummary.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Ringkasan Dospem Aktif</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {advisorSummary.map(advisor => (
                  <div
                    key={advisor.id}
                    className="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => setExpandedAdvisor(expandedAdvisor === advisor.id ? null : advisor.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                          {advisor.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{advisor.name}</p>
                          <p className="text-xs text-slate-500">{advisor.studentCount || 0} mahasiswa</p>
                        </div>
                      </div>
                      {expandedAdvisor === advisor.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                    {expandedAdvisor === advisor.id && advisor.students?.length > 0 && (
                      <div className="mt-3 pt-3 border-t space-y-1.5">
                        {advisor.students.map(s => (
                          <div key={s.id} className="flex items-center gap-2 text-sm text-slate-600">
                            <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-xs font-medium">
                              {s.name?.charAt(0)}
                            </div>
                            <span>{s.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ============ STUDENTS TAB ============ */
        <div className="space-y-4">
          {/* Bulk Assign Bar */}
          {selectedStudents.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-sm text-blue-700 font-medium">
                {selectedStudents.size} mahasiswa dipilih
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={bulkAdvisorId}
                  onChange={(e) => setBulkAdvisorId(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih Dospem...</option>
                  {activeDospem.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleBulkAssign}
                  disabled={!bulkAdvisorId || bulkProcessing}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {bulkProcessing ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  Tetapkan
                </button>
                <button
                  onClick={() => setSelectedStudents(new Set())}
                  className="text-slate-400 hover:text-slate-600 text-sm"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.has(s.id))}
                      onChange={toggleSelectAllStudents}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Mahasiswa</TableHead>
                  <TableHead>Dosen Pembimbing</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-400 py-10">
                      Tidak ada mahasiswa ditemukan
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs">
                          {student.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{student.name}</p>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.advisor ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold">
                            {student.advisor.name?.charAt(0)}
                          </div>
                          <span className="text-sm">{student.advisor.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Belum ditetapkan</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <select
                        value={student.advisorId || ''}
                        onChange={(e) => handleAssignAdvisor(student.id, e.target.value)}
                        disabled={processingId === student.id}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 w-36"
                      >
                        <option value="">— Tidak ada —</option>
                        {activeDospem.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      {processingId === student.id && (
                        <Loader2 size={14} className="inline ml-2 animate-spin text-blue-600" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisorAssignmentPage;
