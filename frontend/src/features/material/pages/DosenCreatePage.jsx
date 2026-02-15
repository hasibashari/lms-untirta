import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save,
  X,
  FileText,
  ArrowLeft,
  FileDown,
  Video,
  Link2,
  ExternalLink,
  Plus,
  Trash2,
  Eye,
  Edit3,
  Play,
  File,
  Youtube,
  Calendar,
  Hash,
} from 'lucide-react';
import { createMaterial, getMaterialDetail, updateMaterial } from '../materialService';
import Breadcrumb from '../../../components/navigation/Breadcrumb';
import MarkdownEditor from '../../../components/ui/MarkdownEditor';
import MarkdownPreview from '../../../components/ui/MarkdownPreview';

/**
 * CreateMaterial - Form Pembuatan & Edit Materi
 * Menggunakan Markdown Editor dengan Live Preview
 * 
 * Mode:
 * - Create: Jika tidak ada materialId di URL params
 * - Edit: Jika ada materialId di URL params
 * 
 * Alur UX:
 * 1. Dosen mengisi judul materi
 * 2. Dosen menulis konten dengan Markdown Editor
 * 3. Dosen bisa switch ke tab Preview untuk melihat hasil
 * 4. Preview sama persis dengan tampilan mahasiswa
 * 5. Simpan materi
 */
export default function CreateMaterial() {
  const { courseId, materialId } = useParams();
  const navigate = useNavigate();

  // Mode edit jika ada materialId
  const isEditMode = Boolean(materialId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [order, setOrder] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Multiple attachments dengan nama dan tipe
  const [attachments, setAttachments] = useState([]);

  // Tab untuk switch antara Edit dan Preview
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview'

  // Fetch data materi jika mode edit
  useEffect(() => {
    if (isEditMode && materialId) {
      setLoading(true);
      getMaterialDetail(materialId)
        .then(res => {
          const data = res.data;
          setTitle(data.title || '');
          setContent(data.content || '');
          setOrder(data.order?.toString() || '');

          // Konversi attachments dari response ke format form
          const loadedAttachments = [];
          if (data.attachments && Array.isArray(data.attachments)) {
            data.attachments.forEach(att => {
              loadedAttachments.push({
                name: att.label || '',
                url: att.url || '',
                type: att.type === 'video' ? 'video' : 'file',
              });
            });
          }
          // Backward compatibility: jika tidak ada attachments array, cek fileUrl dan videoUrl
          if (loadedAttachments.length === 0) {
            if (data.fileUrl) {
              loadedAttachments.push({ name: 'File', url: data.fileUrl, type: 'file' });
            }
            if (data.videoUrl) {
              loadedAttachments.push({ name: 'Video', url: data.videoUrl, type: 'video' });
            }
          }
          setAttachments(loadedAttachments);
        })
        .catch(err => {
          setError(err?.response?.data?.message || err?.message || 'Gagal memuat data materi');
        })
        .finally(() => setLoading(false));
    }
  }, [isEditMode, materialId]);

  // Fungsi untuk menambah attachment baru
  const addAttachment = () => {
    setAttachments([...attachments, { name: '', url: '', type: 'file' }]);
  };

  // Fungsi untuk menghapus attachment
  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Fungsi untuk update attachment
  const updateAttachmentField = (index, field, value) => {
    const newAttachments = [...attachments];
    newAttachments[index][field] = value;
    setAttachments(newAttachments);
  };

  // Helper untuk extract YouTube video ID
  const getYoutubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Helper untuk cek apakah URL adalah video
  const isVideoUrl = (url) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
  };

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
      // Filter attachments yang valid (memiliki URL)
      const validAttachments = attachments.filter(a => a.url.trim());

      // Pisahkan file dan video untuk backward compatibility
      const fileAttachment = validAttachments.find(a => a.type === 'file');
      const videoAttachment = validAttachments.find(a => a.type === 'video');

      const payload = {
        title: title.trim(),
        content: content,
        order: order ? parseInt(order) : undefined,
        fileUrl: fileAttachment?.url || undefined,
        videoUrl: videoAttachment?.url || undefined,
        // Kirim semua attachments untuk future use
        attachments: validAttachments.length > 0 ? validAttachments : undefined,
      };

      if (isEditMode) {
        // Mode Edit: Update materi yang sudah ada
        await updateMaterial(materialId, payload);
      } else {
        // Mode Create: Buat materi baru
        await createMaterial(courseId, payload);
      }

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

  // Loading state saat fetch data untuk edit
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500">Memuat data materi...</p>
        </div>
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
          { label: isEditMode ? 'Edit Materi' : 'Tambah Materi' },
        ]}
      />

      {/* Page Header dengan Tab */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditMode ? 'Edit Materi' : 'Tambah Materi Baru'}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isEditMode ? 'Perbarui materi pembelajaran' : 'Buat materi pembelajaran dengan format Markdown'}
            </p>
          </div>
        </div>

        {/* Tab Switch Edit/Preview */}
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'edit'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Edit3 size={16} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'preview'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Eye size={16} />
            Preview
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <X size={20} className="text-red-600" />
          </div>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'edit' ? (
        /* ========== EDIT MODE ========== */
        <form onSubmit={handleSubmit} className="space-y-6">
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
              minHeight={400}
            />
          </div>

          {/* Lampiran & Resource - Multiple Attachments */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-1">
                  <Link2 size={20} className="text-blue-600" />
                  Lampiran & Resource
                </h3>
                <p className="text-sm text-slate-500">
                  Tambahkan file PDF, video, atau resource lainnya (opsional)
                </p>
              </div>
              <button
                type="button"
                onClick={addAttachment}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition"
              >
                <Plus size={18} />
                Tambah Lampiran
              </button>
            </div>

            {/* List Attachments */}
            {attachments.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <Link2 size={32} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">Belum ada lampiran</p>
                <p className="text-slate-400 text-xs mt-1">Klik "Tambah Lampiran" untuk menambahkan file atau video</p>
              </div>
            ) : (
              <div className="space-y-4">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    {/* Nama Lampiran */}
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Nama Lampiran
                      </label>
                      <input
                        type="text"
                        value={attachment.name}
                        onChange={(e) => updateAttachmentField(index, 'name', e.target.value)}
                        placeholder="contoh: Slide Pertemuan 1"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    {/* URL */}
                    <div className="flex-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        URL Link
                      </label>
                      <input
                        type="url"
                        value={attachment.url}
                        onChange={(e) => {
                          updateAttachmentField(index, 'url', e.target.value);
                          // Auto-detect type berdasarkan URL
                          if (isVideoUrl(e.target.value)) {
                            updateAttachmentField(index, 'type', 'video');
                          }
                        }}
                        placeholder="https://drive.google.com/... atau https://youtube.com/..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    {/* Tipe */}
                    <div className="w-full md:w-32">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Tipe
                      </label>
                      <select
                        value={attachment.type}
                        onChange={(e) => updateAttachmentField(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="file">📄 File</option>
                        <option value="video">🎬 Video</option>
                      </select>
                    </div>

                    {/* Delete Button */}
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Hapus lampiran"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              💡 Klik tab <strong>Preview</strong> untuk melihat hasil akhir sebelum menyimpan
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
                {saving ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Simpan Materi'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* ========== PREVIEW MODE ========== */
        <MaterialPreview
          title={title}
          content={content}
          order={order}
          attachments={attachments.filter(a => a.url.trim())}
          getYoutubeVideoId={getYoutubeVideoId}
        />
      )}
    </div>
  );
}

/**
 * MaterialPreview - Komponen Preview Materi
 * Tampilan yang konsisten dengan halaman mahasiswa (seperti platform edukasi)
 */
function MaterialPreview({ title, content, order, attachments, getYoutubeVideoId }) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Preview Header Info */}
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
        <Eye size={18} className="text-amber-600" />
        <p className="text-sm text-amber-700">
          <strong>Mode Preview:</strong> Tampilan ini sama persis dengan yang akan dilihat mahasiswa
        </p>
      </div>

      {/* Material Card - Seperti tampilan edukasi */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Section */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {order && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-full text-xs font-medium mb-3">
                  <Hash size={12} />
                  Materi {order}
                </span>
              )}
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {title || 'Judul Materi'}
              </h1>
              <div className="flex items-center gap-4 text-blue-100 text-sm">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {currentDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText size={14} />
                  {content ? `${content.split(' ').length} kata` : '0 kata'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8">
          {/* Konten Markdown */}
          <div className="mb-8">
            {content ? (
              <MarkdownPreview content={content} />
            ) : (
              <div className="text-center py-12 text-slate-400">
                <FileText size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-lg">Belum ada konten</p>
                <p className="text-sm">Tulis konten materi di tab Edit</p>
              </div>
            )}
          </div>

          {/* Attachments Section */}
          {attachments && attachments.length > 0 && (
            <div className="border-t border-slate-200 pt-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Link2 size={20} className="text-blue-600" />
                Lampiran ({attachments.length})
              </h2>

              <div className="space-y-4">
                {attachments.map((attachment, index) => {
                  const videoId = attachment.type === 'video' ? getYoutubeVideoId(attachment.url) : null;

                  return (
                    <div
                      key={index}
                      className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden"
                    >
                      {/* Video Embed untuk YouTube */}
                      {videoId ? (
                        <div className="aspect-video">
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title={attachment.name || `Video ${index + 1}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : null}

                      {/* Attachment Info */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${attachment.type === 'video'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-emerald-100 text-emerald-600'
                            }`}>
                            {attachment.type === 'video' ? (
                              videoId ? <Youtube size={20} /> : <Video size={20} />
                            ) : (
                              <File size={20} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {attachment.name || (attachment.type === 'video' ? 'Video' : 'File Lampiran')}
                            </p>
                            <p className="text-xs text-slate-500 truncate max-w-xs">
                              {attachment.url}
                            </p>
                          </div>
                        </div>

                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${attachment.type === 'video'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                        >
                          {attachment.type === 'video' ? (
                            <>
                              <Play size={16} />
                              Tonton
                            </>
                          ) : (
                            <>
                              <FileDown size={16} />
                              Download
                            </>
                          )}
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons di Preview Mode */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-5 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-medium transition"
        >
          Kembali ke Edit
        </button>
      </div>
    </div>
  );
}
