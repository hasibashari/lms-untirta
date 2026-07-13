import { useParams } from 'react-router-dom';
import {
  Users,
  Search,
  Mail,
  Info,
} from 'lucide-react';
import Breadcrumb from '@/shared/components/navigation/Breadcrumb';
import { useClassStudents } from '../hooks/useClassStudents';

/**
 * Students - Daftar Mahasiswa Kelas (Dosen)
 * Menampilkan daftar mahasiswa yang terdaftar di kelas (READ-ONLY)
 * Mahasiswa mendaftar sendiri melalui KRS, dosen hanya bisa melihat
 */
export default function Students() {
  const { classId } = useParams();
  const { 
    students, 
    filteredStudents, 
    loading, 
    error, 
    searchQuery, 
    setSearchQuery, 
    formatDate, 
    refetch 
  } = useClassStudents(classId);

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
          { label: 'Mahasiswa' },
        ]}
      />

      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
          Daftar Mahasiswa
        </h1>
        <p className="text-slate-500 mt-1">
          Mahasiswa yang terdaftar di kelas ini
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Informasi</p>
          <p>
            Mahasiswa mendaftar ke kelas melalui sistem KRS.
            Dosen dapat melihat daftar mahasiswa yang sudah terdaftar di kelas ini.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama atau email mahasiswa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Students Count */}
      {!loading && !error && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users size={16} />
          <span>
            {filteredStudents.length} dari {students.length} mahasiswa
          </span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border shadow-sm p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
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
            onClick={() => refetch()}
            className="mt-3 text-sm text-red-600 hover:underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && students.length === 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Users size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Belum Ada Mahasiswa
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Belum ada mahasiswa yang mendaftar ke kelas ini melalui KRS.
          </p>
        </div>
      )}

      {/* No Search Results */}
      {!loading && !error && students.length > 0 && filteredStudents.length === 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Search size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Tidak Ditemukan
          </h3>
          <p className="text-slate-500">
            Tidak ada mahasiswa yang cocok dengan "{searchQuery}"
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 text-blue-600 hover:underline font-medium"
          >
            Reset Pencarian
          </button>
        </div>
      )}

      {/* Students List */}
      {!loading && !error && filteredStudents.length > 0 && (
        <div className="space-y-3">
          {filteredStudents.map((student, index) => (
            <StudentCard key={student.id || index} student={student} formatDate={formatDate} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * StudentCard - Card untuk setiap mahasiswa
 */
function StudentCard({ student, formatDate }) {
  // Generate avatar color based on name
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
  ];
  const colorIndex = student.name ? student.name.charCodeAt(0) % colors.length : 0;
  const avatarColor = colors[colorIndex];

  // Get initials
  const initials = student.name
    ? student.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
    : '??';

  return (
    <div className="group bg-card rounded-xl border border-border shadow-sm hover:border-primary/50 hover:shadow-lg transition-all overflow-hidden">
      <div className="flex items-center gap-4 p-5">
        {/* Avatar */}
        <div className={`shrink-0 w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold`}>
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">
            {student.name || 'Nama tidak tersedia'}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
            <Mail size={14} />
            <span className="truncate">{student.email}</span>
          </div>
        </div>

        {/* Enrolled Date & Status */}
        <div className="shrink-0 text-right">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Aktif
          </span>
          <p className="text-xs text-slate-400 mt-1">
            Bergabung {formatDate(student.enrolledAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
