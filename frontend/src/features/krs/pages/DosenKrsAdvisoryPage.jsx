import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Loader2, AlertCircle, XCircle, Users,
  ChevronDown, ChevronUp, UserCheck, ShieldOff,
} from 'lucide-react';
import {
  getAdvisoryStudents,
  updateEnrollmentStatus,
  bulkUpdateEnrollmentStatus,
} from '../krsService';
import { getAllSemesters, updateSemester } from '@/features/academic/academicService';
import SemesterFilter from '@/shared/components/forms/SemesterFilter';
import KrsStatusBadge from '../components/KrsStatusBadge';
import DashboardJumbotron from '@/shared/components/layout/Jumbotron';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/components/ui/table';

// ============================================================
// Dosen Pembimbing (Dospem) Advisory Page
// Menampilkan mahasiswa bimbingan dan KRS mereka
// ============================================================

const DosenAdvisoryPage = () => {
  // Filter state
  const [academicSemesterId, setAcademicSemesterId] = useState(null);

  // Semester data for filter
  const [semesters, setSemesters] = useState([]);

  // Data state
  const [advisoryData, setAdvisoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [revokeNoteId, setRevokeNoteId] = useState(null);
  const [revokeNote, setRevokeNote] = useState('');
  const [revokingId, setRevokingId] = useState(null);
  const [expandedStudentAll, setExpandedStudentAll] = useState(null);
  const [isAutoKrs, setIsAutoKrs] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

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
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    getAllSemesters()
      .then(res => {
        // res is already the body { success, data } because of interceptor
        const list = res.data || [];
        setSemesters(list);
      })
      .catch(() => setSemesters([]));
  }, []);

  // Auto-select active semester if none selected yet
  useEffect(() => {
    if (semesters.length > 0 && !academicSemesterId) {
      const active = semesters.find(s => s.status === 'OPEN');
      if (active) {
        setAcademicSemesterId(active.id);
        setIsAutoKrs(active.isAutoKrs ?? true);
      }
    }
  }, [semesters, academicSemesterId]);

  // Sync isAutoKrs state when semester ID changes
  useEffect(() => {
    if (academicSemesterId && semesters.length > 0) {
      const selected = semesters.find(s => s.id === academicSemesterId);
      if (selected) {
        setIsAutoKrs(selected.isAutoKrs ?? true);
      }
    }
  }, [academicSemesterId, semesters]);

  const handleToggleAutoKrs = async () => {
    const activeSem = semesters.find(s => s.id === academicSemesterId) || semesters.find(s => s.status === 'OPEN');
    if (!activeSem) {
      showToast('Pilih semester aktif terlebih dahulu', 'error');
      return;
    }

    setIsToggling(true);
    const newValue = !isAutoKrs;
    try {
      await updateSemester(activeSem.id, { isAutoKrs: newValue });
      setIsAutoKrs(newValue);
      showToast(`Mode ${newValue ? 'Auto-Approval' : 'Manual Approval'} diaktifkan`);
    } catch {
      showToast('Gagal mengubah pengaturan', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  // Show temporary toast
  const showToast = (msg, type = 'success') => {
    type === 'error' ? toast.error(msg) : toast.success(msg);
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

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <DashboardJumbotron
        title="Perwalian Akademik"
        subtitle="Kelola KRS mahasiswa bimbingan Anda. Tinjau riwayat dan cabut persetujuan KRS jika diperlukan."
        icon={UserCheck}
      />

      {/* Mode Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isAutoKrs ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'}`}>
            <ShieldOff size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Mode Persetujuan KRS</h4>
            <p className="text-xs text-slate-500">Saat ini: <b>{isAutoKrs ? 'Otomatis' : 'Manual'}</b></p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-4 border-r pr-4 border-slate-100">
            <span className={`text-[10px] font-bold uppercase ${isAutoKrs ? 'text-blue-600' : 'text-slate-400'}`}>Auto</span>
            <button
              onClick={handleToggleAutoKrs}
              disabled={isToggling}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isAutoKrs ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
              <span
                className={`${isAutoKrs ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
            <span className={`text-[10px] font-bold uppercase ${!isAutoKrs ? 'text-slate-700' : 'text-slate-400'}`}>Manual</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Filter Semester:</span>
            <SemesterFilter
              semesters={semesters}
              selectedId={academicSemesterId}
              onSelect={setAcademicSemesterId}
              hideAllOption={true}
            />
          </div>
        </div>
      </div>

      {/* Advisory Content */}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-2">
          <AlertCircle size={32} />
          <p className="text-sm">{error}</p>
          <button onClick={fetchStudents} className="text-blue-600 text-sm underline">
            Coba lagi
          </button>
        </div>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-lg font-bold text-slate-800">{advisoryData.summary?.totalStudents || 0}</p>
                <p className="text-xs text-slate-500">Total Mahasiswa</p>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-lg font-bold text-green-600">{advisoryData.summary?.totalApproved || 0}</p>
                <p className="text-xs text-slate-500">KRS Disetujui</p>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center col-span-2 md:col-span-1">
                <p className="text-lg font-bold text-red-600">{advisoryData.summary?.totalRejected || 0}</p>
                <p className="text-xs text-slate-500">KRS Ditolak / Dicabut</p>
              </div>
            </div>

            {/* Student List — Expandable */}
            <div className="space-y-3">
              {advisoryData.students.map(student => {
                const isExpanded = expandedStudentAll === student.id;

                return (
                  <div key={student.id} className="bg-white rounded-xl border overflow-hidden">
                    {/* Student Header */}
                    <div
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors gap-4"
                      onClick={() => setExpandedStudentAll(isExpanded ? null : student.id)}
                    >
                      <div className="flex items-center gap-3 min-w-[240px]">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                          {student.name?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{student.name}</h3>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </div>
                      </div>

                      {/* Monitoring SKS Progress */}
                      <div className="flex-1 max-w-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Beban SKS</span>
                          <span className={`text-xs font-bold ${student.stats.totalSks > 20 ? 'text-orange-600' : 'text-blue-600'}`}>
                            {student.stats.totalSks} / 24
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              student.stats.totalSks > 22 ? 'bg-red-500' : 
                              student.stats.totalSks > 18 ? 'bg-orange-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min((student.stats.totalSks / 24) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-end">
                        <div className="hidden sm:flex flex-wrap items-center gap-2">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full whitespace-nowrap">{student.stats?.total || 0} Mata Kuliah</span>
                          {student.stats?.pending > 0 && (
                            <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-full whitespace-nowrap">{student.stats.pending} Pending</span>
                          )}
                          {student.stats?.approved > 0 && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap">{student.stats.approved} Disetujui</span>
                          )}
                        </div>
                        
                        {/* Quick Action: Approve All for this student */}
                        {student.stats.pending > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const pendingIds = student.enrollments
                                .filter(en => en.status === 'PENDING')
                                .map(en => en.id);
                              if (pendingIds.length > 0) {
                                bulkUpdateEnrollmentStatus({
                                  enrollmentIds: pendingIds,
                                  status: 'APPROVED'
                                }).then(() => {
                                  toast.success(`Berhasil menyetujui ${pendingIds.length} mata kuliah ${student.name}`);
                                  fetchStudents();
                                }).catch(err => {
                                  toast.error(err?.message || 'Gagal menyetujui KRS');
                                });
                              }
                            }}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-shadow shadow-sm"
                          >
                            Setujui Semua
                          </button>
                        )}

                        <div className="text-slate-400">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
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
                                <TableHead>Semester</TableHead>
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
                                    <TableCell className="text-sm text-slate-500">
                                      {enrollment.class?.course?.semester
                                        ? `Semester ${enrollment.class.course.semester}`
                                        : '-'}
                                    </TableCell>
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
    </div>
  );
};

export default DosenAdvisoryPage;
