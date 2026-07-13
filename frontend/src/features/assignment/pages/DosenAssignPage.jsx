import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Search } from 'lucide-react';
import Breadcrumb from '@/shared/components/navigation/Breadcrumb';
import ConfirmDialog from '@/shared/components/feedback/ConfirmDialog';
import { useDosenAssignments } from '../hooks/useDosenAssignments';
import { DosenAssignmentCard } from '../components/DosenAssignmentCard';

/**
 * Assignments - Daftar Tugas Kelas (Dosen)
 * Menampilkan semua tugas dengan status dan navigasi ke submissions
 */
export default function Assignments() {
  const navigate = useNavigate();
  const {
    classId,
    assignments,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    deleteConfirm,
    setDeleteConfirm,
    filteredAssignments,
    fetchAssignments,
    handleDelete,
    isDeadlinePassed,
    isDeadlineNear,
    formatDate,
    getRelativeTime,
  } = useDosenAssignments();

  if (!classId || classId === 'undefined') {
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
          { label: 'Kelas', to: `/dosen/classes/${classId}` },
          { label: 'Tugas' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Daftar Tugas
          </h1>
          <p className="text-slate-500 mt-1">Buat dan kelola tugas untuk mahasiswa</p>
        </div>

        <button
          onClick={() => navigate(`/dosen/classes/${classId}/assignments/new`)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          Buat Tugas
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari tugas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Assignment Count */}
      {!loading && !error && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <ClipboardList size={16} />
          <span>
            {filteredAssignments.length} dari {assignments.length} tugas
          </span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border shadow-sm p-6 animate-pulse">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                </div>
                <div className="h-10 w-32 bg-slate-200 rounded-lg" />
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
            onClick={() => fetchAssignments()}
            className="mt-3 text-sm text-red-600 hover:underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && assignments.length === 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <ClipboardList size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Belum Ada Tugas</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            Belum ada tugas di kelas ini. Buat tugas pertama untuk mulai memberikan penilaian kepada mahasiswa.
          </p>
          <button
            onClick={() => navigate(`/dosen/classes/${classId}/assignments/new`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            Buat Tugas Pertama
          </button>
        </div>
      )}

      {/* No Search Results */}
      {!loading && !error && assignments.length > 0 && filteredAssignments.length === 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Search size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Tidak Ditemukan</h3>
          <p className="text-slate-500">Tidak ada tugas yang cocok dengan "{searchQuery}"</p>
        </div>
      )}

      {/* Assignment List */}
      {!loading && !error && filteredAssignments.length > 0 && (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <DosenAssignmentCard
              key={assignment.id}
              assignment={assignment}
              isDeadlinePassed={isDeadlinePassed(assignment.dueDate)}
              isDeadlineNear={isDeadlineNear(assignment.dueDate)}
              formatDate={formatDate}
              getRelativeTime={getRelativeTime}
              onViewSubmissions={() =>
                navigate(`/dosen/classes/${classId}/assignments/${assignment.id}/submissions`)
              }
              onEdit={() => navigate(`/dosen/classes/${classId}/assignments/${assignment.id}/edit`)}
              onDelete={() => setDeleteConfirm(assignment)}
            />
          ))}
        </div>
      )}

      {/* Tips Section */}
      {!loading && assignments.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
          <h4 className="font-semibold text-amber-900 mb-2">💡 Tips</h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• Tulis instruksi tugas dengan jelas menggunakan format Markdown</li>
            <li>• Tetapkan deadline yang realistis agar mahasiswa punya waktu cukup</li>
            <li>• Pantau submission secara berkala untuk memberikan feedback tepat waktu</li>
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteConfirm)}
        title="Hapus tugas ini?"
        description="Tindakan ini akan menghapus tugas dan semua submission mahasiswa."
        confirmText="Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
