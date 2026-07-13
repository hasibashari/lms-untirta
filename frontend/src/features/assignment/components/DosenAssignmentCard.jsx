import { Calendar, Clock, Users, Edit, Trash2, AlertCircle, FileText } from 'lucide-react';

export const DosenAssignmentCard = ({
  assignment,
  isDeadlinePassed,
  isDeadlineNear,
  formatDate,
  getRelativeTime,
  onViewSubmissions,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="group bg-card rounded-xl border border-border shadow-sm hover:border-primary/50 hover:shadow-lg transition-all overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Assignment Info */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="text-lg font-semibold text-slate-900 mb-2 truncate">
              {assignment.title}
            </h3>

            {/* Description Preview */}
            {assignment.description && (
              <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                {assignment.description.replace(/[#*`]/g, '').substring(0, 150)}
                {assignment.description.length > 150 ? '...' : ''}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {/* Deadline */}
              <div
                className={`flex items-center gap-1.5 ${
                  isDeadlinePassed
                    ? 'text-red-600'
                    : isDeadlineNear
                    ? 'text-amber-600'
                    : 'text-slate-500'
                }`}
              >
                <Calendar size={14} />
                <span>{formatDate(assignment.dueDate)}</span>
              </div>

              {/* Time Remaining */}
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                  isDeadlinePassed
                    ? 'bg-red-100 text-red-700'
                    : isDeadlineNear
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                <Clock size={12} />
                {getRelativeTime(assignment.dueDate)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="shrink-0 flex items-center gap-2">
            {/* View Submissions Button */}
            <button
              onClick={onViewSubmissions}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
              title="Lihat Submission"
            >
              <Users size={16} />
              <span className="hidden sm:inline">Submission</span>
            </button>

            {/* Edit Button */}
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
              title="Edit Tugas"
            >
              <Edit size={16} />
              <span className="hidden sm:inline">Edit</span>
            </button>

            {/* Delete Button */}
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
              title="Hapus Tugas"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Hapus</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div
        className={`px-6 py-3 border-t ${
          isDeadlinePassed
            ? 'bg-red-50 border-red-100'
            : isDeadlineNear
            ? 'bg-amber-50 border-amber-100'
            : 'bg-slate-50 border-slate-100'
        }`}
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            {isDeadlinePassed ? (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <AlertCircle size={14} />
                Deadline telah lewat
              </span>
            ) : isDeadlineNear ? (
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <Clock size={14} />
                Deadline segera
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <FileText size={14} />
                Tugas aktif
              </span>
            )}
          </div>

          <span className="text-slate-500">
            Dibuat:{' '}
            {assignment.createdAt
              ? new Date(assignment.createdAt).toLocaleDateString('id-ID')
              : '-'}
          </span>
        </div>
      </div>
    </div>
  );
};
