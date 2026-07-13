import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export const TransitionReadinessStatus = ({
  readinessLoading,
  readinessError,
  readinessData,
}) => {
  if (readinessLoading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <Loader2 size={14} className="animate-spin text-slate-500" />
        <p className="text-xs text-slate-600">Memeriksa kesiapan nilai...</p>
      </div>
    );
  }

  if (readinessError) {
    return (
      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
        <p className="text-xs text-red-700">{readinessError}</p>
      </div>
    );
  }

  if (!readinessData) return null;

  return (
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
  );
};
