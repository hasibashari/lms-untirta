import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, Save } from 'lucide-react';
import { createThread, updateThread, getThread } from '../api/forum.api';
import Breadcrumb from '@/shared/components/navigation/Breadcrumb';
import MarkdownEditor from '@/shared/components/markdown/MarkdownEditor';
import toast from 'react-hot-toast';

/**
 * ForumThreadCreatePage — Halaman untuk membuat atau mengedit thread diskusi.
 */
export default function ForumThreadCreatePage() {
  const { classId, threadId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isDosen = location.pathname.startsWith('/dosen');
  const rolePrefix = isDosen ? '/dosen' : '/mahasiswa';
  const isEdit = !!threadId;

  // Fetch thread data if in edit mode
  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      getThread(threadId)
        .then((res) => {
          setTitle(res.data.title);
          setContent(res.data.content);
        })
        .catch(() => {
          toast.error('Gagal memuat data diskusi');
          navigate(`${rolePrefix}/classes/${classId}/forum`);
        })
        .finally(() => setLoading(false));
    }
  }, [isEdit, threadId, classId, navigate, rolePrefix]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || submitting) return;

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateThread(threadId, {
          title: title.trim(),
          content: content.trim(),
        });
        toast.success('Diskusi berhasil diperbarui!');
        navigate(`${rolePrefix}/classes/${classId}/forum/${threadId}`, { replace: true });
      } else {
        const res = await createThread(classId, {
          title: title.trim(),
          content: content.trim(),
        });
        toast.success('Diskusi berhasil dibuat!');
        navigate(`${rolePrefix}/classes/${classId}/forum/${res.data.id}`, { replace: true });
      }
    } catch {
      // Error handled by apiService interceptor
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={24} className="animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Memuat data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: isDosen ? 'Dashboard' : 'Kelas Saya', to: isDosen ? '/dosen/dashboard' : '/mahasiswa/classes' },
          { label: 'Forum', to: `${rolePrefix}/classes/${classId}/forum` },
          { label: isEdit ? 'Edit Diskusi' : 'Buat Diskusi' },
        ]}
      />

      {/* Back link */}
      <button
        onClick={() => navigate(isEdit ? `${rolePrefix}/classes/${classId}/forum/${threadId}` : `${rolePrefix}/classes/${classId}/forum`)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft size={16} />
        {isEdit ? 'Kembali ke Detail' : 'Kembali ke Forum'}
      </button>

      {/* Form Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-border bg-muted/30">
          <h1 className="text-xl font-bold text-foreground">
            {isEdit ? 'Edit Diskusi' : 'Buat Diskusi Baru'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEdit ? 'Perbarui topik diskusi yang sudah ada' : 'Mulai topik diskusi baru untuk kelas ini'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
          {/* Title Input */}
          <div>
            <label htmlFor="thread-title" className="block text-sm font-semibold text-foreground mb-2">
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
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 transition font-medium"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5 flex justify-end">
              {title.length}/200 karakter
            </p>
          </div>

          {/* Content Editor */}
          <div>
            <label htmlFor="thread-content" className="block text-sm font-semibold text-foreground mb-2">
              Isi Diskusi
            </label>
            <div className="rounded-xl overflow-hidden border border-border">
              <MarkdownEditor
                value={content}
                onChange={setContent}
                placeholder="Tuliskan isi diskusi Anda secara detail... (Mendukung Markdown)"
                disabled={submitting}
                minHeight="300px"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Minimal 10 karakter. Anda dapat menggunakan Markdown untuk memformat teks.
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => navigate(isEdit ? `${rolePrefix}/classes/${classId}/forum/${threadId}` : `${rolePrefix}/classes/${classId}/forum`)}
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!title.trim() || content.trim().length < 10 || submitting}
              className="inline-flex items-center gap-2 px-8 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {isEdit ? 'Menyimpan...' : 'Membuat...'}
                </>
              ) : (
                <>
                  {isEdit ? <Save size={18} /> : <Send size={18} />}
                  {isEdit ? 'Simpan Perubahan' : 'Buat Diskusi'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
