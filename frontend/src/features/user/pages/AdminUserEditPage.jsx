import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserById, updateUser } from '../userService';
import Breadcrumb from '../../../components/navigation/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminUserEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'DOSEN',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUserById(id)
      .then(res => {
        const data = res.data;
        setForm({
          name: data.name,
          email: data.email,
          role: data.role,
          password: '',
        });
      })
      .catch(err => setError(err))
      .finally(() => setInitLoading(false));
  }, [id]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = { ...form };
      if (!payload.password) {
        delete payload.password;
      }

      await updateUser(id, payload);
      navigate('/admin/users', { state: { flash: 'User sukses di-update.' } });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const errorMessage = err =>
    err?.response?.data?.message || err?.message || 'Gagal mengubah user.';

  if (initLoading) {
    return <div className="p-10 text-gray-500">Memuat data user...</div>;
  }

  return (
    <div className='space-y-4'>
      <Breadcrumb
        items={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Users', to: '/admin/users' },
          { label: 'Edit User' },
        ]}
      />

      <div className='flex items-start justify-between gap-3 flex-wrap'>
        <div>
          <h1 className='text-xl font-bold'>Edit User</h1>
          <p className='text-sm text-gray-600'>Ubah profil dan role pengguna ini.</p>
        </div>
        <Button variant='secondary' onClick={() => navigate('/admin/users')}>
          Kembali
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className='space-y-4'>
            {error && (
              <p className='text-sm text-red-600'>{errorMessage(error)}</p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name">Nama <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                name="name"
                placeholder="Nama lengkap"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                name="email"
                placeholder="email@kampus.ac.id"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name='role'
                className='w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm'
                value={form.role}
                onChange={handleChange}
              >
                <option value='DOSEN'>Dosen</option>
                <option value='ADMIN'>Admin</option>
                <option value='MAHASISWA'>Mahasiswa</option>
              </select>
              <p className='text-xs text-gray-500'>Role menentukan akses menu dan fitur.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password Baru</Label>
              <Input
                id="password"
                name="password"
                placeholder="*** (Kosongkan bila tidak ingin diubah)"
                type="password"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <div className='flex gap-2 pt-2'>
              <Button type='submit' disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
              <Button
                type='button'
                variant='secondary'
                onClick={() => navigate('/admin/users')}
              >
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
