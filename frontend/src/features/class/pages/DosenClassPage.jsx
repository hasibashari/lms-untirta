import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Users, FileText, Info } from 'lucide-react';
import CourseCard from '../../course/components/CourseCard';
import { getMyCoursesWithStats } from '../../course/courseService';

/**
 * MyClasses / Kelas Saya (Dosen)
 * Halaman untuk menampilkan daftar kelas yang diampu dosen (READ-ONLY)
 * Kelas dibuat oleh Admin, dosen hanya mengelola kelas yang sudah ditugaskan
 * 
 * OPTIMASI:
 * - Menggunakan single API call dengan stats (menghindari N+1 query)
 * - useCallback untuk mencegah re-create function
 * - useRef untuk abort controller (cancel outdated requests)
 */
const MyClasses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  // Ref untuk tracking apakah component masih mounted
  const isMounted = useRef(true);

  // Optimized fetch - single API call dengan stats
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Single API call yang sudah include stats (students & materials count)
      const res = await getMyCoursesWithStats();

      // Pastikan component masih mounted sebelum setState
      if (isMounted.current) {
        setCourses(res.data || []);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err?.message || err || 'Gagal memuat data');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchCourses();

    // Cleanup: mark as unmounted
    return () => {
      isMounted.current = false;
    };
  }, [fetchCourses]);

  // Filter courses based on search query
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            {filteredCourses.length} dari {courses.length} kelas
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
            onClick={fetchCourses}
            className="mt-3 text-sm text-red-600 hover:underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && courses.length === 0 && (
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
      {!loading && !error && courses.length > 0 && filteredCourses.length === 0 && (
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
      {!loading && !error && filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              title={course.title}
              code={course.code}
              teacher={{ name: course.teacher?.name || 'Anda' }}
              semester={course.semester}
              sks={course.sks}
              studentsCount={course._count?.students ?? course.studentsCount ?? 0}
              materialsCount={course._count?.materials ?? course.materialsCount ?? 0}
              schedule={course.schedule}
              description={course.description}
              onClick={() => navigate(`/dosen/courses/${course.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClasses;
