import { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pin,
  Pencil,
  Trash2,
  Shield,
  GraduationCap,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { getThread, togglePin, deleteThread, createReply, updateReply, deleteReply } from '../forumService';
import ReplyCard from '../components/ReplyCard';
import ReplyComposer from '../components/ReplyComposer';
import Breadcrumb from '../../../components/navigation/Breadcrumb';
import MarkdownPreview from '../../../components/ui/MarkdownPreview';
import toast from 'react-hot-toast';

const roleBadge = {
  DOSEN: { label: 'Dosen', icon: Shield, className: 'bg-blue-100 text-blue-700 border-blue-200' },
  MAHASISWA: { label: 'Mahasiswa', icon: GraduationCap, className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  ADMIN: { label: 'Admin', icon: Shield, className: 'bg-violet-100 text-violet-700 border-violet-200' },
};

const formatDateTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ForumThreadDetailPage() {
  const { classId, threadId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isDosen = location.pathname.startsWith('/dosen');
  const rolePrefix = isDosen ? '/dosen' : '/mahasiswa';

  // Get current user from localStorage
  const currentUser = (() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { id: payload.userId, role: payload.role };
    } catch {
      return null;
    }
  })();

  const fetchThread = useCallback(() => {
    setLoading(true);
    getThread(threadId)
      .then((res) => setThread(res.data))
      .catch((err) => setError(err.message || 'Gagal memuat diskusi'))
      .finally(() => setLoading(false));
  }, [threadId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchThread();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchThread]);

  // Permissions
  const isOwner = currentUser && thread?.author?.id && String(thread.author.id) === String(currentUser.id);
  const isModerator = currentUser && (currentUser.role === 'DOSEN' || currentUser.role === 'ADMIN');

  const handleTogglePin = async () => {
    try {
      const res = await togglePin(threadId);
      setThread((prev) => ({ ...prev, isPinned: res.data.isPinned }));
      toast.success(res.data.isPinned ? 'Thread berhasil di-pin' : 'Thread berhasil di-unpin');
    } catch { /* error handled by apiService */ }
  };

  const handleDeleteThread = async () => {
    try {
      await deleteThread(threadId);
      toast.success('Diskusi berhasil dihapus');
      navigate(`${rolePrefix}/classes/${classId}/forum`, { replace: true });
    } catch { /* error handled by apiService */ }
  };

  const handleCreateReply = async (content, parentId = null) => {
    try {
      const res = await createReply(threadId, { content, parentId });
      setThread((prev) => ({
        ...prev,
        replies: [...(prev.replies || []), res.data],
      }));
      toast.success('Balasan berhasil dikirim');
    } catch { /* error handled by apiService */ }
  };

  const handleUpdateReply = async (replyId, content) => {
    const res = await updateReply(replyId, { content });
    setThread((prev) => ({
      ...prev,
      replies: prev.replies.map((r) => (r.id === replyId ? { ...r, ...res.data } : r)),
    }));
    toast.success('Balasan berhasil diperbarui');
  };

  const handleDeleteReply = async (replyId) => {
    await deleteReply(replyId);
    setThread((prev) => ({
      ...prev,
      replies: prev.replies.filter((r) => r.id !== replyId),
    }));
    toast.success('Balasan berhasil dihapus');
  };

  // Group replies into a tree structure for nested display
  const replyTree = (() => {
    if (!thread?.replies) return [];
    const map = {};
    const roots = [];
    
    // Sort by date to ensure order is preserved within levels
    const sortedReplies = [...thread.replies].sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );

    sortedReplies.forEach(r => {
      map[r.id] = { ...r, children: [] };
    });
    
    sortedReplies.forEach(r => {
      if (r.parentId && map[r.parentId]) {
        map[r.parentId].children.push(map[r.id]);
      } else {
        roots.push(map[r.id]);
      }
    });
    
    return roots;
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={24} className="animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Memuat diskusi...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-destructive font-medium">{error}</p>
        <button onClick={fetchThread} className="text-sm text-primary hover:underline">Coba lagi</button>
      </div>
    );
  }

  if (!thread) return null;

  const badge = roleBadge[thread.author?.role] || roleBadge.MAHASISWA;
  const BadgeIcon = badge.icon;

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: isDosen ? 'Dashboard' : 'Kelas Saya', to: isDosen ? '/dosen/dashboard' : '/mahasiswa/classes' },
          { label: 'Forum', to: `${rolePrefix}/classes/${classId}/forum` },
          { label: thread.title },
        ]}
      />

      {/* Back link */}
      <button
        onClick={() => navigate(`${rolePrefix}/classes/${classId}/forum`)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft size={16} />
        Kembali ke Forum
      </button>

      {/* Thread Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 lg:p-8">
          {/* Pin badge */}
          {thread.isPinned && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mb-3">
              <Pin size={12} />
              Pinned
            </span>
          )}

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mb-4">
            {thread.title}
          </h1>

          {/* Author info */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase">
              {thread.author?.name?.charAt(0) || '?'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm">{thread.author?.name}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${badge.className}`}>
                  <BadgeIcon size={10} />
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{formatDateTime(thread.createdAt)}</p>
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            <MarkdownPreview content={thread.content} />
          </div>

          {/* Actions */}
          {(isOwner || isModerator) && (
            <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-border">
              {isModerator && (
                <button
                  onClick={handleTogglePin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition"
                >
                  <Pin size={14} />
                  {thread.isPinned ? 'Unpin' : 'Pin'}
                </button>
              )}
              {isOwner && (
                <button
                  onClick={() => navigate(`${rolePrefix}/classes/${classId}/forum/${threadId}/edit`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition"
                >
                  <Pencil size={14} />
                  Edit
                </button>
              )}
              {(isOwner || isModerator) && (
                <>
                  {isDeleting ? (
                    <div className="inline-flex items-center gap-2 text-xs">
                      <span className="text-destructive font-medium">Hapus thread ini?</span>
                      <button onClick={handleDeleteThread} className="text-destructive font-semibold hover:underline">Ya, hapus</button>
                      <button onClick={() => setIsDeleting(false)} className="text-muted-foreground hover:underline">Batal</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsDeleting(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-destructive bg-destructive/10 rounded-lg hover:bg-destructive/20 transition"
                    >
                      <Trash2 size={14} />
                      Hapus
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Replies Section */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-border bg-muted/30">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <MessageSquare size={20} />
            Balasan ({thread.replies?.length || 0})
          </h2>
        </div>

        {/* Replies list */}
        {replyTree.length > 0 ? (
          <div className="divide-y divide-border">
            {replyTree.map((reply) => (
              <ReplyCard
                key={reply.id}
                reply={reply}
                currentUserId={currentUser?.id}
                currentUserRole={currentUser?.role}
                onUpdate={handleUpdateReply}
                onDelete={handleDeleteReply}
                onCreateReply={handleCreateReply}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Belum ada balasan. Jadilah yang pertama membalas!
          </div>
        )}

        {/* Reply Composer */}
        <ReplyComposer onSubmit={handleCreateReply} />
      </div>
    </div>
  );
}
