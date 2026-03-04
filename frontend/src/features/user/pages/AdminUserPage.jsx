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
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-slate-100">
            {users.map(u => (
              <div
                key={u.id}
                className="p-4 hover:bg-slate-50 cursor-pointer transition flex items-center gap-3"
                onClick={() => navigate(`/admin/users/${u.id}/edit`)}
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-blue-700 font-bold text-sm">
                    {u.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{u.name}</p>
                  <p className="text-sm text-slate-500 truncate">{u.email}</p>
                </div>
                <Badge variant={roleVariant(u.role)}>{roleLabel(u.role)}</Badge>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-12 text-center">No.</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u, index) => (
                  <TableRow
                    key={u.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/admin/users/${u.id}/edit`)}
                  >
                    <TableCell className="text-center text-slate-500 text-sm">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <span className="text-blue-700 font-bold text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-slate-900">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleVariant(u.role)} title="Role menentukan akses menu dan fitur">
                        {roleLabel(u.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${u.id}/edit`); }}
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
