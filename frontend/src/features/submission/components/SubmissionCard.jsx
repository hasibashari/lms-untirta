import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Star,
  MessageSquare,
  Save,
  Check,
  AlertCircle,
} from 'lucide-react';
import { FilePreviewCard } from './FilePreviewCard';

/**
 * SubmissionCard - Card untuk setiap submission dengan penilaian inline
 */
export function SubmissionCard({ submission, dueDate, formatDate, isLate, onGrade }) {
  const hasSubmitted = !!submission.submittedAt;
  const late = isLate(submission.submittedAt, dueDate);
  const hasGrade =
    submission.grade !== null &&
    submission.grade !== undefined &&
    submission.grade !== -1;

  const initialGrade = submission.grade !== -1 ? submission.grade : '';
  const [grade, setGrade] = useState(initialGrade);
  const [feedback, setFeedback] = useState(submission.feedback ?? '');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [isEditing, setIsEditing] = useState(false);

  const hasChanges =
    String(grade) !== String(initialGrade) || feedback !== (submission.feedback ?? '');

  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
  ];
  const colorIndex = submission.student?.name ? submission.student.name.charCodeAt(0) % colors.length : 0;
  const avatarColor = colors[colorIndex];

  const initials = submission.student?.name
    ? submission.student.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : '??';

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    setSaveStatus(null);
    const result = await onGrade(submission.id, grade, feedback);
    if (result.success) {
      setSaveStatus('success');
      setIsEditing(false);
      setTimeout(() => setSaveStatus(null), 2000);
    } else {
      setSaveStatus('error');
    }
    setSaving(false);
  };

  const quickGrades = [100, 90, 85, 80, 75, 70, 60, 50];

  return (
    <div
      className={`bg-white rounded-xl border ${
        hasSubmitted
          ? hasGrade
            ? 'border-blue-200'
            : late
            ? 'border-amber-200'
            : 'border-slate-200'
          : 'border-red-200 bg-red-50/30'
      } overflow-hidden transition-all hover:shadow-md`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className={`shrink-0 w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold`}
          >
            {initials}
          </div>

          {/* Student Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900">
                  {submission.student?.name || 'Nama tidak tersedia'}
                </h3>
                <p className="text-sm text-slate-500">{submission.student?.email}</p>
              </div>

              {/* Status Badges */}
              <div className="shrink-0 flex items-center gap-2">
                {hasGrade && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                    <Star size={14} />
                    {submission.grade}
                  </span>
                )}
                {hasSubmitted ? (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      late ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <CheckCircle size={14} />
                    {late ? 'Terlambat' : 'Submitted'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    <XCircle size={14} />
                    Belum Submit
                  </span>
                )}
              </div>
            </div>

            {/* Submission Details */}
            {hasSubmitted && (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Clock size={14} />
                    {formatDate(submission.submittedAt)}
                    {late && <span className="text-amber-600 font-medium">(Terlambat)</span>}
                  </span>
                </div>

                {submission.fileUrl && <FilePreviewCard url={submission.fileUrl} />}

                {submission.note && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <MessageSquare size={14} className="text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-yellow-700 mb-1">Catatan Mahasiswa:</p>
                      <p className="text-sm text-yellow-800">{submission.note}</p>
                    </div>
                  </div>
                )}

                {hasGrade && !isEditing && submission.feedback && (
                  <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                    <MessageSquare size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600">{submission.feedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grading Section */}
      {hasSubmitted && (
        <div
          className={`px-5 py-4 border-t ${
            isEditing || !hasGrade ? 'bg-slate-50' : 'bg-white'
          } border-slate-100`}
        >
          {/* Compact View (Already Graded & Not Editing) */}
          {hasGrade && !isEditing && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">
                  Nilai: <span className="font-bold text-blue-600">{submission.grade}</span>
                </span>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-3 py-1 rounded-md"
              >
                Edit / Nilai
              </button>
            </div>
          )}

          {/* Grading Form */}
          {(!hasGrade || isEditing) && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-slate-500 mr-1 self-center">Quick:</span>
                {quickGrades.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setGrade(q)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                      grade === q
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-primary/50 hover:bg-blue-50'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <div className="relative w-24">
                  <Star size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="Nilai"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                  />
                </div>

                <div className="relative flex-1">
                  <MessageSquare size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Feedback singkat (opsional)..."
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving || !grade || !hasChanges}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition ${
                    hasChanges && grade
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  } disabled:opacity-50`}
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : saveStatus === 'success' ? (
                    <Check size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  {saving ? 'Saving...' : saveStatus === 'success' ? 'Tersimpan!' : 'Simpan'}
                </button>

                {isEditing && (
                  <button
                    onClick={() => {
                      setGrade(submission.grade ?? '');
                      setFeedback(submission.feedback ?? '');
                      setIsEditing(false);
                    }}
                    className="px-3 py-2.5 text-slate-500 hover:text-slate-700 text-sm font-medium"
                  >
                    Batal
                  </button>
                )}
              </div>

              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle size={14} />
                  Gagal menyimpan nilai. Coba lagi.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
