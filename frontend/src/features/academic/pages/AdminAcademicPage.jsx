import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Loader2, AlertCircle, Calendar, Plus,
  ChevronRight, Trash2, ArrowRight, X, CheckCircle,
} from 'lucide-react';
import {
  useSemesters,
  useClosingReadiness,
  useCreateSemester,
  useUpdateSemesterStatus,
  useDeleteSemester
} from '../hooks/useAcademic';
import DashboardJumbotron from '@/components/shared/DashboardJumbotron';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

// ============================================================
// Admin Academic Semester Management Page
// Simplified lifecycle: DRAFT → OPEN → CLOSED
// OPEN automatically acts as the active semester (only one at a time).
// ============================================================

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-700', order: 0 },
  OPEN: { label: 'Open', color: 'bg-emerald-100 text-emerald-700', order: 1 },
  CLOSED: { label: 'Closed', color: 'bg-violet-100 text-violet-700', order: 2 },
};

// Allowed forward-only transitions
const ALLOWED_TRANSITIONS = {
  DRAFT: ['OPEN'],
  OPEN: ['CLOSED'],
  CLOSED: [],
};

const AdminAcademicPage = () => {
  const { data: semesters = [], isLoading: loading, error: fetchError, refetch: fetchData } = useSemesters();
  const error = fetchError?.message;

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    academicYear: '',
    semesterType: 'GANJIL',
    maxSks: 24,
  });

  const { mutateAsync: createSem, isPending: creating } = useCreateSemester();
  const { mutateAsync: updateStatus } = useUpdateSemesterStatus();
  const { mutateAsync: deleteSem } = useDeleteSemester();

  const [processingId, setProcessingId] = useState(null);

  // Transition confirmation modal
  const [transitionModal, setTransitionModal] = useState(null);
  const [transitionSubmitting, setTransitionSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Use the hook for readiness data, enabled only when targetStatus === 'CLOSED'
  const readinessQueryId = transitionModal?.toStatus === 'CLOSED' ? transitionModal?.semesterId : null;
  const { data: readinessData, isLoading: readinessLoading, error: readinessErrorData, refetch: refetchReadiness } = useClosingReadiness(readinessQueryId);
  const readinessError = readinessErrorData?.message;

  const showToast = (msg, type = 'success') => {
    type === 'error' ? toast.error(msg) : toast.success(msg);
  };

  // Create semester
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.academicYear) return;
    try {
      await createSem(createForm);
      setShowCreate(false);
      setCreateForm({ academicYear: '', semesterType: 'GANJIL', maxSks: 24 });
    } catch {
      // Error is handled in hook onError
    }
  };

  // Open transition confirmation modal
  const openTransitionModal = (sem, targetStatus) => {
    const allowed = ALLOWED_TRANSITIONS[sem.status] || [];
    if (!allowed.includes(targetStatus)) return;

    const semLabel = `${sem.semesterType === 'GANJIL' ? 'Ganjil' : 'Genap'} ${sem.academicYear}`;
    setTransitionModal({
      semesterId: sem.id,
      semesterLabel: semLabel,
      fromStatus: sem.status,
      toStatus: targetStatus,
    });
  };

  // Execute status transition
  const handleTransitionConfirm = async () => {
    if (!transitionModal) return;
    const { semesterId, toStatus } = transitionModal;

    setTransitionSubmitting(true);
    try {
      await updateStatus({ id: semesterId, status: toStatus });
      setTransitionModal(null);
    } catch (err) {
      const responseData = err?.response?.data;
      if (responseData?.code === 'GRADE_COMPLETION_REQUIRED') {
        showToast(responseData.message, 'error');
        // Refresh readiness data
        refetchReadiness();
      } else {
        showToast(responseData?.message || err?.message || 'Gagal mengubah status', 'error');
      }
    } finally {
      setTransitionSubmitting(false);
    }
  };

  // Delete (only DRAFT)
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setProcessingId(deleteConfirm.id);
    try {
      await deleteSem(deleteConfirm.id);
    } catch {
      // handled by hook
    } finally {
      setProcessingId(null);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardJumbotron
        icon={Calendar}
        title="Konfigurasi Akademik"
        subtitle="Kelola tahun akademik, semester, dan siklus akademik"
      />

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
          <strong>Draft</strong>: Persiapan kelas &rarr; <strong>Open</strong>: KRS, perkuliahan, penilaian (otomatis aktif) &rarr;{' '}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Maks SKS</label>
              <input
                type="number"
                min={1}
                max={36}
                value={createForm.maxSks}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, maxSks: parseInt(e.target.value) || 24 }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">Batas SKS per mahasiswa</p>
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
          <AlertCircle size={32} className="text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Belum ada semester</p>
          <p className="text-sm text-slate-400 mt-1">
            Buat semester pertama untuk memulai konfigurasi akademik
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {semesters.map((sem) => {
            const cfg = STATUS_CONFIG[sem.status] || STATUS_CONFIG.DRAFT;
            const isProcessing = processingId === sem.id;
            const nextStatuses = ALLOWED_TRANSITIONS[sem.status] || [];

            return (
              <div
                key={sem.id}
                className={`bg-white rounded-xl border overflow-hidden ${sem.isActive ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-slate-200'
                  }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Semester Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Calendar size={22} className="text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {sem.semesterType === 'GANJIL' ? 'Ganjil' : 'Genap'}{' '}
                          {sem.academicYear}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          {sem.isActive && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              Aktif
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            {sem._count?.classes || 0} kelas &bull;{' '}
                            {sem._count?.finalGrades || 0} nilai &bull;{' '}
                            Maks {sem.maxSks ?? 24} SKS
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Forward transition button */}
                      {nextStatuses.map((target) => (
                        <button
                          key={target}
                          onClick={() => openTransitionModal(sem, target)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg disabled:opacity-50 transition"
                        >
                          {isProcessing ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <ChevronRight size={12} />
                          )}
                          {target}
                        </button>
                      ))}

                      {/* Delete button — only for DRAFT with no dependents */}
                      {sem.status === 'DRAFT' &&
                        (sem._count?.classes || 0) === 0 &&
                        (sem._count?.finalGrades || 0) === 0 && (
                          <button
                            onClick={() => setDeleteConfirm(sem)}
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
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-slate-900 truncate">
                  Konfirmasi Perubahan Status
                </h3>
                <p className="text-sm text-slate-500 mt-1 truncate">
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

            {/* OPEN warning */}
            {transitionModal.toStatus === 'OPEN' && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Semester ini akan otomatis menjadi <strong>semester aktif</strong>.
                  Jika ada semester lain yang sedang OPEN, transisi ini akan ditolak.
                </p>
              </div>
            )}

            {/* CLOSED warnings & readiness check */}
            {transitionModal.toStatus === 'CLOSED' && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">
                    <strong>Perhatian:</strong> Mengubah status ke CLOSED bersifat permanen.
                    Pastikan semua nilai sudah benar.
                  </p>
                </div>

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
                                className="flex items-start justify-between gap-2 bg-white/80 rounded px-2 py-1.5 text-xs"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="truncate">
                                    <span className="font-mono text-slate-500">{cls.courseCode}</span>
                                    <span className="text-slate-400 mx-1">&middot;</span>
                                    <span className="text-slate-700">{cls.courseTitle}</span>
                                    <span className="text-slate-400 mx-1">({cls.section})</span>
                                  </div>
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

      <ConfirmDialog
        open={Boolean(deleteConfirm)}
        title="Hapus semester ini?"
        description="Tindakan ini hanya tersedia untuk semester berstatus Draft."
        confirmText="Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={processingId === deleteConfirm?.id}
      />
    </div>
  );
};

export default AdminAcademicPage;
