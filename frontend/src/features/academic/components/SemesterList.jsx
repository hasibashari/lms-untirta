import { Loader2, Calendar, ChevronRight, Trash2 } from 'lucide-react';

export const SemesterList = ({
  semesters,
  STATUS_CONFIG,
  ALLOWED_TRANSITIONS,
  processingId,
  openTransitionModal,
  setDeleteConfirm,
}) => {
  return (
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
  );
};
