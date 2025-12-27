import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, ArrowRight, Award, Clock } from 'lucide-react';
import { getMyCourses, getMyDashboardStats } from '../../services/mahasiswa.service';
import { StudentCourseCard } from '../../components/course';

/**
 * MahasiswaDashboard
 * Halaman utama setelah login untuk mahasiswa
 * Fokus: Overview/ringkasan pembelajaran
 * Berbeda dari MyClasses yang menampilkan daftar lengkap
 */
const MahasiswaDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getMyCourses(), getMyDashboardStats()])
      .then(([coursesRes, statsRes]) => {
        setCourses(coursesRes.data);
        setStats(statsRes.data);
      })
      .catch(err => setError(err.message || 'Gagal memuat data'))
      .finally(() => setLoading(false));
  }, []);

  // Stats cards - menampilkan informasi yang lebih bermakna
  const statsCards = [
    {
      label: 'Total Kelas',
      value: stats?.totalCourses || courses.length,
      icon: BookOpen,
      color: 'blue',
    },
    {
      label: 'Tugas Pending',
      value: stats?.pendingAssignments || 0,
      icon: Clock,
      color: 'amber',
      highlight: (stats?.pendingAssignments || 0) > 0,
    },
    {
      label: 'Tugas Dinilai',
      value: stats?.gradedAssignments || 0,
      icon: Award,
      color: 'emerald',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  // Preview hanya 3 kelas terbaru
  const previewCourses = courses.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
          Selamat Datang! 👋
        </h1>
        <p className="text-slate-500 mt-1">
          Berikut adalah ringkasan pembelajaran Anda hari ini.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`bg-white rounded-2xl border p-5 hover:shadow-md transition ${stat.highlight ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-200'
                }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[stat.color]}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{loading ? '-' : stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/mahasiswa/classes"
          className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition">
            <BookOpen size={24} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Kelas Saya</h3>
            <p className="text-sm text-slate-500">{courses.length} kelas terdaftar</p>
          </div>
          <ArrowRight size={20} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/mahasiswa/grades"
          className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition">
            <Award size={24} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Nilai Saya</h3>
            <p className="text-sm text-slate-500">{stats?.gradedAssignments || 0} tugas dinilai</p>
          </div>
          <ArrowRight size={20} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
        </Link>

        {stats?.pendingAssignments > 0 ? (
          <Link
            to="/mahasiswa/grades"
            className="group flex items-center gap-4 p-5 bg-amber-50 rounded-2xl border border-amber-200 hover:border-amber-300 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition">
              <ClipboardList size={24} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">Tugas Pending</h3>
              <p className="text-sm text-amber-700">{stats.pendingAssignments} tugas menunggu</p>
            </div>
            <ArrowRight size={20} className="text-amber-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
          </Link>
        ) : (
          <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <ClipboardList size={24} className="text-slate-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-500">Tidak Ada Tugas</h3>
              <p className="text-sm text-slate-400">Semua tugas selesai</p>
            </div>
          </div>
        )}
      </div>

      {/* Course Preview Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Kelas Terbaru</h2>
            <p className="text-sm text-slate-500">Preview kelas yang Anda ikuti</p>
          </div>
          {courses.length > 3 && (
            <Link
              to="/mahasiswa/classes"
              className="flex items-center gap-1 text-blue-600 font-medium hover:underline"
            >
              Lihat Semua
              <ArrowRight size={16} />
            </Link>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
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

        {!loading && !error && courses.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <BookOpen size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Belum Ada Kelas
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Anda belum terdaftar di kelas manapun. Hubungi dosen atau admin untuk didaftarkan.
            </p>
          </div>
        )}

        {!loading && !error && previewCourses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {previewCourses.map((enrollment) => (
              <StudentCourseCard
                key={enrollment.enrollmentId}
                enrollment={enrollment}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MahasiswaDashboard;
