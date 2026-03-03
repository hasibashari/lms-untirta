import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUsers } from '../userService';
import Breadcrumb from '../../../components/navigation/Breadcrumb';
import { Button } from '@/components/ui/button';
import Card from '../../../components/ui/Card';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const flash = location.state?.flash;

  useEffect(() => {
    setLoading(true);
    setError(null);
    getUsers()
      .then(res => setUsers(res.data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);

  const errorMessage = err =>
    err?.response?.data?.message || err?.message || 'Terjadi kesalahan.';

  const roleLabel = role => {
    if (role === 'ADMIN') return 'Admin';
    if (role === 'DOSEN') return 'Dosen';
    if (role === 'MAHASISWA') return 'Mahasiswa';
    return role || '-';
  };

  const rolePillClass = role => {
    if (role === 'ADMIN') return 'bg-gray-900 text-white';
    if (role === 'DOSEN') return 'bg-blue-100 text-blue-700';
    if (role === 'MAHASISWA') return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className='space-y-4'>
      <Breadcrumb
        items={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Users' },
        ]}
      />

      <div className='flex justify-between items-start gap-3 flex-wrap'>
        <div>
          <h1 className='text-xl font-bold'>Manajemen User</h1>
          <p className='text-sm text-gray-600'>
            Kelola akun dan pastikan role (Admin/Dosen/Mahasiswa) benar.
          </p>
        </div>

        <Button onClick={() => navigate('/admin/users/new')}>Tambah User</Button>
      </div>

      {flash && (
        <div className='bg-green-50 border border-green-200 text-green-800 rounded p-3 text-sm'>
          {flash}
        </div>
      )}

      {loading && <p className='text-gray-600'>Memuat user...</p>}
      {error && <p className='text-red-600'>{errorMessage(error)}</p>}

      {!loading && !error && users.length === 0 && (
        <Card title='Belum ada user'>
          <p className='text-sm text-gray-600'>Mulai dengan membuat Admin/Dosen.</p>
          <div className='mt-3'>
            <Button onClick={() => navigate('/admin/users/new')}>Buat User</Button>
          </div>
        </Card>
      )}

      {!loading && !error && users.length > 0 && (
        <div className='overflow-x-auto bg-white rounded shadow'>
          <table className='w-full'>
            <thead className='bg-gray-100 text-sm'>
              <tr>
                <th className='p-3 text-left'>Nama</th>
                <th className='p-3 text-left'>Email</th>
                <th className='p-3 text-left'>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className='border-t text-sm'>
                  <td className='p-3'>{u.name}</td>
                  <td className='p-3 text-gray-700'>{u.email}</td>
                  <td className='p-3'>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${rolePillClass(
                        u.role
                      )}`}
                      title='Role menentukan akses menu dan fitur'
                    >
                      {roleLabel(u.role)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
