import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Search, BookOpen, Users, ChevronRight } from 'lucide-react';
import { getMyClasses } from '@/features/class/api/class.api';

const DosenGradeListPage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const isMounted = useRef(true);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyClasses();
      if (isMounted.current) {
        setClasses(res.data?.data || res.data || []);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err?.message || 'Gagal memuat data kelas');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchClasses();
    return () => { isMounted.current = false; };
  }, [fetchClasses]);

  const filteredClasses = classes.filter((cls) => {
    const q = searchQuery.toLowerCase();
    const title = cls.course?.title || cls.title || '';
    const code = cls.course?.code || cls.code || '';
    return title.toLowerCase().includes(q) || code.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
          Input Nilai Akhir
        </h1>
        <p className="text-slate-500 mt-1">
          Pilih kelas untuk menginput nilai akhir mahasiswa
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative flex-1">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari mata kuliah atau kode..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Count */}
      {!loading && !error && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <BookOpen size={16} />
          <span>{filteredClasses.length} dari {classes.length} kelas</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-1/2 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={fetchClasses} className="mt-3 text-sm text-red-600 hover:underline">
            Coba lagi
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && classes.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Award size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Belum Ada Kelas</h3>
          <p className="text-slate-500">Anda belum memiliki kelas untuk dinilai.</p>
        </div>
      )}

      {/* No Search Results */}
      {!loading && !error && classes.length > 0 && filteredClasses.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Search size={32} className="text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Tidak Ditemukan</h3>
          <p className="text-slate-500">Tidak ada kelas yang cocok dengan &quot;{searchQuery}&quot;</p>
          <button onClick={() => setSearchQuery('')} className="mt-4 text-blue-600 hover:underline font-medium">
            Reset Pencarian
          </button>
        </div>
      )}

      {/* Class List */}
      {!loading && !error && filteredClasses.length > 0 && (
        <div className="space-y-3">
          {filteredClasses.map((cls) => {
            const title = cls.course?.title || cls.title || 'Mata Kuliah';
            const code = cls.course?.code || cls.code || '-';
            const section = cls.section || '';
            const studentCount = cls.krsEnrollmentsCount || 0;

            return (
              <button
                key={cls.id}
                onClick={() => navigate(`/dosen/classes/${cls.id}/grades`)}
                className="w-full bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Award size={24} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    <span>{code}</span>
                    {section && <span>Kelas {section}</span>}
                    <span className="inline-flex items-center gap-1">
                      <Users size={14} />
                      {studentCount} mahasiswa
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-400 group-hover:text-blue-500 transition shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DosenGradeListPage;
