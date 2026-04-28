import { Link, useLocation } from 'react-router-dom';
import { Pin, MessageSquare, Clock, Shield, GraduationCap } from 'lucide-react';

/**
 * ThreadCard — Menampilkan preview thread di forum list.
 * Menampilkan: pin indicator, title, preview content, author, timestamp, reply count.
 */
const roleBadge = {
  DOSEN: { label: 'Dosen', icon: Shield, className: 'bg-blue-100 text-blue-700 border-blue-200' },
  MAHASISWA: { label: 'Mahasiswa', icon: GraduationCap, className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  ADMIN: { label: 'Admin', icon: Shield, className: 'bg-violet-100 text-violet-700 border-violet-200' },
};

const formatRelativeTime = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function ThreadCard({ thread, courseId }) {
  const location = useLocation();

  // Determine base path based on current URL (dosen or mahasiswa)
  const basePath = location.pathname.startsWith('/dosen')
    ? `/dosen/courses/${courseId}/forum/${thread.id}`
    : `/mahasiswa/courses/${courseId}/forum/${thread.id}`;

  const badge = roleBadge[thread.author?.role] || roleBadge.MAHASISWA;
  const BadgeIcon = badge.icon;
  const replyCount = thread._count?.replies || 0;

  return (
    <Link
      to={basePath}
      className="group block p-5 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start gap-4">
        {/* Author Avatar */}
        <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase">
          {thread.author?.name?.charAt(0) || '?'}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 mb-1">
            {thread.isPinned && (
              <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Pin size={12} />
                Pin
              </span>
            )}
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {thread.title}
            </h3>
          </div>

          {/* Content preview */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {thread.content}
          </p>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {/* Author */}
            <span className="font-medium text-foreground/80">{thread.author?.name}</span>

            {/* Role badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${badge.className}`}>
              <BadgeIcon size={10} />
              {badge.label}
            </span>

            {/* Timestamp */}
            <span className="inline-flex items-center gap-1">
              <Clock size={12} />
              {formatRelativeTime(thread.updatedAt || thread.createdAt)}
            </span>

            {/* Reply count */}
            <span className="inline-flex items-center gap-1">
              <MessageSquare size={12} />
              {replyCount} balasan
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
