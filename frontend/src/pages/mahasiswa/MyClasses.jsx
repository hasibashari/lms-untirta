import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Filter } from 'lucide-react';
import { getMyCourses } from '../../services/mahasiswa.service';
import { StudentCourseCard } from '../../components/course';

/**
 * MyClasses / Kelas Saya
 * Halaman khusus untuk menampilkan daftar lengkap kelas mahasiswa
 * Terpisah dari Dashboard untuk UX yang lebih fokus
 */
const MyClasses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getMyCourses()
      .then(res => setCourses(res.data))
      .catch(err => setError(err.message || 'Gagal memuat data'))
      .finally(() => setLoading(false));
  }, []);

  // Filter courses based on search query
  const filteredCourses = courses.filter(enrollment =>
    enrollment.course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enrollment.course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enrollment.course.teacher?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
          Kelas Saya
        </h1>
        <p className="text-slate-500 mt-1">
          Daftar lengkap kelas yang Anda ikuti
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kelas, kode, atau dosen..."
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
            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
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
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-red-600 hover:underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && courses.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <BookOpen size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Belum Ada Kelas
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-4">
            Anda belum terdaftar di kelas manapun. Silakan ambil mata kuliah melalui menu KRS.
          </p>
          <a
            href="/mahasiswa/krs"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <BookOpen size={18} />
            Buka KRS
          </a>
        </div>
      )}

      {/* No Search Results */}
      {!loading && !error && courses.length > 0 && filteredCourses.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Search size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Tidak Ditemukan
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Tidak ada kelas yang cocok dengan pencarian "{searchQuery}"
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 text-blue-600 hover:underline font-medium"
          >
            Reset Pencarian
          </button>
        </div>
      )}

      {/* Courses Grid */}
      {!loading && !error && filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((enrollment) => (
            <StudentCourseCard
              key={enrollment.enrollmentId}
              enrollment={enrollment}
              onClick={(courseId) => navigate(`/mahasiswa/courses/${courseId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClasses;
