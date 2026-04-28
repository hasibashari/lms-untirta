import { useState } from 'react';
import { Pencil, Trash2, Shield, GraduationCap, Check, X } from 'lucide-react';

const roleBadge = {
  DOSEN: { label: 'Dosen', icon: Shield, className: 'bg-blue-100 text-blue-700 border-blue-200' },
  MAHASISWA: { label: 'Mahasiswa', icon: GraduationCap, className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  ADMIN: { label: 'Admin', icon: Shield, className: 'bg-violet-100 text-violet-700 border-violet-200' },
};

const formatDateTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * ReplyCard — Menampilkan satu balasan di thread detail.
 * Mendukung inline edit dan delete dengan konfirmasi.
 */
export default function ReplyCard({ reply, currentUserId, currentUserRole, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = reply.author?.id === currentUserId;
  const isModerator = currentUserRole === 'DOSEN' || currentUserRole === 'ADMIN';
  const canEdit = isOwner;
  const canDelete = isOwner || isModerator;

  const badge = roleBadge[reply.author?.role] || roleBadge.MAHASISWA;
  const BadgeIcon = badge.icon;

  const handleSaveEdit = () => {
    if (editContent.trim().length === 0) return;
    onUpdate(reply.id, editContent.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(reply.content);
    setIsEditing(false);
  };

  const isEdited = reply.updatedAt && reply.updatedAt !== reply.createdAt;

  return (
    <div className="flex gap-3 sm:gap-4 p-4 sm:p-5">
      {/* Avatar */}
      <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase">
        {reply.author?.name?.charAt(0) || '?'}
      </div>

      <div className="flex-1 min-w-0">
        {/* Author info */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="font-semibold text-foreground text-sm">{reply.author?.name}</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${badge.className}`}>
            <BadgeIcon size={10} />
            {badge.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(reply.createdAt)}
          </span>
          {isEdited && (
            <span className="text-xs text-muted-foreground italic">(diedit)</span>
          )}
        </div>

        {/* Content / Edit mode */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={editContent.trim().length === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
              >
                <Check size={14} />
                Simpan
              </button>
              <button
                onClick={handleCancelEdit}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted text-muted-foreground text-xs font-medium rounded-lg hover:bg-muted/80 transition"
              >
                <X size={14} />
                Batal
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground/90 whitespace-pre-wrap wrap-break-word">{reply.content}</p>
        )}

        {/* Actions */}
        {!isEditing && (canEdit || canDelete) && (
          <div className="flex items-center gap-2 mt-2">
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition"
              >
                <Pencil size={12} />
                Edit
              </button>
            )}
            {canDelete && (
              <>
                {isDeleting ? (
                  <div className="inline-flex items-center gap-2 text-xs">
                    <span className="text-destructive font-medium">Hapus?</span>
                    <button
                      onClick={() => { onDelete(reply.id); setIsDeleting(false); }}
                      className="text-destructive font-semibold hover:underline"
                    >
                      Ya
                    </button>
                    <button
                      onClick={() => setIsDeleting(false)}
                      className="text-muted-foreground hover:underline"
                    >
                      Tidak
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsDeleting(true)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition"
                  >
                    <Trash2 size={12} />
                    Hapus
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
