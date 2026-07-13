import { Loader2, AlertCircle, X, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { TransitionReadinessStatus } from './TransitionReadinessStatus';


export const TransitionConfirmModal = ({
  transitionModal,
  setTransitionModal,
  transitionSubmitting,
  handleTransitionConfirm,
  STATUS_CONFIG,
  readinessLoading,
  readinessError,
  readinessData,
}) => {
  if (!transitionModal) return null;

  return (
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

            <TransitionReadinessStatus 
              readinessLoading={readinessLoading}
              readinessError={readinessError}
              readinessData={readinessData}
            />
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
  );
};
