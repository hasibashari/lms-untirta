import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ClipboardList,
  Calendar,
  Save,
  X,
  AlertCircle,
  Eye,
  Edit3,
  FileText,
} from 'lucide-react';
import { createAssignment, getAssignmentDetail, updateAssignment } from '../assignment.service';
import { MarkdownEditor, MarkdownPreview } from '../../../components/ui';
import Breadcrumb from '../../../components/navigation/Breadcrumb';

/**
 * CreateAssignment - Form Buat Tugas Baru (Dosen)
 * Mendukung instruksi berbasis Markdown
 */
export default function CreateAssignment() {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();

  // Mode edit jika ada assignmentId
  const isEditMode = Boolean(assignmentId);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview'

  // Fetch data tugas jika mode edit
  useEffect(() => {
    if (isEditMode && assignmentId) {
      setFetchLoading(true);
      getAssignmentDetail(assignmentId)
        .then(res => {
          const data = res.data;
          setTitle(data.title || '');
          setDescription(data.description || '');
          // Format dueDate untuk input datetime-local
          if (data.dueDate) {
            const date = new Date(data.dueDate);
            setDueDate(date.toISOString().slice(0, 16));
          }
        })
        .catch(err => {
          setError(err?.response?.data?.message || err?.message || 'Gagal memuat data tugas');
        })
        .finally(() => setFetchLoading(false));
    }
  }, [isEditMode, assignmentId]);

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
      const payload = {
        title: title.trim(),
        description: description.trim(),
        dueDate,
      };

      if (isEditMode) {
        // Mode Edit: Update tugas yang sudah ada
        await updateAssignment(assignmentId, payload);
      } else {
        // Mode Create: Buat tugas baru
        await createAssignment(courseId, payload);
      }

      navigate(`/dosen/courses/${courseId}/assignments`);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || 'Gagal menyimpan tugas'
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

  // Loading state saat fetch data untuk edit
  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500">Memuat data tugas...</p>
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
          { label: 'Tugas', to: `/dosen/courses/${courseId}/assignments` },
          { label: isEditMode ? 'Edit Tugas' : 'Buat Tugas' },
        ]}
      />

      {/* Page Header dengan Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <ClipboardList size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
              {isEditMode ? 'Edit Tugas' : 'Buat Tugas Baru'}
            </h1>
            <p className="text-slate-500 mt-0.5">
              {isEditMode ? 'Perbarui instruksi tugas' : 'Tulis instruksi tugas dengan jelas menggunakan Markdown'}
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

      {/* Tab Content */}
      {activeTab === 'edit' ? (
        /* ========== EDIT MODE ========== */
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
                  💡 Klik tab <strong>Preview</strong> di atas untuk melihat hasil format Markdown sebelum disimpan
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
                    {isEditMode ? 'Simpan Perubahan' : 'Simpan Tugas'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* ========== PREVIEW MODE ========== */
        <AssignmentPreview
          title={title}
          description={description}
          dueDate={dueDate}
        />
      )}
    </div>
  );
}

/**
 * AssignmentPreview - Komponen Preview Tugas
 * Tampilan yang konsisten dengan halaman mahasiswa
 */
function AssignmentPreview({ title, description, dueDate }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'Belum ditentukan';
    return new Date(dateString).toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Preview Header Info */}
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
        <Eye size={18} className="text-amber-600" />
        <p className="text-sm text-amber-700">
          <strong>Mode Preview:</strong> Tampilan ini sama persis dengan yang akan dilihat mahasiswa
        </p>
      </div>

      {/* Assignment Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Section */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-3">
                <ClipboardList size={14} />
                Tugas
              </span>
              <h1 className="text-2xl md:text-3xl font-bold mb-3">
                {title || 'Judul Tugas'}
              </h1>
              <div className="flex items-center gap-2 text-blue-100">
                <Calendar size={16} />
                <span className="text-sm">
                  <strong className="text-white">Deadline:</strong> {formatDate(dueDate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            Instruksi Tugas
          </h2>

          {/* Instruksi Markdown */}
          {description ? (
            <MarkdownPreview content={description} />
          ) : (
            <div className="text-center py-12 text-slate-400">
              <ClipboardList size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-lg">Belum ada instruksi</p>
              <p className="text-sm">Tulis instruksi tugas di tab Edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
