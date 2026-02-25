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
} from '../../academic/academicService';
import DashboardJumbotron from '@/components/shared/DashboardJumbotron';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

// ============================================================
// Admin Academic Semester Management Page
// Full state machine with rollback support and audit trail
// ============================================================

const STATUS_CONFIG = {
  PLANNING: { label: 'Planning', color: 'bg-slate-100 text-slate-700', order: 0 },
  ENROLLMENT: { label: 'Enrollment', color: 'bg-blue-100 text-blue-700', order: 1 },
  ONGOING: { label: 'Ongoing', color: 'bg-emerald-100 text-emerald-700', order: 2 },
  GRADING: { label: 'Grading', color: 'bg-amber-100 text-amber-700', order: 3 },
  COMPLETED: { label: 'Completed', color: 'bg-violet-100 text-violet-700', order: 4 },
};

// Client-side mirror of the backend transition rules
const TRANSITION_RULES = {
  PLANNING: {
    ENROLLMENT: { direction: 'FORWARD', reasonRequired: false },
  },
  ENROLLMENT: {
    PLANNING: { direction: 'ROLLBACK', reasonRequired: true },
    ONGOING: { direction: 'FORWARD', reasonRequired: false },
  },
  ONGOING: {
    ENROLLMENT: { direction: 'ROLLBACK', reasonRequired: true },
    GRADING: { direction: 'FORWARD', reasonRequired: false },
  },
  GRADING: {
    ONGOING: { direction: 'ROLLBACK', reasonRequired: true },
    COMPLETED: { direction: 'FORWARD', reasonRequired: true },
  },
  COMPLETED: {},
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
      fetchData();
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Gagal mengubah status', 'error');
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
          <strong>Planning</strong>: Persiapan kelas &rarr; <strong>Enrollment</strong>: KRS dibuka &rarr;{' '}
          <strong>Ongoing</strong>: Perkuliahan &rarr; <strong>Grading</strong>: Input nilai &rarr;{' '}
          <strong>Completed</strong>: Nilai visible ke mahasiswa.{' '}
          <span className="text-amber-600 font-medium">Rollback tersedia (kecuali dari Completed).</span>
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
            const cfg = STATUS_CONFIG[sem.status] || STATUS_CONFIG.PLANNING;
            const isProcessing = processingId === sem.id;
            const transitions = getAllowedTransitions(sem.status);
            const forwardTransition = transitions.find(t => t.direction === 'FORWARD');
            const rollbackTransition = transitions.find(t => t.direction === 'ROLLBACK');

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
                      {/* Rollback button */}
                      {rollbackTransition && (
                        <button
                          onClick={() => openTransitionModal(sem, rollbackTransition.target)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg disabled:opacity-50 transition"
                          title={`Rollback ke ${rollbackTransition.target}`}
                        >
                          {isProcessing ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <ChevronLeft size={12} />
                          )}
                          {rollbackTransition.target}
                        </button>
                      )}

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
                      {sem.status === 'PLANNING' &&
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
                  {transitionModal.direction === 'ROLLBACK'
                    ? 'Konfirmasi Rollback Status'
                    : 'Konfirmasi Perubahan Status'}
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
              {transitionModal.direction === 'ROLLBACK' ? (
                <ChevronLeft size={20} className="text-amber-500" />
              ) : (
                <ChevronRight size={20} className="text-emerald-500" />
              )}
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_CONFIG[transitionModal.toStatus]?.color}`}>
                {STATUS_CONFIG[transitionModal.toStatus]?.label}
              </span>
            </div>

            {/* Direction badge */}
            <div className="text-center">
              {transitionModal.direction === 'ROLLBACK' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-200">
                  <ChevronLeft size={12} /> Rollback
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
                  <ChevronRight size={12} /> Forward
                </span>
              )}
            </div>

            {/* Warning for critical transitions */}
            {transitionModal.toStatus === 'COMPLETED' && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">
                  <strong>Perhatian:</strong> Mengubah status ke COMPLETED akan memfinalisasi
                  semua nilai DRAFT. Tindakan ini tidak dapat di-rollback.
                </p>
              </div>
            )}

            {transitionModal.direction === 'ROLLBACK' && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  <strong>Rollback:</strong> Status akan dikembalikan ke tahap sebelumnya.
                  Side effect terkait akan di-reverse secara otomatis.
                </p>
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
                disabled={transitionSubmitting || (transitionModal.reasonRequired && !transitionReason.trim())}
                className={
                  transitionModal.direction === 'ROLLBACK'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50'
                    : transitionModal.toStatus === 'COMPLETED'
                      ? 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50'
                      : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
                }
              >
                {transitionSubmitting && <Loader2 size={14} className="animate-spin" />}
                {transitionModal.direction === 'ROLLBACK' ? 'Rollback' : 'Konfirmasi'}
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
