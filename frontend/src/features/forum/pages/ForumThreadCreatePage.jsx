import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { createThread } from '../forumService';
import Breadcrumb from '../../../components/navigation/Breadcrumb';
import toast from 'react-hot-toast';

/**
 * ForumThreadCreatePage — Halaman untuk membuat thread diskusi baru.
 */
export default function ForumThreadCreatePage() {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isDosen = location.pathname.startsWith('/dosen');
  const rolePrefix = isDosen ? '/dosen' : '/mahasiswa';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await createThread(courseId, {
        title: title.trim(),
        content: content.trim(),
      });
      toast.success('Diskusi berhasil dibuat!');
      navigate(`${rolePrefix}/courses/${courseId}/forum/${res.data.id}`, { replace: true });
    } catch {
      // Error handled by apiService interceptor
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: isDosen ? 'Dashboard' : 'Kelas Saya', to: isDosen ? '/dosen/dashboard' : '/mahasiswa/classes' },
          { label: 'Forum', to: `${rolePrefix}/courses/${courseId}/forum` },
          { label: 'Buat Diskusi' },
        ]}
      />

      {/* Back link */}
      <button
        onClick={() => navigate(`${rolePrefix}/courses/${courseId}/forum`)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft size={16} />
        Kembali ke Forum
      </button>

      {/* Form Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-border bg-muted/30">
          <h1 className="text-xl font-bold text-foreground">Buat Diskusi Baru</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mulai topik diskusi baru untuk kelas ini
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Title Input */}
          <div>
            <label htmlFor="thread-title" className="block text-sm font-medium text-foreground mb-2">
              Judul Diskusi
            </label>
            <input
              id="thread-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masukkan judul diskusi..."
              maxLength={200}
              required
              disabled={submitting}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 transition"
            />
            <p className="text-xs text-muted-foreground mt-1">{title.length}/200 karakter</p>
          </div>

          {/* Content Textarea */}
          <div>
            <label htmlFor="thread-content" className="block text-sm font-medium text-foreground mb-2">
              Isi Diskusi
            </label>
            <textarea
              id="thread-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan isi diskusi Anda secara detail..."
              rows={8}
              required
              disabled={submitting}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 transition"
            />
            <p className="text-xs text-muted-foreground mt-1">Minimal 10 karakter</p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(`${rolePrefix}/courses/${courseId}/forum`)}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium text-muted-foreground bg-muted rounded-xl hover:bg-muted/80 disabled:opacity-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!title.trim() || content.trim().length < 10 || submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Membuat...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Buat Diskusi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
