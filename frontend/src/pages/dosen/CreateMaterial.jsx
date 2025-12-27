import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, FileText, ArrowLeft, FileDown, Video, Link2, ExternalLink } from 'lucide-react';
import { createMaterial } from '../../services/dosen.service';
import Breadcrumb from '../../components/navigation/Breadcrumb';
import MarkdownEditor from '../../components/ui/MarkdownEditor';

/**
 * CreateMaterial - Form Pembuatan Materi Baru
 * Menggunakan Markdown Editor dengan Live Preview
 * 
 * Alur UX:
 * 1. Dosen mengisi judul materi
 * 2. Dosen menulis konten dengan Markdown Editor
 * 3. Dosen bisa switch ke tab Preview untuk melihat hasil
 * 4. Preview sama persis dengan tampilan mahasiswa
 * 5. Simpan materi
 */
export default function CreateMaterial() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [order, setOrder] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!courseId || courseId === 'undefined') return;
    if (!title.trim()) {
      setError('Judul materi harus diisi');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createMaterial(courseId, {
        title: title.trim(),
        content: content,
        order: order ? parseInt(order) : undefined,
        fileUrl: fileUrl.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
      });
      navigate(`/dosen/courses/${courseId}/materials`);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Gagal menyimpan materi');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (content && !confirm('Perubahan belum disimpan. Yakin ingin keluar?')) {
      return;
    }
    navigate(`/dosen/courses/${courseId}/materials`);
  };

  if (!courseId || courseId === 'undefined') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-slate-500">Memuat data kelas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Dashboard', to: '/dosen/dashboard' },
          { label: 'Kelas Saya', to: '/dosen/classes' },
          { label: 'Kelas', to: `/dosen/courses/${courseId}` },
          { label: 'Materi', to: `/dosen/courses/${courseId}/materials` },
          { label: 'Tambah Materi' },
        ]}
      />

      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Tambah Materi Baru
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Buat materi pembelajaran dengan format Markdown
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <X size={20} className="text-red-600" />
            </div>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Title & Order */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Title */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Judul Materi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="contoh: Pertemuan 1 - Pengenalan HTML"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            {/* Order */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Urutan
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                placeholder="Auto"
                min="1"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <div className="flex items-center gap-2">
              <FileText size={16} />
              Konten Materi
            </div>
          </label>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Tulis konten materi di sini menggunakan Markdown...

Contoh format:
# Judul Besar
## Sub Judul

Paragraf biasa dengan **teks tebal** dan *teks miring*.

- Item list 1
- Item list 2

```javascript
// Contoh kode
console.log('Hello World');
```

> Ini adalah kutipan

[Link ke website](https://example.com)"
            minHeight={450}
          />
        </div>

        {/* Lampiran & Resource */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-1">
              <Link2 size={20} className="text-blue-600" />
              Lampiran & Resource
            </h3>
            <p className="text-sm text-slate-500">
              Tambahkan link file PDF atau video untuk melengkapi materi (opsional)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* File URL (PDF) */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <FileDown size={16} className="text-emerald-600" />
                Link File (PDF/Dokumen)
              </label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://drive.google.com/file/..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
              <p className="text-xs text-slate-400">
                Contoh: Google Drive, Dropbox, atau link download langsung
              </p>
            </div>

            {/* Video URL */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Video size={16} className="text-red-600" />
                Link Video
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              />
              <p className="text-xs text-slate-400">
                Contoh: YouTube, Vimeo, atau Google Drive video
              </p>
            </div>
          </div>

          {/* Preview Resource */}
          {(fileUrl || videoUrl) && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-700 mb-3">Preview Lampiran:</p>
              <div className="flex flex-wrap gap-3">
                {fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition border border-emerald-200"
                  >
                    <FileDown size={18} />
                    Download File
                    <ExternalLink size={14} />
                  </a>
                )}
                {videoUrl && (
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-xl font-medium hover:bg-red-100 transition border border-red-200"
                  >
                    <Video size={18} />
                    Tonton Video
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            💡 Gunakan tab <strong>Preview</strong> untuk melihat hasil akhir sebelum menyimpan
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-medium transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-blue-200"
            >
              <Save size={18} />
              {saving ? 'Menyimpan...' : 'Simpan Materi'}
            </button>
          </div>
        </div>
      </form>

    </div>
  );
}
