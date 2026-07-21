import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, Award, Clock, LayoutDashboard } from 'lucide-react';
import DashboardJumbotron from '@/shared/components/layout/Jumbotron';
import DashboardSkeleton from '@/shared/components/feedback/DashboardSkeleton';
import StatCard from '@/shared/components/ui/StatCard';
import ActionCard from '@/shared/components/ui/ActionCard';
import { useMahasiswaDashboardData } from '../hooks/useMahasiswaDashboard';

/**
 * MahasiswaDashboard
 * Halaman utama setelah login untuk mahasiswa
 * Fokus: Overview/ringkasan pembelajaran
 */
const MahasiswaDashboard = () => {
  const { data, isLoading, error: fetchError } = useMahasiswaDashboardData();

  const approvedEnrollments = data?.approvedEnrollments || [];
  const stats = data?.stats || null;

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

  if (isLoading) {
    return <DashboardSkeleton statCount={3} actionCount={2} />;
  }

  return (
    <div className="space-y-8">
      {/* Error Banner */}
      {fetchError && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm'>
          {fetchError}
        </div>
      )}

      {/* Jumbotron / Hero Section */}
      <DashboardJumbotron
        icon={LayoutDashboard}
        title="Selamat Datang! 👋"
        subtitle="Berikut adalah ringkasan pembelajaran Anda hari ini."
      >
        <Link
          to="/mahasiswa/classes"
          className="px-4 py-2 text-sm font-medium bg-background text-primary hover:bg-white/25 rounded-lg transition"
        >
          Lihat Kelas
        </Link>
      </DashboardJumbotron>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsCards.map((stat) => (
          <StatCard key={stat.label} {...stat} loading={isLoading} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ActionCard
          title="KRS"
          subtitle="Ambil Mata Kuliah"
          icon={ClipboardList}
          to="/mahasiswa/krs"
          iconContainerClassName="bg-violet-500/10 group-hover:bg-violet-500/20"
          iconClassName="text-violet-600"
        />

        <ActionCard
          title="Kelas Saya"
          subtitle={`${approvedEnrollments.length} kelas terdaftar`}
          icon={BookOpen}
          to="/mahasiswa/classes"
        />
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
