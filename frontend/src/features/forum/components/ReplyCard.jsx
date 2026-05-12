import { useState } from 'react';
import { Pencil, Trash2, Shield, GraduationCap, Check, X, MessageSquare } from 'lucide-react';
import ReplyComposer from './ReplyComposer';
import MarkdownPreview from '@/shared/components/markdown/MarkdownPreview';

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
 * Mendukung nested replies secara rekursif.
 */
export default function ReplyCard({ 
  reply, 
  currentUserId, 
  currentUserRole, 
  onUpdate, 
  onDelete, 
  onCreateReply, 
  depth = 0 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  // Robust ID comparison using String() and truthy check
  const isOwner = currentUserId && reply.author?.id && String(reply.author.id) === String(currentUserId);
  const isModerator = currentUserRole === 'DOSEN' || currentUserRole === 'ADMIN';
  
  // Mahasiswa can only edit/delete their own. Moderators can delete any.
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

  // Max depth indentation to prevent layout breaking on mobile
  const maxDepth = 4;
  const shouldIndent = depth > 0 && depth <= maxDepth;

  return (
    <div className={`
      group transition-all
      ${shouldIndent ? 'ml-3 sm:ml-8 border-l-2 border-slate-200 pl-3 sm:pl-6 bg-muted/5 rounded-r-xl' : ''}
    `}>
      <div className="flex gap-3 sm:gap-4 p-4 sm:p-5 relative">
        {/* Connection line for visual hierarchy (L-shape connector) */}
        {depth > 0 && (
          <div 
            className="absolute -left-3 sm:-left-6 top-0 w-3 sm:w-6 h-8 border-l-2 border-b-2 border-slate-200 rounded-bl-xl pointer-events-none"
          ></div>
        )}

        {/* Avatar */}
        <div className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs sm:text-sm uppercase ring-2 ring-background z-10">
          {reply.author?.name?.charAt(0) || '?'}
        </div>

        <div className="flex-1 min-w-0">
          {/* Author info */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-bold text-foreground text-sm">{reply.author?.name}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${badge.className}`}>
              <BadgeIcon size={8} />
              {badge.label}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              {formatDateTime(reply.createdAt)}
            </span>
            {isEdited && (
              <span className="text-[11px] text-muted-foreground italic">(diedit)</span>
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
            <div className="text-sm text-slate-700 leading-relaxed overflow-hidden">
              <MarkdownPreview content={reply.content} variant="forum" />
            </div>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-4 mt-3">
              {/* Reply Button - anyone can reply */}
              <button
                onClick={() => setIsReplying(!isReplying)}
                className={`
                inline-flex items-center gap-1.5 text-[11px] font-bold transition
                ${isReplying ? 'text-primary' : 'text-muted-foreground hover:text-primary'}
              `}
              >
                <MessageSquare size={12} className={isReplying ? 'fill-primary/20' : ''} />
                Balas
              </button>

              {/* Edit - ONLY Author */}
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-primary transition"
                >
                  <Pencil size={12} />
                  Edit
                </button>
              )}

              {/* Delete - Author or Moderator */}
              {canDelete && (
                <>
                  {isDeleting ? (
                    <div className="inline-flex items-center gap-2 text-[11px]">
                      <span className="text-destructive font-bold">Hapus?</span>
                      <button
                        onClick={() => { onDelete(reply.id); setIsDeleting(false); }}
                        className="text-destructive font-bold hover:underline"
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
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-destructive transition"
                    >
                      <Trash2 size={12} />
                      Hapus
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Nested Reply Composer */}
          {isReplying && (
            <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
              <ReplyComposer 
                onSubmit={async (content) => {
                  await onCreateReply(content, reply.id);
                  setIsReplying(false);
                }}
                onCancel={() => setIsReplying(false)}
                compact
              />
            </div>
          )}
        </div>
      </div>

      {/* Recursive children rendering */}
      {reply.children && reply.children.length > 0 && (
        <div className="replies-nested">
          {reply.children.map((child) => (
            <ReplyCard
              key={child.id}
              reply={child}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onCreateReply={onCreateReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
