import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUsers } from '../userService';
import Breadcrumb from '../../../components/navigation/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const flash = location.state?.flash;

  useEffect(() => {
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

  const roleVariant = role => {
    if (role === 'ADMIN') return 'default';
    if (role === 'DOSEN') return 'secondary';
    if (role === 'MAHASISWA') return 'outline';
    return 'outline';
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
        <Card>
          <CardHeader>
            <CardTitle>Belum ada user</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-gray-600'>Mulai dengan membuat Admin/Dosen.</p>
            <div className='mt-3'>
              <Button onClick={() => navigate('/admin/users/new')}>Buat User</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && users.length > 0 && (
        <div className='overflow-x-auto bg-white rounded shadow'>
          <Table>
            <TableHeader className='bg-gray-100 text-sm hover:bg-gray-100'>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id} className='text-sm'>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className='text-gray-700'>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleVariant(u.role)} title='Role menentukan akses menu dan fitur'>
                      {roleLabel(u.role)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
