import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save,
  X,
  FileText,
  ArrowLeft,
  Eye,
  Edit3,
  Calendar,
  Hash,
  Paperclip,
  UploadCloud,
  Trash2,
} from 'lucide-react';
import { createMaterial, getMaterialDetail, updateMaterial } from '../materialService';
import Breadcrumb from '@/shared/components/navigation/Breadcrumb';
import MarkdownEditor from '@/shared/components/markdown/MarkdownEditor';
import ConfirmDialog from '@/shared/components/feedback/ConfirmDialog';
import MaterialPreviewCard from '../components/MaterialPreviewCard';

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
  const { classId, materialId } = useParams();
  const navigate = useNavigate();

  // Mode edit jika ada materialId
  const isEditMode = Boolean(materialId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [order, setOrder] = useState('');
  const [file, setFile] = useState(null);
  const [existingFileUrl, setExistingFileUrl] = useState('');
  const [removeFile, setRemoveFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

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
          setExistingFileUrl(data.fileUrl || '');

        })
        .catch(err => {
          setError(err?.response?.data?.message || err?.message || 'Gagal memuat data materi');
        })
        .finally(() => setLoading(false));
    }
  }, [isEditMode, materialId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!classId || classId === 'undefined') return;
    if (!title.trim()) {
      setError('Judul materi harus diisi');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        content: content,
        order: order ? parseInt(order) : undefined,
        file: file,
        removeFile: removeFile,
      };

      if (isEditMode) {
        // Mode Edit: Update materi yang sudah ada
        await updateMaterial(materialId, payload);
      } else {
        // Mode Create: Buat materi baru
        await createMaterial(classId, payload);
      }

      navigate(`/dosen/classes/${classId}/materials`);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Gagal menyimpan materi');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (content) {
      setShowLeaveConfirm(true);
      return;
    }
    navigate(`/dosen/classes/${classId}/materials`);
  };

  if (!classId || classId === 'undefined') {
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
          { label: 'Kelas', to: `/dosen/classes/${classId}` },
          { label: 'Materi', to: `/dosen/classes/${classId}/materials` },
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
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
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

```

> Ini adalah kutipan

[Link ke website](https://example.com)"
              minHeight={400}
            />
          </div>

          {/* Attachment Upload */}
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <Paperclip size={16} />
                Lampiran File Utama (Opsional)
              </div>
            </label>
            <p className="text-xs text-slate-500 mb-4">
              Maksimal 10 MB. Unggah presentasi PPT, modul PDF, atau dokumen terkait materi ini.
            </p>
            <div className="flex flex-col items-start gap-4">
              {existingFileUrl && !removeFile && !file && (
                <div className="flex items-center justify-between w-full sm:w-auto gap-4 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2">
                    <Paperclip size={16} />
                    <span>File tersimpan</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRemoveFile(true)}
                    className="p-1 text-blue-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                    title="Hapus file ini"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              {removeFile && existingFileUrl && !file && (
                <div className="flex items-center justify-between w-full sm:w-auto gap-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                  <div className="flex items-center gap-2">
                    <Trash2 size={16} />
                    <span className="line-through opacity-70">File lama akan dihapus</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRemoveFile(false)}
                    className="text-xs font-medium hover:underline"
                  >
                    Batal hapus
                  </button>
                </div>
              )}
              {file && (
                <div className="flex items-center justify-between w-full sm:w-auto gap-4 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Paperclip size={16} />
                    <span>File baru: {file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-1 text-emerald-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                    title="Batal upload"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <label className="relative cursor-pointer bg-white border border-slate-300 hover:bg-slate-50 transition px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium text-slate-700">
                <UploadCloud size={18} className="text-slate-400" />
                Pilih File Baru
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
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
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
          <MaterialPreviewCard
            title={title}
            content={content}
            order={order}
            file={file}
            fileUrl={removeFile ? '' : existingFileUrl}
            showInfoBanner={true}
          />
          
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
      )}

      <ConfirmDialog
        open={showLeaveConfirm}
        title="Keluar tanpa menyimpan?"
        description="Perubahan belum disimpan. Jika keluar sekarang, semua perubahan akan hilang."
        confirmText="Keluar"
        onConfirm={() => navigate(`/dosen/classes/${classId}/materials`)}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
}


