import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Loader2, AlertCircle, ArrowLeft,
  Save, Lock, Users, Award,
} from 'lucide-react';
import {
  getClassStudentsForGrading,
  inputGrade,
  bulkInputGrades,
  finalizeGrades,
} from '../../grade/gradeService';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

// ============================================================
// Dosen: Final Grade Input Page
// Allows lecturers to assign final letter grades per student
// ============================================================

const LETTER_GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'E'];

const GRADE_COLORS = {
  'A': 'text-green-700 bg-green-50',
  'A-': 'text-green-600 bg-green-50',
  'B+': 'text-blue-700 bg-blue-50',
  'B': 'text-blue-600 bg-blue-50',
  'B-': 'text-blue-500 bg-blue-50',
  'C+': 'text-amber-700 bg-amber-50',
  'C': 'text-amber-600 bg-amber-50',
  'D': 'text-orange-600 bg-orange-50',
  'E': 'text-red-600 bg-red-50',
};

const DosenGradingPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Track grade edits (studentId -> letterGrade)
  const [gradeEdits, setGradeEdits] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const showToast = (msg, type = 'success') => {
    type === 'error' ? toast.error(msg) : toast.success(msg);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getClassStudentsForGrading(classId);
      setData(res.data);

      // Initialize grade edits from existing grades
      const edits = {};
      (res.data?.students || []).forEach(({ student, grade }) => {
        if (grade) {
          edits[student.id] = grade.letterGrade;
        }
      });
      setGradeEdits(edits);
    } catch (err) {
      setError(err?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle grade change
  const handleGradeChange = (studentId, letterGrade) => {
    setGradeEdits((prev) => ({ ...prev, [studentId]: letterGrade }));
  };

  // Save single grade
  const handleSaveSingle = async (studentId) => {
    const grade = gradeEdits[studentId];
    if (!grade) return;

    setSavingId(studentId);
    try {
      await inputGrade(classId, { studentId, letterGrade: grade });
      showToast('Nilai berhasil disimpan');
      fetchData();
    } catch (err) {
      showToast(err?.message || 'Gagal menyimpan nilai', 'error');
    } finally {
      setSavingId(null);
    }
  };

  // Save all grades
  const handleSaveAll = async () => {
    const grades = Object.entries(gradeEdits)
      .filter(([, grade]) => grade)
      .map(([studentId, letterGrade]) => ({ studentId, letterGrade }));

    if (grades.length === 0) return;

    setSavingAll(true);
    try {
      await bulkInputGrades(classId, grades);
      showToast(`${grades.length} nilai berhasil disimpan`);
      fetchData();
    } catch (err) {
      showToast(err?.message || 'Gagal menyimpan nilai', 'error');
    } finally {
      setSavingAll(false);
    }
  };

  // Finalize all grades
  const handleFinalize = async () => {
    if (
      !confirm(
        'Setelah difinalisasi, nilai TIDAK DAPAT diubah lagi dan akan terlihat oleh mahasiswa setelah semester berakhir. Lanjutkan?'
      )
    ) {
      return;
    }

    setFinalizing(true);
    try {
      const res = await finalizeGrades(classId);
      showToast(res.data?.message || 'Nilai berhasil difinalisasi');
      fetchData();
    } catch (err) {
      showToast(err?.message || 'Gagal memfinalisasi nilai', 'error');
    } finally {
      setFinalizing(false);
    }
  };

  // Check which grades have unsaved changes
  const unsavedChanges = useMemo(() => {
    if (!data?.students) return [];
    return data.students.filter(({ student, grade }) => {
      const editGrade = gradeEdits[student.id];
      if (!editGrade) return false;
      if (!grade) return true; // new grade
      return grade.letterGrade !== editGrade;
    });
  }, [data, gradeEdits]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-slate-500">Memuat data penilaian...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} /> Kembali
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { class: classInfo, students, summary, semesterStatus } = data;
  const allFinalized = summary.draft === 0 && summary.finalized > 0;
  const canEdit = !allFinalized && (!semesterStatus || semesterStatus === 'OPEN');

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft size={16} /> Kembali
      </button>

      {/* Class Header */}
      <div className="bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-2xl p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        </div>
        <div className="relative z-10">
          <p className="text-blue-100/80 text-sm mb-1">
            {classInfo.course.code} — Kelas {classInfo.section}
          </p>
          <h1 className="text-xl lg:text-2xl font-bold">{classInfo.course.title}</h1>
          <p className="text-blue-100/60 text-sm mt-2">
            {classInfo.academicSemester?.academicYear} — {classInfo.academicSemester?.semesterType} | {classInfo.course.sks} SKS
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-blue-500" />
            <span className="text-xs text-slate-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{summary.totalStudents}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Award size={16} className="text-emerald-500" />
            <span className="text-xs text-slate-500">Dinilai</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{summary.graded}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Save size={16} className="text-amber-500" />
            <span className="text-xs text-slate-500">Draft</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{summary.draft}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Lock size={16} className="text-violet-500" />
            <span className="text-xs text-slate-500">Final</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{summary.finalized}</p>
        </div>
      </div>

      {/* Semester status warning */}
      {semesterStatus && semesterStatus !== 'OPEN' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            Semester saat ini berstatus <strong>{semesterStatus}</strong>. Input nilai hanya diperbolehkan saat status{' '}
            <strong>OPEN</strong>.
          </p>
        </div>
      )}

      {/* Finalized status */}
      {allFinalized && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <Lock size={18} className="text-green-600 shrink-0" />
          <p className="text-sm text-green-700">
            Semua nilai sudah difinalisasi. Nilai akan terlihat oleh mahasiswa setelah semester dinyatakan CLOSED oleh admin.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSaveAll}
            disabled={savingAll || unsavedChanges.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {savingAll ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Simpan Semua {unsavedChanges.length > 0 && `(${unsavedChanges.length})`}
          </button>
          {summary.draft > 0 && (
            <button
              onClick={handleFinalize}
              disabled={finalizing}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {finalizing ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              Finalisasi Nilai ({summary.draft} draft)
            </button>
          )}
        </div>
      )}

      {/* Grade Table */}
      {students.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Users size={32} className="text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Belum ada mahasiswa terdaftar di kelas ini</p>
          <p className="text-sm text-slate-400 mt-1">
            Mahasiswa harus mendaftar melalui KRS dan disetujui
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Mobile */}
          <div className="lg:hidden divide-y divide-slate-100">
            {students.map(({ student, grade }, idx) => {
              const isFinalized = grade?.status === 'FINALIZED';
              const isSaving = savingId === student.id;
              const currentGrade = gradeEdits[student.id] || '';
              const hasUnsaved = grade?.letterGrade !== currentGrade && currentGrade;

              return (
                <div key={student.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-700 font-bold text-xs">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.email}</p>
                      </div>
                    </div>
                    {isFinalized && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        <Lock size={10} /> Final
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={currentGrade}
                      onChange={(e) => handleGradeChange(student.id, e.target.value)}
                      disabled={isFinalized || !canEdit}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">Pilih Nilai</option>
                      {LETTER_GRADES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    {canEdit && !isFinalized && (
                      <button
                        onClick={() => handleSaveSingle(student.id)}
                        disabled={isSaving || !currentGrade}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead>Mahasiswa</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-36 text-center">Nilai Akhir</TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                  <TableHead className="w-20 text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(({ student, grade }, idx) => {
                  const isFinalized = grade?.status === 'FINALIZED';
                  const isSaving = savingId === student.id;
                  const currentGrade = gradeEdits[student.id] || '';
                  const hasUnsaved =
                    grade?.letterGrade !== currentGrade && currentGrade;

                  return (
                    <TableRow
                      key={student.id}
                      className={`hover:bg-slate-50 ${hasUnsaved ? 'bg-blue-50/30' : ''}`}
                    >
                      <TableCell className="text-slate-500 text-sm">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <span className="text-blue-700 font-bold text-xs">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-slate-900">{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{student.email}</TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <select
                            value={currentGrade}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            disabled={isFinalized || !canEdit}
                            className={`w-24 px-2 py-1.5 border rounded-lg text-sm font-medium text-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 ${currentGrade
                              ? GRADE_COLORS[currentGrade] || 'border-slate-200'
                              : 'border-slate-200'
                              }`}
                          >
                            <option value="">—</option>
                            {LETTER_GRADES.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {isFinalized ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                            <Lock size={10} /> Final
                          </span>
                        ) : grade ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                            Draft
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {canEdit && !isFinalized && (
                          <button
                            onClick={() => handleSaveSingle(student.id)}
                            disabled={isSaving || !currentGrade}
                            title="Simpan nilai"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-30 transition"
                          >
                            {isSaving ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Save size={16} />
                            )}
                          </button>
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
    </div>
  );
};

export default DosenGradingPage;
