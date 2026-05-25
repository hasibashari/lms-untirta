import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';
import { Users, BookOpen, GraduationCap, UserCheck, LayoutDashboard } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import DashboardJumbotron from '@/shared/components/layout/Jumbotron';
import PageLoader from '@/shared/components/feedback/PageLoader';
import { useAdminStats } from '../../user/hooks/useAdminStats';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
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

  const colorClasses = {
    blue: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    violet: 'bg-violet-500/10 text-violet-600',
    amber: 'bg-amber-500/10 text-amber-600',
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className='space-y-6'>
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

      {/* Error Banner */}
      {fetchError && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm'>
          {fetchError.message || 'Gagal memuat data dashboard'}
        </div>
      )}

      {/* Stats Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {statCards.map(stat => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              onClick={() => navigate(stat.to)}
              className='bg-card rounded-xl border border-border p-5 hover:shadow-sm hover:border-primary/50 transition cursor-pointer'
            >
              <div className='flex items-center gap-4'>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[stat.color]}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className='text-2xl font-bold text-card-foreground'>
                    {isLoading ? '-' : stat.value}
                  </p>
                  <p className='text-sm text-muted-foreground'>{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            <Button variant='secondary' onClick={() => navigate('/admin/users')}>
              Lihat Semua Users
            </Button>
            <Button variant='secondary' onClick={() => navigate('/admin/users/new')}>
              Buat User Baru
            </Button>
            <Button variant='secondary' onClick={() => navigate('/admin/courses')}>
              Kelola Kelas
            </Button>
          </div>
          <p className='text-sm text-muted-foreground mt-4'>
            Fokus utama admin: manajemen user, pembuatan kelas, dan penugasan dosen pembimbing.
          </p>
        </CardContent>
      </Card>

      {/* Account Card */}
      <Card>
        <CardHeader>
          <CardTitle>Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>Halo, {user?.name}</p>
          <button onClick={logout} className='text-destructive hover:underline text-sm mt-3'>
            Logout
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
