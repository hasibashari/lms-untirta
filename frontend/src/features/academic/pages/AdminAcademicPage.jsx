import { useEffect, useState, useCallback } from 'react';
import {
  Loader2, AlertCircle, CheckCircle, X, Calendar, Plus,
  ChevronRight, ChevronLeft, Trash2, Star, ArrowRight, History, Clock,
} from 'lucide-react';
import {
  getAllSemesters,
  createSemester,
  updateSemesterStatus,
  setActiveSemester,
  deleteSemester,
  getSemesterStatusLogs,
  getClosingReadiness,
} from '../../academic/academicService';
import DashboardJumbotron from '@/components/shared/DashboardJumbotron';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

// ============================================================
// Admin Academic Semester Management Page
// Simplified lifecycle: DRAFT → OPEN → CLOSED
// ============================================================

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-700', order: 0 },
  OPEN: { label: 'Open', color: 'bg-emerald-100 text-emerald-700', order: 1 },
  CLOSED: { label: 'Closed', color: 'bg-violet-100 text-violet-700', order: 2 },
};

// Client-side mirror of the backend transition rules
const TRANSITION_RULES = {
  DRAFT: {
    OPEN: { direction: 'FORWARD', reasonRequired: false },
  },
  OPEN: {
    CLOSED: { direction: 'FORWARD', reasonRequired: true },
  },
  CLOSED: {},
};

const getAllowedTransitions = (status) => {
  const rules = TRANSITION_RULES[status] || {};
  return Object.entries(rules).map(([target, rule]) => ({
    target,
    ...rule,
  }));
};

const AdminAcademicPage = () => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    academicYear: '',
    semesterType: 'GANJIL',
  });
  const [creating, setCreating] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Transition confirmation modal
  const [transitionModal, setTransitionModal] = useState(null);
  // { semesterId, semesterLabel, fromStatus, toStatus, direction, reasonRequired }
  const [transitionReason, setTransitionReason] = useState('');
  const [transitionSubmitting, setTransitionSubmitting] = useState(false);

  // Closing readiness pre-flight check
  const [readinessData, setReadinessData] = useState(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [readinessError, setReadinessError] = useState(null);

  // Audit log viewer
  const [logModal, setLogModal] = useState(null); // { semesterId, semesterLabel }
  const [statusLogs, setStatusLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllSemesters();
      setSemesters(res.data || []);
    } catch (err) {
      setError(err?.message || 'Gagal memuat data semester');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create semester
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.academicYear) return;
    setCreating(true);
    try {
      await createSemester(createForm);
      showToast(`Semester ${createForm.semesterType} ${createForm.academicYear} berhasil dibuat`);
      setShowCreate(false);
      setCreateForm({ academicYear: '', semesterType: 'GANJIL' });
      fetchData();
    } catch (err) {
      showToast(err?.message || 'Gagal membuat semester', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Open transition confirmation modal
  const openTransitionModal = (sem, targetStatus) => {
    const rule = TRANSITION_RULES[sem.status]?.[targetStatus];
    if (!rule) return;

    const semLabel = `${sem.semesterType === 'GANJIL' ? 'Ganjil' : 'Genap'} ${sem.academicYear}`;
    setTransitionModal({
      semesterId: sem.id,
      semesterLabel: semLabel,
      fromStatus: sem.status,
      toStatus: targetStatus,
      direction: rule.direction,
      reasonRequired: rule.reasonRequired,
    });
    setTransitionReason('');
    setReadinessData(null);
    setReadinessError(null);

    // Pre-flight: fetch closing readiness when targeting CLOSED
    if (targetStatus === 'CLOSED') {
      setReadinessLoading(true);
      getClosingReadiness(sem.id)
        .then((res) => {
          setReadinessData(res.data || res);
        })
        .catch((err) => {
          setReadinessError(err?.response?.data?.message || err?.message || 'Gagal memuat data kesiapan');
        })
        .finally(() => {
          setReadinessLoading(false);
        });
    }
  };

  // Execute status transition
  const handleTransitionConfirm = async () => {
    if (!transitionModal) return;
    const { semesterId, toStatus, reasonRequired } = transitionModal;

    if (reasonRequired && !transitionReason.trim()) {
      showToast('Alasan wajib diisi untuk transisi ini', 'error');
      return;
    }

    setTransitionSubmitting(true);
    try {
      await updateSemesterStatus(semesterId, toStatus, transitionReason.trim() || null);
      showToast(`Status semester berhasil diubah ke ${toStatus}`);
      setTransitionModal(null);
      setTransitionReason('');
      setReadinessData(null);
      fetchData();
    } catch (err) {
      // Handle structured GRADE_COMPLETION_REQUIRED error from backend
      const responseData = err?.response?.data;
      if (responseData?.code === 'GRADE_COMPLETION_REQUIRED') {
        showToast(responseData.message, 'error');
        // Refresh readiness data to show updated state
        if (transitionModal?.semesterId) {
          setReadinessLoading(true);
          getCompletionReadiness(transitionModal.semesterId)
            .then((res) => setReadinessData(res.data || res))
            .catch(() => { })
            .finally(() => setReadinessLoading(false));
        }
      } else {
        showToast(responseData?.message || err?.message || 'Gagal mengubah status', 'error');
      }
    } finally {
      setTransitionSubmitting(false);
    }
  };

  // Set active
  const handleSetActive = async (id) => {
    setProcessingId(id);
    try {
      await setActiveSemester(id);
      showToast('Semester aktif berhasil diubah');
      fetchData();
    } catch (err) {
      showToast(err?.message || 'Gagal mengatur semester aktif', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus semester ini?')) return;
    setProcessingId(id);
    try {
      await deleteSemester(id);
      showToast('Semester berhasil dihapus');
      fetchData();
    } catch (err) {
      showToast(err?.message || 'Gagal menghapus semester', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Open audit log modal
  const openLogModal = async (sem) => {
    const semLabel = `${sem.semesterType === 'GANJIL' ? 'Ganjil' : 'Genap'} ${sem.academicYear}`;
    setLogModal({ semesterId: sem.id, semesterLabel: semLabel });
    setLogsLoading(true);
    try {
      const res = await getSemesterStatusLogs(sem.id);
      setStatusLogs(res.data || []);
    } catch {
      setStatusLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardJumbotron
        icon={Calendar}
        title="Konfigurasi Akademik"
        subtitle="Kelola tahun akademik, semester, dan siklus akademik"
      />

      {/* Toast */}
      {toast && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border animate-in slide-in-from-top-2 ${toast.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-green-50 border-green-200 text-green-700'
            }`}
        >
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span className="flex-1 text-sm">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="hover:opacity-70">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Status Flow Guide */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Alur Status Semester</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {Object.entries(STATUS_CONFIG).map(([key, cfg], idx) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
                {cfg.label}
              </span>
              {idx < Object.keys(STATUS_CONFIG).length - 1 && (
                <ArrowRight size={14} className="text-slate-400" />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          <strong>Draft</strong>: Persiapan kelas &rarr; <strong>Open</strong>: KRS, perkuliahan, penilaian &rarr;{' '}
          <strong>Closed</strong>: Semester selesai, nilai visible ke mahasiswa.
        </p>
      </div>

      {/* Create Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus size={16} />
          Tambah Semester
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
        >
          <h3 className="font-semibold text-slate-900">Buat Semester Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Tahun Akademik</label>
              <input
                type="text"
                placeholder="2025/2026"
                value={createForm.academicYear}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, academicYear: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-slate-400 mt-1">Format: YYYY/YYYY</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Tipe Semester</label>
              <select
                value={createForm.semesterType}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, semesterType: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="GANJIL">Ganjil</option>
                <option value="GENAP">Genap</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : null}
              Buat Semester
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCreate(false)}
            >
              Batal
            </Button>
          </div>
        </form>
      )}

      {/* Semester List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-slate-500">Memuat data semester...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={fetchData} className="mt-3 text-sm text-blue-600 hover:underline">
            Coba lagi
          </button>
        </div>
      ) : semesters.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Calendar size={32} className="text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Belum ada semester akademik</p>
          <p className="text-sm text-slate-400 mt-1">
            Buat semester pertama untuk memulai konfigurasi akademik
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {semesters.map((sem) => {
            const cfg = STATUS_CONFIG[sem.status] || STATUS_CONFIG.DRAFT;
            const isProcessing = processingId === sem.id;
            const transitions = getAllowedTransitions(sem.status);
            const forwardTransition = transitions.find(t => t.direction === 'FORWARD');

            return (
              <div
                key={sem.id}
                className={`bg-white rounded-xl border overflow-hidden ${sem.isActive ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
                  }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Semester Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Calendar size={22} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {sem.semesterType === 'GANJIL' ? 'Ganjil' : 'Genap'}{' '}
                            {sem.academicYear}
                          </h3>
                          {sem.isActive && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              <Star size={10} /> Aktif
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            {sem._count?.classes || 0} kelas &bull;{' '}
                            {sem._count?.finalGrades || 0} nilai
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Set Active */}
                      {!sem.isActive && (
                        <button
                          onClick={() => handleSetActive(sem.id)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg disabled:opacity-50 transition"
                        >
                          {isProcessing ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Star size={12} />
                          )}
                          Set Aktif
                        </button>
                      )}

                      {/* Forward button */}
                      {forwardTransition && (
                        <button
                          onClick={() => openTransitionModal(sem, forwardTransition.target)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg disabled:opacity-50 transition"
                        >
                          {isProcessing ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <ChevronRight size={12} />
                          )}
                          {forwardTransition.target}
                        </button>
                      )}

                      {/* Audit log button */}
                      <button
                        onClick={() => openLogModal(sem)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
                        title="Riwayat perubahan status"
                      >
                        <History size={12} />
                        Log
                      </button>

                      {/* Delete button */}
                      {sem.status === 'DRAFT' &&
                        (sem._count?.classes || 0) === 0 &&
                        (sem._count?.finalGrades || 0) === 0 && (
                          <button
                            onClick={() => handleDelete(sem.id)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50 transition"
                          >
                            {isProcessing ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                            Hapus
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== Transition Confirmation Modal ==================== */}
      {transitionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !transitionSubmitting && setTransitionModal(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Konfirmasi Perubahan Status
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {transitionModal.semesterLabel}
                </p>
              </div>
              <button
                onClick={() => !transitionSubmitting && setTransitionModal(null)}
                className="p-1 hover:bg-slate-100 rounded-lg"
                disabled={transitionSubmitting}
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Transition visual */}
            <div className="flex items-center justify-center gap-3 py-3">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_CONFIG[transitionModal.fromStatus]?.color}`}>
                {STATUS_CONFIG[transitionModal.fromStatus]?.label}
              </span>
              <ChevronRight size={20} className="text-emerald-500" />
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_CONFIG[transitionModal.toStatus]?.color}`}>
                {STATUS_CONFIG[transitionModal.toStatus]?.label}
              </span>
            </div>

            {/* Direction badge */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
                <ChevronRight size={12} /> Forward
              </span>
            </div>

            {/* Warning for critical transitions */}
            {transitionModal.toStatus === 'CLOSED' && (
              <div className="space-y-3">
                {/* Static warning — always shown */}
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">
                    <strong>Perhatian:</strong> Mengubah status ke CLOSED bersifat permanen.
                    Pastikan semua nilai sudah benar.
                  </p>
                </div>

                {/* Pre-flight readiness check — dynamic */}
                {readinessLoading && (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <Loader2 size={14} className="animate-spin text-slate-500" />
                    <p className="text-xs text-slate-600">Memeriksa kesiapan nilai...</p>
                  </div>
                )}

                {readinessError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{readinessError}</p>
                  </div>
                )}

                {readinessData && !readinessLoading && (
                  <div className={`p-3 border rounded-lg space-y-3 ${readinessData.summary?.isReady
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                    }`}>
                    {/* Summary header */}
                    <div className="flex items-start gap-2">
                      {readinessData.summary?.isReady ? (
                        <CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                      )}
                      <div className="text-xs">
                        {readinessData.summary?.isReady ? (
                          <p className="text-green-700 font-medium">
                            Semua nilai sudah lengkap dan terfinalisasi.
                            Semester siap untuk ditutup.
                          </p>
                        ) : (
                          <p className="text-red-700 font-medium">
                            Semester belum siap ditutup.
                            {readinessData.summary?.totalMissing > 0 &&
                              ` ${readinessData.summary.totalMissing} nilai belum diinput.`}
                            {readinessData.summary?.totalDraft > 0 &&
                              ` ${readinessData.summary.totalDraft} nilai masih DRAFT.`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="bg-white/60 rounded-md p-2">
                        <p className="text-sm font-bold text-slate-800">
                          {readinessData.summary?.readyClasses || 0}/{readinessData.summary?.totalClasses || 0}
                        </p>
                        <p className="text-[10px] text-slate-500">Kelas Siap</p>
                      </div>
                      <div className="bg-white/60 rounded-md p-2">
                        <p className="text-sm font-bold text-green-700">
                          {readinessData.summary?.totalFinalized || 0}
                        </p>
                        <p className="text-[10px] text-slate-500">Finalized</p>
                      </div>
                      <div className="bg-white/60 rounded-md p-2">
                        <p className={`text-sm font-bold ${(readinessData.summary?.totalDraft || 0) > 0 ? 'text-amber-600' : 'text-slate-800'
                          }`}>
                          {readinessData.summary?.totalDraft || 0}
                        </p>
                        <p className="text-[10px] text-slate-500">Draft</p>
                      </div>
                      <div className="bg-white/60 rounded-md p-2">
                        <p className={`text-sm font-bold ${(readinessData.summary?.totalMissing || 0) > 0 ? 'text-red-600' : 'text-slate-800'
                          }`}>
                          {readinessData.summary?.totalMissing || 0}
                        </p>
                        <p className="text-[10px] text-slate-500">Belum Dinilai</p>
                      </div>
                    </div>

                    {/* Per-class breakdown — only show problematic classes */}
                    {!readinessData.summary?.isReady && readinessData.classes?.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Kelas bermasalah:</p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {readinessData.classes
                            .filter((c) => !c.isReady)
                            .map((cls) => (
                              <div
                                key={cls.classId}
                                className="flex items-center justify-between bg-white/80 rounded px-2 py-1.5 text-xs"
                              >
                                <div className="min-w-0">
                                  <span className="font-mono text-slate-500">{cls.courseCode}</span>
                                  <span className="text-slate-400 mx-1">&middot;</span>
                                  <span className="text-slate-700">{cls.courseTitle}</span>
                                  <span className="text-slate-400 mx-1">({cls.section})</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  {cls.missingGrades > 0 && (
                                    <span className="text-red-600 font-medium">{cls.missingGrades} missing</span>
                                  )}
                                  {cls.draftCount > 0 && (
                                    <span className="text-amber-600 font-medium">{cls.draftCount} draft</span>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}



            {/* Reason input */}
            {transitionModal.reasonRequired && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Alasan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Jelaskan alasan perubahan status ini..."
                  maxLength={500}
                  required
                />
                <p className="text-xs text-slate-400 mt-1">
                  {transitionReason.length}/500 karakter
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setTransitionModal(null)}
                disabled={transitionSubmitting}
              >
                Batal
              </Button>
              <Button
                onClick={handleTransitionConfirm}
                disabled={
                  transitionSubmitting ||
                  (transitionModal.reasonRequired && !transitionReason.trim()) ||
                  (transitionModal.toStatus === 'CLOSED' && readinessLoading) ||
                  (transitionModal.toStatus === 'CLOSED' && readinessData && !readinessData.summary?.isReady)
                }
                className={
                  transitionModal.toStatus === 'CLOSED'
                    ? 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50'
                    : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
                }
              >
                {transitionSubmitting && <Loader2 size={14} className="animate-spin" />}
                Konfirmasi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Audit Log Modal ==================== */}
      {logModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setLogModal(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <History size={18} /> Riwayat Status
                </h3>
                <p className="text-sm text-slate-500">{logModal.semesterLabel}</p>
              </div>
              <button
                onClick={() => setLogModal(null)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {logsLoading ? (
                <div className="text-center py-8">
                  <Loader2 size={24} className="animate-spin text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Memuat riwayat...</p>
                </div>
              ) : statusLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Clock size={24} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Belum ada riwayat perubahan status</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {statusLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg border text-sm ${log.direction === 'ROLLBACK'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[log.fromStatus]?.color}`}>
                          {STATUS_CONFIG[log.fromStatus]?.label}
                        </span>
                        {log.direction === 'ROLLBACK' ? (
                          <ChevronLeft size={14} className="text-amber-500" />
                        ) : (
                          <ChevronRight size={14} className="text-emerald-500" />
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[log.toStatus]?.color}`}>
                          {STATUS_CONFIG[log.toStatus]?.label}
                        </span>
                        <span className={`ml-auto px-1.5 py-0.5 rounded text-xs font-medium ${log.direction === 'ROLLBACK'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                          }`}>
                          {log.direction}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                        <span>{log.performer?.name || 'Unknown'}</span>
                        <span>&bull;</span>
                        <span>{formatDate(log.createdAt)}</span>
                      </div>
                      {log.reason && (
                        <p className="text-xs text-slate-600 mt-2 italic bg-white/60 rounded p-2">
                          &ldquo;{log.reason}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAcademicPage;
