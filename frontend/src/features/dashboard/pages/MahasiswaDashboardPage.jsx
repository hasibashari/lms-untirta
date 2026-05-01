import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, ArrowRight, Award, Clock, LayoutDashboard } from 'lucide-react';
import DashboardJumbotron from '../../../components/shared/DashboardJumbotron';
import { useMahasiswaDashboardData } from '../hooks/useMahasiswaDashboard';
import PageLoader from '../../../components/shared/PageLoader';

/**
 * MahasiswaDashboard
 * Halaman utama setelah login untuk mahasiswa
 * Fokus: Overview/ringkasan pembelajaran
 */
const MahasiswaDashboard = () => {
  const { data, isLoading, error: fetchError } = useMahasiswaDashboardData();
  
  const approvedEnrollments = data?.approvedEnrollments || [];
  const stats = data?.stats || null;

  // Stats cards - menampilkan informasi yang lebih bermakna
  const statsCards = [
    {
      label: 'Total Kelas',
      value: stats?.totalCourses || approvedEnrollments.length,
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
    blue: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    amber: 'bg-amber-500/10 text-amber-600',
  };

  // Preview hanya 3 kelas terbaru
  return (
    <div className="space-y-8">
      {fetchError && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm'>
          {fetchError}
        </div>
      )}

      {isLoading && <PageLoader />}

      {/* Jumbotron / Hero Section */}
      <DashboardJumbotron
        icon={LayoutDashboard}
        title="Selamat Datang! 👋"
        subtitle="Berikut adalah ringkasan pembelajaran Anda hari ini."
      >
        <Link
          to="/mahasiswa/classes"
          className="px-4 py-2 text-sm font-medium bg-background text-primary hover:bg-primary/10 rounded-lg transition"
        >
          Lihat Kelas
        </Link>
      </DashboardJumbotron>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`bg-card rounded-xl border p-5 hover:shadow-sm transition ${stat.highlight ? 'border-amber-300 ring-1 ring-amber-100' : 'border-border'
                }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[stat.color]}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">{isLoading ? '-' : stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
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
          className="group flex items-center gap-4 p-5 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-sm transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition">
            <ClipboardList size={24} className="text-violet-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-card-foreground">KRS</h3>
            <p className="text-sm text-muted-foreground">Ambil Mata Kuliah</p>
          </div>
          <ArrowRight size={20} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/mahasiswa/classes"
          className="group flex items-center gap-4 p-5 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-sm transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition">
            <BookOpen size={24} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-card-foreground">Kelas Saya</h3>
            <p className="text-sm text-muted-foreground">{approvedEnrollments.length} kelas terdaftar</p>
          </div>
          <ArrowRight size={20} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </Link>
      </div>


      {/* Info kecil pengingat kelas */}
      <div className="mt-8">
        <p className="text-sm text-muted-foreground italic">
          Untuk melihat daftar kelas lengkap, silakan buka menu <span className="font-semibold text-primary">Kelas Saya</span>.
        </p>
      </div>
    </div>
  );
};

export default MahasiswaDashboard;
