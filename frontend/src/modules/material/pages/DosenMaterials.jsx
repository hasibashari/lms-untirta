import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  GripVertical,
  MoreVertical,
  Trash2,
  Eye,
  X,
  Edit,
  FileDown,
  Video,
  ExternalLink,
  File,
} from 'lucide-react';
import { getMaterialDetail, getMaterials, deleteMaterial } from '../material.service';
import { MarkdownPreview } from '../../../components/ui';
import Breadcrumb from '../../../components/navigation/Breadcrumb';

/**
 * Materials - Daftar Materi Kelas (Dosen)
 * Menampilkan semua materi dengan opsi reorder, edit, dan delete
 */
export default function Materials() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMaterial, setPreviewMaterial] = useState(null); // material detail for modal
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  useEffect(() => {
    if (!courseId || courseId === 'undefined') return;

    setLoading(true);
    getMaterials(courseId)
      .then(res => setMaterials(res.data || []))
      .catch(err => setError(err?.message || 'Gagal memuat data'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const openPreview = async (materialId) => {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewMaterial(null);

    try {
      const res = await getMaterialDetail(materialId);
      setPreviewMaterial(res.data);
    } catch (err) {
      setPreviewError(err?.message || err || 'Gagal memuat preview materi');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDelete = async (materialId) => {
    if (!confirm('Yakin ingin menghapus materi ini?')) return;

    try {
      await deleteMaterial(materialId);
      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    } catch (err) {
      alert(err?.message || err || 'Gagal menghapus materi');
    }
  };

  // Filter materials by search
  const filteredMaterials = materials.filter(mat =>
    mat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          { label: 'Materi' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Materi Pembelajaran
          </h1>
          <p className="text-slate-500 mt-1">
            Kelola materi yang akan dipelajari mahasiswa
          </p>
        </div>

        <Link
          to={`/dosen/courses/${courseId}/materials/new`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          Tambah Materi
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari materi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Materials Count */}
      {!loading && !error && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <BookOpen size={16} />
          <span>{filteredMaterials.length} dari {materials.length} materi</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-red-600 hover:underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && materials.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <FileText size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Belum Ada Materi
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            Mulai dengan menambahkan materi pertama untuk kelas ini.
          </p>
          <Link
            to={`/dosen/courses/${courseId}/materials/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            Tambah Materi Pertama
          </Link>
        </div>
      )}

      {/* No Search Results */}
      {!loading && !error && materials.length > 0 && filteredMaterials.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Search size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Tidak Ditemukan
          </h3>
          <p className="text-slate-500">
            Tidak ada materi yang cocok dengan "{searchQuery}"
          </p>
        </div>
      )}

      {/* Materials List */}
      {!loading && !error && filteredMaterials.length > 0 && (
        <div className="space-y-3">
          {filteredMaterials.map((material, index) => (
            <MaterialCard
              key={material.id}
              material={material}
              index={index}
              courseId={courseId}
              onPreview={() => openPreview(material.id)}
              onEdit={() => navigate(`/dosen/courses/${courseId}/materials/${material.id}/edit`)}
              onDelete={() => handleDelete(material.id)}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {(previewMaterial || previewLoading || previewError) && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setPreviewMaterial(null);
              setPreviewError(null);
              setPreviewLoading(false);
            }}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Eye size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Preview Materi</h2>
                  <p className="text-sm text-slate-500">{previewMaterial?.title || 'Memuat...'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPreviewMaterial(null);
                  setPreviewError(null);
                  setPreviewLoading(false);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              {previewLoading && (
                <div className="text-slate-500">Memuat preview...</div>
              )}

              {previewError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-600 font-medium">{previewError}</p>
                </div>
              )}

              {/* Attachments Links (same shape as mahasiswa) */}
              {previewMaterial?.attachments?.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {previewMaterial.attachments.map((att, idx) => {
                    const type = String(att.type || '').toLowerCase();
                    const isPdf = type === 'pdf';
                    const isVideo = type === 'video';

                    return (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition border ${isPdf
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                          : isVideo
                            ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                          }`}
                      >
                        {isPdf ? <FileDown size={18} /> : isVideo ? <Video size={18} /> : <File size={18} />}
                        {att.label || (isPdf ? 'PDF' : isVideo ? 'Video' : 'Link')}
                        <ExternalLink size={14} />
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Content - Markdown Preview */}
              {previewMaterial?.content ? (
                <div className="prose prose-slate max-w-none">
                  <MarkdownPreview content={previewMaterial.content} />
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileText size={40} className="mx-auto mb-3 text-slate-300" />
                  <p>Tidak ada konten teks untuk materi ini.</p>
                  {(previewMaterial?.attachments?.length > 0) && (
                    <p className="text-sm mt-1">Gunakan link di atas untuk mengakses materi.</p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setPreviewMaterial(null);
                  setPreviewError(null);
                  setPreviewLoading(false);
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl font-medium transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Tips */}
      {!loading && materials.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Gunakan format Markdown untuk membuat konten yang terstruktur</li>
            <li>• Klik tombol <span className="font-semibold">👁 Preview</span> untuk melihat tampilan materi</li>
            <li>• Materi akan tampil sesuai urutan yang Anda tentukan</li>
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * MaterialCard - Card untuk setiap item materi
 */
function MaterialCard({ material, index, onPreview, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  const getBadgeInfo = () => {
    const hasText = Boolean(material.content);
    const atts = Array.isArray(material.attachments) ? material.attachments : [];
    const types = new Set(atts.map((a) => String(a.type || '').toLowerCase()));

    return {
      hasText,
      hasPdf: types.has('pdf') || Boolean(material.fileUrl),
      hasVideo: types.has('video') || Boolean(material.videoUrl),
      hasLink: types.has('link'),
    };
  };

  const badges = getBadgeInfo();

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all overflow-hidden">
      <div className="flex items-center gap-4 p-5">
        {/* Drag Handle (for future reordering) */}
        <div className="hidden sm:flex shrink-0 text-slate-300 cursor-grab">
          <GripVertical size={20} />
        </div>

        {/* Order Number */}
        <div className="shrink-0 w-12 h-12 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-lg">
          {material.order || index + 1}
        </div>

        {/* Content - Clickable for Preview */}
        <button
          onClick={onPreview}
          className="flex-1 min-w-0 text-left"
        >
          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition truncate">
            {material.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {/* Content indicator badges */}
            <div className="flex items-center gap-1.5">
              {badges.hasText && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                  <FileText size={12} />
                  Teks
                </span>
              )}
              {badges.hasPdf && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">
                  <FileDown size={12} />
                  PDF
                </span>
              )}
              {badges.hasVideo && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                  <Video size={12} />
                  Video
                </span>
              )}
              {badges.hasLink && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs">
                  <ExternalLink size={12} />
                  Link
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Actions - Semua tombol langsung terlihat */}
        <div className="shrink-0 flex items-center gap-2">
          {/* Preview Button */}
          <button
            onClick={onPreview}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
            title="Preview Materi"
          >
            <Eye size={16} />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Edit Button */}
          <button
            onClick={() => onEdit?.()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
            title="Edit Materi"
          >
            <Edit size={16} />
            <span className="hidden sm:inline">Edit</span>
          </button>

          {/* Delete Button - Langsung terlihat dengan styling merah */}
          <button
            onClick={() => onDelete?.()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
            title="Hapus Materi"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Hapus</span>
          </button>

          {/* More Options - Opsional, untuk aksi tambahan di masa depan */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <MoreVertical size={18} />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-30 py-2">
                  {/* Dropdown bisa kosong atau untuk aksi lain */}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
