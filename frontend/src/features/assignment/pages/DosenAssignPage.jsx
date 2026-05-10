import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  Search,
  Calendar,
  Clock,
  Users,
  ChevronRight,
  FileText,
  AlertCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import { getAssignments, deleteAssignment } from '../assignmentService';
import Breadcrumb from '../../../components/navigation/Breadcrumb';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';

/**
 * Assignments - Daftar Tugas Kelas (Dosen)
 * Menampilkan semua tugas dengan status dan navigasi ke submissions
 */
export default function Assignments() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (!classId || classId === 'undefined') return;

    setLoading(true);
    getAssignments(classId)
      .then(res => setAssignments(res.data || []))
      .catch(err => setError(err?.message || 'Gagal memuat data'))
      .finally(() => setLoading(false));
  }, [classId]);

  // Handler untuk menghapus tugas
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteAssignment(deleteConfirm.id);
      setAssignments((prev) => prev.filter((a) => a.id !== deleteConfirm.id));
      toast.success('Tugas berhasil dihapus');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menghapus tugas');
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Filter assignments by search
  const filteredAssignments = assignments.filter(assignment =>
    assignment.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if deadline is passed
  const isDeadlinePassed = (dueDate) => new Date(dueDate) < new Date();

  // Check if deadline is near (within 24 hours)
  const isDeadlineNear = (dueDate) => {
    const diff = new Date(dueDate) - new Date();
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  };
  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format relative time
  const getRelativeTime = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;

    if (diff < 0) {
      const days = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Baru saja berakhir';
      return `${days} hari yang lalu`;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} hari ${hours} jam lagi`;
    if (hours > 0) return `${hours} jam lagi`;
    return 'Kurang dari 1 jam';
  };

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
          <p className="text-slate-500 mt-1">
            Buat dan kelola tugas untuk mahasiswa
          </p>
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
                  <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                </div>
                <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
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
      {!loading && !error && assignments.length === 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <ClipboardList size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Belum Ada Tugas
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            Belum ada tugas di kelas ini. Buat tugas pertama untuk mulai memberikan
            penilaian kepada mahasiswa.
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
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Tidak Ditemukan
          </h3>
          <p className="text-slate-500">
            Tidak ada tugas yang cocok dengan "{searchQuery}"
          </p>
        </div>
      )}

      {/* Assignment List */}
      {!loading && !error && filteredAssignments.length > 0 && (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              classId={classId}
              isDeadlinePassed={isDeadlinePassed(assignment.dueDate)}
              isDeadlineNear={isDeadlineNear(assignment.dueDate)}
              formatDate={formatDate}
              getRelativeTime={getRelativeTime}
              onViewSubmissions={() =>
                navigate(`/dosen/classes/${classId}/assignments/${assignment.id}/submissions`)
              }
              onEdit={() =>
                navigate(`/dosen/classes/${classId}/assignments/${assignment.id}/edit`)
              }
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

/**
 * AssignmentCard - Card untuk setiap tugas
 */
function AssignmentCard({
  assignment,
  isDeadlinePassed,
  isDeadlineNear,
  formatDate,
  getRelativeTime,
  onViewSubmissions,
  onEdit,
  onDelete,
}) {
  return (
    <div className="group bg-card rounded-xl border border-border shadow-sm hover:border-primary/50 hover:shadow-lg transition-all overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Assignment Info */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="text-lg font-semibold text-slate-900 mb-2 truncate">
              {assignment.title}
            </h3>

            {/* Description Preview */}
            {assignment.description && (
              <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                {assignment.description.replace(/[#*`]/g, '').substring(0, 150)}
                {assignment.description.length > 150 ? '...' : ''}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {/* Deadline */}
              <div className={`flex items-center gap-1.5 ${isDeadlinePassed
                ? 'text-red-600'
                : isDeadlineNear
                  ? 'text-amber-600'
                  : 'text-slate-500'
                }`}>
                <Calendar size={14} />
                <span>{formatDate(assignment.dueDate)}</span>
              </div>

              {/* Time Remaining */}
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${isDeadlinePassed
                ? 'bg-red-100 text-red-700'
                : isDeadlineNear
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
                }`}>
                <Clock size={12} />
                {getRelativeTime(assignment.dueDate)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="shrink-0 flex items-center gap-2">
            {/* View Submissions Button */}
            <button
              onClick={onViewSubmissions}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
              title="Lihat Submission"
            >
              <Users size={16} />
              <span className="hidden sm:inline">Submission</span>
            </button>

            {/* Edit Button */}
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
              title="Edit Tugas"
            >
              <Edit size={16} />
              <span className="hidden sm:inline">Edit</span>
            </button>

            {/* Delete Button */}
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
              title="Hapus Tugas"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Hapus</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className={`px-6 py-3 border-t ${isDeadlinePassed
        ? 'bg-red-50 border-red-100'
        : isDeadlineNear
          ? 'bg-amber-50 border-amber-100'
          : 'bg-slate-50 border-slate-100'
        }`}>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            {isDeadlinePassed ? (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <AlertCircle size={14} />
                Deadline telah lewat
              </span>
            ) : isDeadlineNear ? (
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <Clock size={14} />
                Deadline segera
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <FileText size={14} />
                Tugas aktif
              </span>
            )}
          </div>

          <span className="text-slate-500">
            Dibuat: {assignment.createdAt
              ? new Date(assignment.createdAt).toLocaleDateString('id-ID')
              : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}
