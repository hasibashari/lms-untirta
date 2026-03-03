import { useEffect, useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Loader2, AlertCircle, XCircle, Users,
  Clock, ChevronDown, ChevronUp, Search, UserCheck, ShieldOff,
} from 'lucide-react';
import {
  getAdvisoryStudents, getAdvisoryPendingKRS,
  updateEnrollmentStatus, bulkUpdateEnrollmentStatus,
} from '../krsService';
import { getAllSemesters } from '@/features/academic/academicService';
import SemesterFilter from '@/components/shared/SemesterFilter';
import KrsStatusBadge from '../components/KrsStatusBadge';
import DashboardJumbotron from '@/components/shared/DashboardJumbotron';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

// ============================================================
// Dosen Pembimbing (Dospem) Advisory Page
// Menampilkan mahasiswa bimbingan dan KRS pending approval
// ============================================================

const DosenAdvisoryPage = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'students'

  // Filter state
  const [academicSemesterId, setAcademicSemesterId] = useState(null);

  // Semester data for filter
  const [semesters, setSemesters] = useState([]);

  // Data state
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [advisoryData, setAdvisoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [processingId, setProcessingId] = useState(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [rejectNoteId, setRejectNoteId] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [revokeNoteId, setRevokeNoteId] = useState(null);
  const [revokeNote, setRevokeNote] = useState('');
  const [revokingId, setRevokingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStudentAll, setExpandedStudentAll] = useState(null);

  // Fetch pending KRS
  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (academicSemesterId) params.academicSemesterId = academicSemesterId;
      const res = await getAdvisoryPendingKRS(params);
      setPendingEnrollments(res.data || []);
      setSelectedIds(new Set());
      setExpandedStudent(null);
    } catch (err) {
      setError(err?.message || err || 'Gagal memuat data KRS');
    } finally {
      setLoading(false);
    }
  }, [academicSemesterId]);

  // Fetch advisory students
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (academicSemesterId) params.academicSemesterId = academicSemesterId;
      const res = await getAdvisoryStudents(params);
      setAdvisoryData(res.data || null);
    } catch (err) {
      setError(err?.message || err || 'Gagal memuat data mahasiswa');
    } finally {
      setLoading(false);
    }
  }, [academicSemesterId]);

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPending();
    } else {
      fetchStudents();
    }
  }, [activeTab, fetchPending, fetchStudents]);

  useEffect(() => {
    getAllSemesters()
      .then(res => setSemesters(res.data?.data || []))
      .catch(() => setSemesters([]));
  }, []);

  // Show temporary toast
  const showToast = (msg, type = 'success') => {
    type === 'error' ? toast.error(msg) : toast.success(msg);
  };

  // Group pending enrollments by student
  const groupedByStudent = useMemo(() => {
    const map = new Map();
    for (const e of pendingEnrollments) {
      const sid = e.student.id;
      if (!map.has(sid)) {
        map.set(sid, { student: e.student, enrollments: [], totalSKS: 0 });
      }
      const group = map.get(sid);
      group.enrollments.push(e);
      group.totalSKS += e.class?.course?.sks || 3;
    }
    return Array.from(map.values());
  }, [pendingEnrollments]);

  // Filtered groups
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedByStudent;
    const q = searchQuery.toLowerCase();
    return groupedByStudent.filter(
      g => g.student.name.toLowerCase().includes(q) || g.student.email.toLowerCase().includes(q)
    );
  }, [groupedByStudent, searchQuery]);

  // Selection handlers
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (studentEnrollments) => {
    const ids = studentEnrollments.map(e => e.id);
    setSelectedIds(prev => {
      const next = new Set(prev);
      const allSelected = ids.every(id => next.has(id));
      ids.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  // Approve single enrollment
  const handleApprove = async (enrollmentId) => {
    setProcessingId(enrollmentId);
    try {
      await updateEnrollmentStatus(enrollmentId, { status: 'APPROVED' });
      showToast('KRS berhasil disetujui');
      fetchPending();
    } catch (err) {
      showToast(err?.message || err || 'Gagal menyetujui KRS', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Reject single enrollment
  const handleReject = async (enrollmentId) => {
    if (!rejectNote.trim()) {
      showToast('Catatan penolakan wajib diisi', 'error');
      return;
    }
    setProcessingId(enrollmentId);
    try {
      await updateEnrollmentStatus(enrollmentId, { status: 'REJECTED', note: rejectNote });
      showToast('KRS berhasil ditolak');
      setRejectNoteId(null);
      setRejectNote('');
      fetchPending();
    } catch (err) {
      showToast(err?.message || err || 'Gagal menolak KRS', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Bulk approve
  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    try {
      await bulkUpdateEnrollmentStatus({
        enrollmentIds: Array.from(selectedIds),
        status: 'APPROVED',
      });
      showToast(`${selectedIds.size} KRS berhasil disetujui`);
      fetchPending();
    } catch (err) {
      showToast(err?.message || err || 'Gagal bulk approve', 'error');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Approve all enrollments for a student
  const handleApproveAllStudent = async (studentEnrollments) => {
    const ids = studentEnrollments.map(e => e.id);
    setBulkProcessing(true);
    try {
      await bulkUpdateEnrollmentStatus({
        enrollmentIds: ids,
        status: 'APPROVED',
      });
      showToast(`${ids.length} KRS berhasil disetujui`);
      fetchPending();
    } catch (err) {
      showToast(err?.message || err || 'Gagal approve semua', 'error');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Revoke approval (APPROVED → REJECTED)
  const handleRevoke = async (enrollmentId) => {
    if (!revokeNote.trim()) {
      showToast('Alasan pencabutan persetujuan wajib diisi', 'error');
      return;
    }
    setRevokingId(enrollmentId);
    try {
      await updateEnrollmentStatus(enrollmentId, { status: 'REJECTED', note: revokeNote });
      showToast('Persetujuan KRS berhasil dicabut');
      setRevokeNoteId(null);
      setRevokeNote('');
      fetchStudents();
    } catch (err) {
      showToast(err?.message || err || 'Gagal mencabut persetujuan', 'error');
    } finally {
      setRevokingId(null);
    }
  };

  // Stats
  const stats = useMemo(() => ({
    totalStudents: groupedByStudent.length,
    totalPending: pendingEnrollments.length,
    totalSKS: pendingEnrollments.reduce((sum, e) => sum + (e.class?.course?.sks || 3), 0),
  }), [groupedByStudent, pendingEnrollments]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <DashboardJumbotron
        title="Perwalian Akademik"
        subtitle="Kelola KRS mahasiswa bimbingan Anda. Tinjau dan setujui atau tolak pengajuan KRS."
        icon={UserCheck}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{stats.totalStudents}</p>
            <p className="text-xs text-slate-500">Mahasiswa Menunggu</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
            <Clock size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{stats.totalPending}</p>
            <p className="text-xs text-slate-500">Total KRS Pending</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
            <CheckCircle size={20} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{stats.totalSKS}</p>
            <p className="text-xs text-slate-500">Total SKS Pending</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Clock size={14} className="inline mr-1.5" />
          KRS Pending
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'students' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Users size={14} className="inline mr-1.5" />
          Semua Mahasiswa
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <SemesterFilter
          semesters={semesters}
          academicSemesterId={academicSemesterId}
          onAcademicSemesterChange={(val) => setAcademicSemesterId(val === 'all' ? null : val)}
        />
        {activeTab === 'pending' && (
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari mahasiswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-2">
          <AlertCircle size={32} />
          <p className="text-sm">{error}</p>
          <button onClick={activeTab === 'pending' ? fetchPending : fetchStudents} className="text-blue-600 text-sm underline">
            Coba lagi
          </button>
        </div>
      ) : activeTab === 'pending' ? (
        /* ============ PENDING KRS TAB ============ */
        filteredGroups.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <CheckCircle size={48} className="mx-auto mb-3 text-green-300" />
            <p className="font-medium text-slate-600">Semua KRS sudah ditinjau</p>
            <p className="text-sm">Tidak ada pengajuan KRS yang menunggu persetujuan.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map(({ student, enrollments: studentEnrollments, totalSKS }) => {
              const isExpanded = expandedStudent === student.id;
              const allSelected = studentEnrollments.every(e => selectedIds.has(e.id));

              return (
                <div key={student.id} className="bg-white rounded-xl border overflow-hidden">
                  {/* Student Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                        {student.name?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{student.name}</h3>
                        <p className="text-xs text-slate-500">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        {studentEnrollments.length} MK &bull; {totalSKS} SKS
                      </span>
                      {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t">
                      {/* Select All & Approve All */}
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b">
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={() => toggleSelectAll(studentEnrollments)}
                            className="rounded"
                          />
                          Pilih semua
                        </label>
                        <button
                          onClick={() => handleApproveAllStudent(studentEnrollments)}
                          disabled={bulkProcessing}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircle size={14} />
                          Approve Semua
                        </button>
                      </div>

                      {/* Enrollment Table */}
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-10"></TableHead>
                              <TableHead>Kode</TableHead>
                              <TableHead>Mata Kuliah</TableHead>
                              <TableHead>Kelas</TableHead>
                              <TableHead className="text-center">SKS</TableHead>
                              <TableHead>Dosen</TableHead>
                              <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentEnrollments.map(enrollment => (
                              <TableRow key={enrollment.id}>
                                <TableCell>
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.has(enrollment.id)}
                                    onChange={() => toggleSelect(enrollment.id)}
                                    className="rounded"
                                  />
                                </TableCell>
                                <TableCell className="font-mono text-xs">{enrollment.class?.course?.code}</TableCell>
                                <TableCell className="font-medium">{enrollment.class?.course?.title}</TableCell>
                                <TableCell>{enrollment.class?.section}</TableCell>
                                <TableCell className="text-center">{enrollment.class?.course?.sks || 3}</TableCell>
                                <TableCell className="text-sm text-slate-500">{enrollment.class?.lecturer?.name || '-'}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {rejectNoteId === enrollment.id ? (
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={rejectNote}
                                          onChange={(e) => setRejectNote(e.target.value)}
                                          placeholder="Alasan penolakan..."
                                          className="text-xs border rounded-md px-2 py-1 w-40 focus:outline-none focus:ring-1 focus:ring-red-400"
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => handleReject(enrollment.id)}
                                          disabled={processingId === enrollment.id}
                                          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                                        >
                                          {processingId === enrollment.id ? <Loader2 size={12} className="animate-spin" /> : 'Tolak'}
                                        </button>
                                        <button
                                          onClick={() => { setRejectNoteId(null); setRejectNote(''); }}
                                          className="text-slate-400 hover:text-slate-600"
                                        >
                                          <XCircle size={16} />
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => handleApprove(enrollment.id)}
                                          disabled={processingId === enrollment.id}
                                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                                          title="Setujui"
                                        >
                                          {processingId === enrollment.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                        </button>
                                        <button
                                          onClick={() => { setRejectNoteId(enrollment.id); setRejectNote(''); }}
                                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                          title="Tolak"
                                        >
                                          <XCircle size={16} />
                                        </button>
                                      </>
                                    )}
                                  </div>
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
            })}
          </div>
        )
      ) : (
        /* ============ ALL STUDENTS TAB ============ */
        !advisoryData || advisoryData.students?.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-600">Belum ada mahasiswa bimbingan</p>
            <p className="text-sm">Hubungi Admin untuk penugasan mahasiswa.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-lg font-bold text-slate-800">{advisoryData.summary?.totalStudents || 0}</p>
                <p className="text-xs text-slate-500">Total Mahasiswa</p>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-lg font-bold text-amber-600">{advisoryData.summary?.totalPending || 0}</p>
                <p className="text-xs text-slate-500">KRS Pending</p>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-lg font-bold text-green-600">{advisoryData.summary?.totalApproved || 0}</p>
                <p className="text-xs text-slate-500">KRS Approved</p>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-lg font-bold text-red-600">{advisoryData.summary?.totalRejected || 0}</p>
                <p className="text-xs text-slate-500">KRS Rejected</p>
              </div>
            </div>

            {/* Student List — Expandable */}
            <div className="space-y-3">
              {advisoryData.students.map(student => {
                const isExpanded = expandedStudentAll === student.id;
                const approvedEnrollments = student.enrollments.filter(e => e.status === 'APPROVED');

                return (
                  <div key={student.id} className="bg-white rounded-xl border overflow-hidden">
                    {/* Student Header */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => setExpandedStudentAll(isExpanded ? null : student.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                          {student.name?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{student.name}</h3>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{student.stats?.total || 0} MK</span>
                        {student.stats?.pending > 0 && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{student.stats.pending} Pending</span>
                        )}
                        {student.stats?.approved > 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{student.stats.approved} Approved</span>
                        )}
                        {student.stats?.rejected > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">{student.stats.rejected} Rejected</span>
                        )}
                        {isExpanded ? <ChevronUp size={18} className="text-slate-400 ml-1" /> : <ChevronDown size={18} className="text-slate-400 ml-1" />}
                      </div>
                    </div>

                    {/* Expanded Enrollment Details */}
                    {isExpanded && student.enrollments.length > 0 && (
                      <div className="border-t">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Kode</TableHead>
                                <TableHead>Mata Kuliah</TableHead>
                                <TableHead>Kelas</TableHead>
                                <TableHead className="text-center">SKS</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {student.enrollments.map(enrollment => {
                                const semesterStatus = enrollment.class?.academicSemester?.status;
                                const canRevoke = enrollment.status === 'APPROVED' && semesterStatus === 'OPEN';

                                return (
                                  <TableRow key={enrollment.id}>
                                    <TableCell className="font-mono text-xs">{enrollment.class?.course?.code}</TableCell>
                                    <TableCell className="font-medium">{enrollment.class?.course?.title}</TableCell>
                                    <TableCell>{enrollment.class?.section}</TableCell>
                                    <TableCell className="text-center">{enrollment.class?.course?.sks || 3}</TableCell>
                                    <TableCell>
                                      <KrsStatusBadge status={enrollment.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {canRevoke && (
                                        <div>
                                          {revokeNoteId === enrollment.id ? (
                                            <div className="flex items-center justify-end gap-2">
                                              <input
                                                type="text"
                                                value={revokeNote}
                                                onChange={(e) => setRevokeNote(e.target.value)}
                                                placeholder="Alasan pencabutan..."
                                                className="text-xs border rounded-md px-2 py-1 w-44 focus:outline-none focus:ring-1 focus:ring-orange-400"
                                                autoFocus
                                                onKeyDown={(e) => e.key === 'Enter' && handleRevoke(enrollment.id)}
                                              />
                                              <button
                                                onClick={() => handleRevoke(enrollment.id)}
                                                disabled={revokingId === enrollment.id}
                                                className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 disabled:opacity-50"
                                              >
                                                {revokingId === enrollment.id ? <Loader2 size={12} className="animate-spin" /> : 'Cabut'}
                                              </button>
                                              <button
                                                onClick={() => { setRevokeNoteId(null); setRevokeNote(''); }}
                                                className="text-slate-400 hover:text-slate-600"
                                              >
                                                <XCircle size={16} />
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => { setRevokeNoteId(enrollment.id); setRevokeNote(''); }}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 transition-colors"
                                              title="Cabut persetujuan KRS ini"
                                            >
                                              <ShieldOff size={12} />
                                              Cabut Persetujuan
                                            </button>
                                          )}
                                        </div>
                                      )}
                                      {enrollment.status === 'REJECTED' && enrollment.note && (
                                        <span className="text-xs text-slate-400 italic" title={enrollment.note}>
                                          {enrollment.note.length > 30 ? enrollment.note.substring(0, 30) + '...' : enrollment.note}
                                        </span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {isExpanded && student.enrollments.length === 0 && (
                      <div className="border-t px-4 py-6 text-center text-sm text-slate-400">
                        Belum ada KRS yang diajukan untuk semester ini.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && activeTab === 'pending' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-4 z-50">
          <span className="text-sm">{selectedIds.size} dipilih</span>
          <button
            onClick={handleBulkApprove}
            disabled={bulkProcessing}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {bulkProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Approve Semua
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-slate-400 hover:text-white text-sm"
          >
            Batal
          </button>
        </div>
      )}
    </div>
  );
};

export default DosenAdvisoryPage;
