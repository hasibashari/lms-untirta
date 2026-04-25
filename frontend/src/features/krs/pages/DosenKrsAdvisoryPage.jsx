import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Loader2, AlertCircle, XCircle, Users,
  ChevronDown, ChevronUp, UserCheck, ShieldOff,
} from 'lucide-react';
import {
  getAdvisoryStudents,
  updateEnrollmentStatus,
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
      .then(res => setSemesters(res.data?.data || []))
      .catch(() => setSemesters([]));
  }, []);

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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <SemesterFilter
          semesters={semesters}
          academicSemesterId={academicSemesterId}
          onAcademicSemesterChange={(val) => setAcademicSemesterId(val === 'all' ? null : val)}
        />
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-lg font-bold text-slate-800">{advisoryData.summary?.totalStudents || 0}</p>
                <p className="text-xs text-slate-500">Total Mahasiswa</p>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-lg font-bold text-green-600">{advisoryData.summary?.totalApproved || 0}</p>
                <p className="text-xs text-slate-500">KRS Disetujui</p>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center">
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
                        {student.stats?.approved > 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{student.stats.approved} Disetujui</span>
                        )}
                        {student.stats?.rejected > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">{student.stats.rejected} Ditolak</span>
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
