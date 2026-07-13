import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Loader2, AlertCircle, Calendar, Plus, ArrowRight,
} from 'lucide-react';
import {
  useSemesters,
  useClosingReadiness,
  useCreateSemester,
  useUpdateSemesterStatus,
  useDeleteSemester
} from '../hooks/useAcademic';
import DashboardJumbotron from '@/shared/components/layout/Jumbotron';
import { Button } from '@/shared/components/ui/button';
import ConfirmDialog from '@/shared/components/feedback/ConfirmDialog';
import { SemesterList } from '../components/SemesterList';
import { SemesterCreateForm } from '../components/SemesterCreateForm';
import { TransitionConfirmModal } from '../components/TransitionConfirmModal';

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
        <SemesterCreateForm
          createForm={createForm}
          setCreateForm={setCreateForm}
          handleCreate={handleCreate}
          creating={creating}
          setShowCreate={setShowCreate}
        />
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
        <SemesterList
          semesters={semesters}
          STATUS_CONFIG={STATUS_CONFIG}
          ALLOWED_TRANSITIONS={ALLOWED_TRANSITIONS}
          processingId={processingId}
          openTransitionModal={openTransitionModal}
          setDeleteConfirm={setDeleteConfirm}
        />
      )}

      {/* ==================== Transition Confirmation Modal ==================== */}
      <TransitionConfirmModal
        transitionModal={transitionModal}
        setTransitionModal={setTransitionModal}
        transitionSubmitting={transitionSubmitting}
        handleTransitionConfirm={handleTransitionConfirm}
        STATUS_CONFIG={STATUS_CONFIG}
        readinessLoading={readinessLoading}
        readinessError={readinessError}
        readinessData={readinessData}
      />

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
