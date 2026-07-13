import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Info } from 'lucide-react';
import CourseCard from '../../course/components/CourseCard';
import { useDosenClasses } from '../hooks/useDosenClasses';

/**
 * MyClasses / Kelas Saya (Dosen)
 * Halaman untuk menampilkan daftar mata kuliah yang diampu dosen (READ-ONLY)
 * Kelas dibuat oleh Admin, dosen hanya mengelola kelas yang sudah ditugaskan
 * 
 * OPTIMASI:
 * - Menggunakan single API call dengan stats (menghindari N+1 query)
 * - useCallback untuk mencegah re-create function
 * - useRef untuk abort controller (cancel outdated requests)
 */
const MyClasses = () => {
  const navigate = useNavigate();
  const {
    filteredClasses,
    classes,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    fetchClasses,
  } = useDosenClasses();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
          Kelas Saya
        </h1>
        <p className="text-slate-500 mt-1">
          Daftar kelas yang Anda ampu
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Informasi</p>
          <p>
            Kelas dibuat dan dikelola oleh Admin. Anda dapat mengelola materi, tugas,
            dan nilai untuk kelas yang sudah ditugaskan kepada Anda.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kelas atau kode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Course Count */}
      {!loading && !error && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <BookOpen size={16} />
          <span>
            {filteredClasses.length} dari {classes.length} kelas
          </span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-pulse">
              <div className="h-24 bg-slate-200"></div>
              <div className="p-5 space-y-3">
                <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-10 bg-slate-200 rounded mt-4"></div>
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
            onClick={fetchClasses}
            className="mt-3 text-sm text-red-600 hover:underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && classes.length === 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <BookOpen size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Belum Ada Kelas
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Anda belum ditugaskan untuk mengampu kelas.
            Hubungi admin untuk penugasan kelas.
          </p>
        </div>
      )}

      {/* No Search Results */}
      {!loading && !error && classes.length > 0 && filteredClasses.length === 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Search size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Tidak Ditemukan
          </h3>
          <p className="text-slate-500">
            Tidak ada kelas yang cocok dengan "{searchQuery}"
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 text-blue-600 hover:underline font-medium"
          >
            Reset Pencarian
          </button>
        </div>
      )}

      {/* Course Grid */}
      {!loading && !error && filteredClasses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classObj) => (
            <CourseCard
              key={classObj.id}
              title={`${classObj.course?.title} - Kelas ${classObj.section}`}
              code={classObj.course?.code}
              teacher={{ name: classObj.lecturer?.name || 'Anda' }}
              semester={classObj.course?.semester}
              sks={classObj.course?.sks}
              studentsCount={classObj.krsEnrollmentsCount || 0}
              materialsCount={classObj.materialsCount || 0}
              schedule={classObj.schedule}
              description={classObj.room ? `Ruang: ${classObj.room}` : ''}
              onClick={() => navigate(`/dosen/classes/${classObj.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClasses;
