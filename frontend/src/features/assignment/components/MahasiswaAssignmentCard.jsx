import { Link } from 'react-router-dom';
import { Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export const MahasiswaAssignmentCard = ({
  assignment,
  classId,
  formatDate,
  getTimeRemaining,
}) => {
  const isGraded = assignment.status === 'graded';
  const isSubmitted = assignment.isSubmitted;
  const isLate = new Date(assignment.dueDate) < new Date() && !isSubmitted;
  const timeRemaining = getTimeRemaining(assignment.dueDate);

  return (
    <Link
      to={`/mahasiswa/classes/${classId}/assignments/${assignment.id}`}
      className={`block bg-white rounded-xl p-5 shadow-sm border transition-all hover:shadow-md hover:-translate-y-0.5 ${
        isLate
          ? 'border-red-200 hover:border-red-300'
          : isSubmitted
          ? 'border-green-200 hover:border-green-300'
          : 'border-gray-100 hover:border-primary/50'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="font-semibold text-gray-800 truncate">{assignment.title}</h2>
            {/* Status Badge */}
            {isSubmitted ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3" />
                {isGraded ? 'Sudah dinilai' : 'Dikumpulkan'}
              </span>
            ) : isLate ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                <AlertTriangle className="w-3 h-3" />
                Terlambat
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                <Clock className="w-3 h-3" />
                Belum dikumpulkan
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Deadline: {formatDate(assignment.dueDate)}</span>
            </div>
            {!isSubmitted && timeRemaining && (
              <div className="flex items-center gap-1 text-orange-600">
                <Clock className="w-4 h-4" />
                <span>{timeRemaining}</span>
              </div>
            )}
          </div>

          {/* Nilai jika sudah dikumpulkan dan dinilai */}
          {isSubmitted && assignment.grade !== null && assignment.grade !== undefined && (
            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-600">Nilai:</span>
              <span className="font-bold text-blue-700">{assignment.grade}</span>
            </div>
          )}
        </div>

        {/* Arrow indicator */}
        <div className="text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
};
