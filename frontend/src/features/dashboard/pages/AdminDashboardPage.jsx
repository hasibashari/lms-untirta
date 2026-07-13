import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';
import { Users, BookOpen, GraduationCap, UserCheck, LayoutDashboard } from 'lucide-react';
import DashboardJumbotron from '@/shared/components/layout/Jumbotron';
import PageLoader from '@/shared/components/feedback/PageLoader';
import StatCard from '@/shared/components/ui/StatCard';
import ActionCard from '@/shared/components/ui/ActionCard';
import { useAdminStats } from '../../user/hooks/useAdminStats';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, error: fetchError } = useAdminStats();

  const stats = {
    totalUsers: data?.data?.totalUsers || 0,
    totalCourses: data?.data?.totalCourses || 0,
    totalDosen: data?.data?.totalDosen || 0,
    totalMahasiswa: data?.data?.totalMahasiswa || 0,
  };

  const statCards = [
    { label: 'Total User', value: stats.totalUsers, icon: Users, color: 'blue', to: '/admin/users' },
    { label: 'Total Kelas', value: stats.totalCourses, icon: BookOpen, color: 'emerald', to: '/admin/courses' },
    { label: 'Total Dosen', value: stats.totalDosen, icon: UserCheck, color: 'violet', to: '/admin/users' },
    { label: 'Total Mahasiswa', value: stats.totalMahasiswa, icon: GraduationCap, color: 'amber', to: '/admin/users' },
  ];

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className='space-y-8'>
      {/* Error Banner */}
      {fetchError && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm'>
          {fetchError.message || 'Gagal memuat data dashboard'}
        </div>
      )}

      {/* Jumbotron / Hero Section */}
      <DashboardJumbotron
        icon={LayoutDashboard}
        title={`Selamat Datang, ${user?.name || 'Admin'}!`}
        subtitle="Kelola user, kelas, dan penugasan dosen pembimbing dari satu tempat."
      >
        <button
          onClick={() => navigate('/admin/users')}
          className="px-4 py-2 text-sm font-medium bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-lg transition"
        >
          Kelola Users
        </button>
        <button
          onClick={() => navigate('/admin/courses')}
          className="px-4 py-2 text-sm font-medium bg-background text-primary hover:bg-white/25 rounded-lg transition"
        >
          Kelola Kelas
        </button>
      </DashboardJumbotron>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {statCards.map(stat => (
          <StatCard key={stat.label} {...stat} loading={isLoading} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <ActionCard
          title="Lihat Semua Users"
          subtitle="Kelola data pengguna"
          icon={Users}
          to="/admin/users"
          iconContainerClassName="bg-blue-500/10 group-hover:bg-blue-500/20"
          iconClassName="text-blue-600"
        />
        <ActionCard
          title="Buat User Baru"
          subtitle="Tambah entitas pengguna"
          icon={UserCheck}
          to="/admin/users/new"
          iconContainerClassName="bg-emerald-500/10 group-hover:bg-emerald-500/20"
          iconClassName="text-emerald-600"
        />
        <ActionCard
          title="Kelola Kelas"
          subtitle="Manajemen program kelas"
          icon={BookOpen}
          to="/admin/courses"
          iconContainerClassName="bg-violet-500/10 group-hover:bg-violet-500/20"
          iconClassName="text-violet-600"
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
