import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search } from 'lucide-react';
import CourseCard from '../../course/components/CourseCard';
import { Button } from '@/components/ui/button';

/**
 * MyClasses / Kelas Saya
 * Halaman khusus untuk menampilkan daftar lengkap mata kuliah mahasiswa
 * Terpisah dari Dashboard untuk UX yang lebih fokus
 */
import { useMyClasses } from '../../krs/hooks/useMyClasses';

/**
 * MyClasses / Kelas Saya
 */
const MyClasses = () => {
  const navigate = useNavigate();
  const { data: approvedEnrollments = [], isLoading: loading, error: fetchError } = useMyClasses();
  const [searchQuery, setSearchQuery] = useState('');
  const error = fetchError?.message || null;

  // Filter class offerings based on search query
  const filteredClasses = approvedEnrollments.filter((enrollment) =>
    enrollment.class.course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enrollment.class.course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enrollment.class.lecturer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enrollment.class.section?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
          Kelas Saya
        </h1>
        <p className="text-slate-500 mt-1">
          Daftar lengkap kelas offering yang Anda ikuti
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari mata kuliah, kode, kelas, atau dosen..."
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
            {filteredClasses.length} dari {approvedEnrollments.length} kelas offering
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
          <Button
            onClick={() => window.location.reload()}
            variant="link"
            className="mt-3 text-sm text-red-600"
          >
            Coba lagi
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && approvedEnrollments.length === 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <BookOpen size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Belum Ada Kelas Offering</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-4">
            Anda belum memiliki kelas yang disetujui. Silakan isi KRS melalui menu Study Plan.
          </p>
          <a
            href="/mahasiswa/study-plan"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <BookOpen size={18} />
            Buka Study Plan
          </a>
        </div>
      )}

      {/* No Search Results */}
      {!loading && !error && approvedEnrollments.length > 0 && filteredClasses.length === 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Search size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Tidak Ditemukan
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Tidak ada kelas yang cocok dengan pencarian "{searchQuery}"
          </p>
          <Button
            onClick={() => setSearchQuery('')}
            variant="link"
            className="mt-4 text-blue-600 font-medium"
          >
            Reset Pencarian
          </Button>
        </div>
      )}

      {/* Courses Grid */}
      {!loading && !error && filteredClasses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((enrollment) => (
            <CourseCard
              key={enrollment.id}
              title={enrollment.class.course.title}
              code={`${enrollment.class.course.code} · Kelas ${enrollment.class.section}`}
              teacher={{ name: enrollment.class.lecturer?.name || '-' }}
              semester={enrollment.class.course.semester}
              sks={enrollment.class.course.sks}
              studentsCount={enrollment.class._count?.krsEnrollments || 0}
              materialsCount={enrollment.class.course._count?.materials || 0}
              onClick={() => navigate(`/mahasiswa/courses/${enrollment.class.course.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClasses;
