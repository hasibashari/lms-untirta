import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, ArrowRight, Award, Clock } from 'lucide-react';
import { getMyCourses, getMyDashboardStats } from '../../services/mahasiswa.service';

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

      {/* Quick Actions (penting saja) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/mahasiswa/study-plan"
          className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-violet-300 hover:shadow-lg transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition">
            <ClipboardList size={24} className="text-violet-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">KRS</h3>
            <p className="text-sm text-slate-500">Ambil Mata Kuliah</p>
          </div>
          <ArrowRight size={20} className="text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
        </Link>

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
      </div>


      {/* Info kecil pengingat kelas */}
      <div className="mt-8">
        <p className="text-sm text-slate-500 italic">
          Untuk melihat daftar kelas lengkap, silakan buka menu <span className="font-semibold text-blue-600">Kelas Saya</span>.
        </p>
      </div>
    </div>
  );
};

export default MahasiswaDashboard;
