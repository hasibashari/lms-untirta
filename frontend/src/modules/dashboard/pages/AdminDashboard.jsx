import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Users, BookOpen, GraduationCap, UserCheck } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { getUsers, getDosen, getMahasiswa } from '../../user/user.service';
import { getAllCourses } from '../../course/course.service';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalDosen: 0,
    totalMahasiswa: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, coursesRes, dosenRes, mahasiswaRes] = await Promise.all([
          getUsers(),
          getAllCourses().catch(() => ({ data: [] })),
          getDosen(),
          getMahasiswa(),
        ]);

        setStats({
          totalUsers: usersRes.data?.length || 0,
          totalCourses: coursesRes.data?.length || 0,
          totalDosen: dosenRes.data?.length || 0,
          totalMahasiswa: mahasiswaRes.data?.length || 0,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total User', value: stats.totalUsers, icon: Users, color: 'blue', to: '/admin/users' },
    { label: 'Total Kelas', value: stats.totalCourses, icon: BookOpen, color: 'emerald', to: '/admin/courses' },
    { label: 'Total Dosen', value: stats.totalDosen, icon: UserCheck, color: 'violet', to: '/admin/users' },
    { label: 'Total Mahasiswa', value: stats.totalMahasiswa, icon: GraduationCap, color: 'amber', to: '/admin/users' },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    violet: 'bg-violet-100 text-violet-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Admin Dashboard</h1>
          <p className='text-gray-600 mt-1'>
            Kelola user, kelas, dan penugasan dosen.
          </p>
        </div>

        <div className='flex gap-2'>
          <Button variant='secondary' onClick={() => navigate('/admin/users')}>
            Kelola Users
          </Button>
          <Button onClick={() => navigate('/admin/courses')}>
            Kelola Kelas
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {statCards.map(stat => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              onClick={() => navigate(stat.to)}
              className='bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition cursor-pointer'
            >
              <div className='flex items-center gap-4'>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[stat.color]}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className='text-2xl font-bold text-gray-900'>
                    {loading ? '-' : stat.value}
                  </p>
                  <p className='text-sm text-gray-500'>{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card title='Aksi Cepat'>
        <div className='flex flex-wrap gap-2'>
          <Button variant='secondary' onClick={() => navigate('/admin/users')}>
            Lihat Semua Users
          </Button>
          <Button variant='secondary' onClick={() => navigate('/admin/users/new')}>
            Buat User (Admin/Dosen)
          </Button>
          <Button variant='secondary' onClick={() => navigate('/admin/courses')}>
            Kelola Kelas
          </Button>
        </div>
        <p className='text-sm text-gray-600 mt-4'>
          Fokus utama admin: manajemen user, pembuatan kelas, dan penugasan dosen ke kelas.
        </p>
      </Card>

      {/* Account Card */}
      <Card title='Akun'>
        <p className='text-sm text-gray-700'>Halo, {user?.name}</p>
        <button onClick={logout} className='text-red-600 hover:underline text-sm mt-3'>
          Logout
        </button>
      </Card>
    </div>
  );
};

export default AdminDashboard;
