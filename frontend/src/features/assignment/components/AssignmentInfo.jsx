import { FileText, Calendar, Clock, AlertTriangle } from 'lucide-react';
import MarkdownPreview from '@/shared/components/markdown/MarkdownPreview';

export const AssignmentInfo = ({ assignment, deadlineStatus, formatDate }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Dibuat: {formatDate(assignment.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Deadline Status Badge */}
          {deadlineStatus && (
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${
                deadlineStatus.type === 'late'
                  ? 'bg-red-50 text-red-700 border-red-100'
                  : deadlineStatus.type === 'urgent'
                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                  : deadlineStatus.type === 'soon'
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                  : 'bg-green-50 text-green-700 border-green-100'
              }`}
            >
              {deadlineStatus.type === 'late' ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              {deadlineStatus.text}
            </div>
          )}
        </div>

        {/* Due Date Banner */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg text-gray-700">
          <Calendar className="w-5 h-5 text-gray-400" />
          <span className="font-medium">Tenggat Waktu:</span>
          <span>{formatDate(assignment.dueDate)}</span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Instruksi Tugas</h3>
        <div className="prose max-w-none text-gray-600">
          {assignment.description ? (
            <MarkdownPreview content={assignment.description} />
          ) : (
            <p className="italic text-gray-400">Tidak ada instruksi tambahan.</p>
          )}
        </div>
      </div>
    </div>
  );
};
