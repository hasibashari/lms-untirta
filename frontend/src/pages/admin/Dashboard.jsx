import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className='space-y-4'>
      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div>
          <h1 className='text-xl font-bold'>Admin Dashboard</h1>
          <p className='text-sm text-gray-600'>
            Kelola user dan memastikan akses admin/dosen berjalan lancar.
          </p>
        </div>

        <div className='flex gap-2'>
          <Button variant='secondary' onClick={() => navigate('/admin/users')}>
            Kelola Users
          </Button>
          <Button onClick={() => navigate('/admin/users/new')}>Tambah User</Button>
        </div>
      </div>

      <Card title='Mulai Cepat'>
        <div className='flex flex-wrap gap-2'>
          <Button variant='secondary' onClick={() => navigate('/admin/users')}>
            Lihat Semua Users
          </Button>
          <Button variant='secondary' onClick={() => navigate('/admin/users/new')}>
            Buat User (Admin/Dosen)
          </Button>
        </div>
        <p className='text-sm text-gray-600 mt-3'>
          Fokus utama admin saat ini: manajemen user dan role.
        </p>
      </Card>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card title='Ringkasan'>
          <div className='space-y-2 text-sm text-gray-700'>
            <p>
              <span className='text-gray-500'>Total User:</span> —
            </p>
            <p>
              <span className='text-gray-500'>Total Kelas:</span> —
            </p>
            <p>
              <span className='text-gray-500'>Total Dosen:</span> —
            </p>
          </div>
          <p className='text-xs text-gray-500 mt-3'>
            Angka ringkasan bisa diisi nanti; yang penting alur kerja admin sudah jelas.
          </p>
        </Card>

        <Card title='Akun'>
          <p className='text-sm text-gray-700'>Halo, {user?.name}</p>
          <button onClick={logout} className='text-red-600 hover:underline text-sm mt-3'>
            Logout
          </button>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
