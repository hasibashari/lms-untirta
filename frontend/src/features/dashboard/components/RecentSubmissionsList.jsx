import { Link } from 'react-router-dom';
import { Inbox, ArrowRight, CheckCircle } from 'lucide-react';
import { formatRelativeTime } from '@/shared/utils/date.util';

export default function RecentSubmissionsList({ submissions }) {
  if (!submissions || submissions.length === 0) return null;

  return (
    <section className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Inbox size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground">Submissions Terbaru</h2>
            <p className="text-sm text-muted-foreground">Tugas yang baru dikumpulkan mahasiswa</p>
          </div>
        </div>
        <Link
          to="/dosen/submissions"
          className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
        >
          Lihat Semua
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {submissions.map((submission) => (
          <Link
            key={submission.id}
            to={`/dosen/classes/${submission.classId || submission.courseId}/assignments/${submission.assignmentId}/submissions`}
            className="flex items-center gap-4 p-4 hover:bg-muted/50 transition"
          >
            {/* Avatar placeholder */}
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
              {submission.studentName?.charAt(0)?.toUpperCase() || '?'}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-card-foreground truncate">{submission.studentName}</p>
                {!submission.isGraded && (
                  <span className="shrink-0 px-2 py-0.5 bg-amber-500/10 text-amber-700 text-xs font-medium rounded-full">
                    Belum Dinilai
                  </span>
                )}
                {submission.isGraded && (
                  <span className="shrink-0 px-2 py-0.5 bg-emerald-500/10 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <CheckCircle size={10} />
                    {submission.grade}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {submission.assignmentTitle} • {submission.courseName}
              </p>
            </div>

            {/* Time */}
            <div className="shrink-0 text-right">
              <p className="text-xs text-muted-foreground/80">{formatRelativeTime(submission.submittedAt)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
