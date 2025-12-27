import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Plus, Users, FileText } from 'lucide-react';
import { createCourse, getMyCourses } from '../../services/dosen.service';
import Button from '../../components/ui/Button';

/**
 * MyClasses / Kelas Saya (Dosen)
 * Halaman khusus untuk menampilkan daftar lengkap kelas yang diampu
 * Terpisah dari Dashboard untuk UX yang lebih fokus
 */
const MyClasses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create course state
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = () => {
    setLoading(true);
    getMyCourses()
      .then(res => setCourses(res.data))
      .catch(err => setError(err.message || 'Gagal memuat data'))
      .finally(() => setLoading(false));
  };

  const handleCreateCourse = async e => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const res = await createCourse({ title: newTitle, code: newCode });
      const createdCourse = res?.data;

      // Refresh list
      await fetchCourses();

      setNewTitle('');
      setNewCode('');
      setShowCreate(false);

      if (createdCourse?.id) {
        navigate(`/dosen/courses/${createdCourse.id}`);
      }
    } catch (err) {
      setCreateError(err?.response?.data?.message || err?.message || 'Terjadi kesalahan.');
    } finally {
      setCreating(false);
    }
  };

  // Filter courses based on search query
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Kelas Saya
          </h1>
          <p className="text-slate-500 mt-1">
            Daftar lengkap kelas yang Anda ampu
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Tambah Kelas
        </Button>
      </div>

      {/* Create Course Form */}
      {showCreate && (
        <form
          onSubmit={handleCreateCourse}
          className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
        >
          <h3 className="font-semibold text-slate-900">Buat Kelas Baru</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nama Kelas
              </label>
              <input
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="contoh: Pemrograman Web"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kode Kelas
              </label>
              <input
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="contoh: WEB-01"
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                required
              />
            </div>
          </div>

          {createError && (
            <p className="text-sm text-red-600">{createError}</p>
          )}

          <div className="flex gap-3">
            <Button type="submit" variant="primary" disabled={creating}>
              {creating ? 'Menyimpan...' : 'Simpan Kelas'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreate(false);
                setCreateError(null);
                setNewTitle('');
                setNewCode('');
              }}
            >
              Batal
            </Button>
          </div>
        </form>
      )}

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
            onClick={fetchCourses}
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
            Anda belum memiliki kelas. Klik tombol "Tambah Kelas" untuk membuat kelas baru.
          </p>
          <Button
            variant="primary"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Tambah Kelas Pertama
          </Button>
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
          <p className="text-slate-500">
            Tidak ada kelas yang cocok dengan "{searchQuery}"
          </p>
        </div>
      )}

      {/* Course Grid */}
      {!loading && !error && filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              onClick={() => navigate(`/dosen/courses/${course.id}`)}
              className="group cursor-pointer bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all"
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(`/dosen/courses/${course.id}`);
                }
              }}
            >
              {/* Course Header */}
              <div className="h-24 bg-linear-to-br from-blue-500 to-blue-600 p-4 flex items-end">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                  <span className="text-white text-sm font-medium">{course.code}</span>
                </div>
              </div>

              {/* Course Body */}
              <div className="p-5">
                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition mb-2 line-clamp-2">
                  {course.title}
                </h3>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>{course._count?.enrollments || 0} siswa</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText size={14} />
                    <span>{course._count?.materials || 0} materi</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClasses;
