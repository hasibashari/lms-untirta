import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ClipboardList,
  Calendar,
  Save,
  X,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { createAssignment } from '../../services/dosen.service';
import { MarkdownEditor } from '../../components/ui';
import Breadcrumb from '../../components/navigation/Breadcrumb';

/**
 * CreateAssignment - Form Buat Tugas Baru (Dosen)
 * Mendukung instruksi berbasis Markdown
 */
export default function CreateAssignment() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get minimum datetime (now + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!courseId || courseId === 'undefined') return;

    // Validation
    if (!title.trim()) {
      setError('Judul tugas tidak boleh kosong');
      return;
    }

    if (!dueDate) {
      setError('Deadline harus diisi');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createAssignment(courseId, {
        title: title.trim(),
        description: description.trim(),
        dueDate,
      });

      navigate(`/dosen/courses/${courseId}/assignments`);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || 'Gagal membuat tugas'
      );
    } finally {
      setLoading(false);
    }
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
          { label: 'Tugas', to: `/dosen/courses/${courseId}/assignments` },
          { label: 'Buat Tugas' },
        ]}
      />

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
          <ClipboardList size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Buat Tugas Baru
          </h1>
          <p className="text-slate-500 mt-0.5">
            Tulis instruksi tugas dengan jelas menggunakan Markdown
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle size={20} className="text-red-600 shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Title Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Judul Tugas <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError(null);
                }}
                placeholder="Contoh: Tugas 1 - Analisis Algoritma Sorting"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            {/* Deadline Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Deadline <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    setError(null);
                  }}
                  min={getMinDateTime()}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Deadline minimal 1 jam dari sekarang
              </p>
            </div>

            {/* Description / Instructions */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Instruksi Tugas
              </label>
              <p className="text-xs text-slate-500 mb-2">
                💡 Gunakan tab <span className="font-semibold text-blue-600">"Preview"</span> di editor untuk melihat hasil format Markdown sebelum disimpan
              </p>
              <MarkdownEditor
                value={description}
                onChange={setDescription}
                placeholder="Tulis instruksi tugas dengan detail..."
                minHeight={300}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate(`/dosen/courses/${courseId}/assignments`)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl font-medium transition"
            >
              <X size={18} />
              Batal
            </button>

            <button
              type="submit"
              disabled={loading || !title.trim() || !dueDate}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-blue-200"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Simpan Tugas
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tips Card */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Lightbulb size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-2">Tips Menulis Instruksi yang Baik</h4>
              <ul className="text-sm text-amber-800 space-y-1.5">
                <li>• <strong>Jelaskan tujuan</strong> - Apa yang akan dipelajari mahasiswa dari tugas ini?</li>
                <li>• <strong>Langkah-langkah</strong> - Berikan langkah yang jelas dan terstruktur</li>
                <li>• <strong>Format pengumpulan</strong> - File apa yang harus dikumpulkan? (PDF, ZIP, link repo)</li>
                <li>• <strong>Kriteria penilaian</strong> - Bagaimana tugas akan dinilai?</li>
                <li>• <strong>Referensi</strong> - Sertakan link atau sumber yang membantu</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Example Template */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h4 className="font-semibold text-slate-900 mb-3">📝 Contoh Template Instruksi</h4>
          <div className="bg-white rounded-lg p-4 font-mono text-sm text-slate-700 overflow-x-auto">
            <pre className="whitespace-pre-wrap">{`## Tujuan
Mahasiswa dapat mengimplementasikan algoritma sorting dan menganalisis kompleksitasnya.

## Instruksi
1. Implementasikan 3 algoritma sorting: Bubble Sort, Quick Sort, dan Merge Sort
2. Buat analisis kompleksitas waktu dan ruang untuk masing-masing algoritma
3. Bandingkan performa ketiga algoritma dengan dataset yang berbeda

## Format Pengumpulan
- File ZIP berisi source code dan laporan PDF
- Nama file: \`NIM_Nama_Tugas1.zip\`

## Kriteria Penilaian
| Aspek | Bobot |
|-------|-------|
| Implementasi benar | 40% |
| Analisis kompleksitas | 30% |
| Laporan & dokumentasi | 30% |

## Referensi
- [Visualgo - Sorting](https://visualgo.net/en/sorting)
- Slide pertemuan ke-5`}</pre>
          </div>
        </div>
      </form>
    </div>
  );
}
