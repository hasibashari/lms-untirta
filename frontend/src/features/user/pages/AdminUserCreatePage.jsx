import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateUser } from '../hooks/useUsers';
import Breadcrumb from '../../../components/navigation/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function CreateUser() {
  const navigate = useNavigate();
  const createUserMutation = useCreateUser();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DOSEN',
  });

  const [error, setError] = useState(null);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    setError(null);
    try {
      await createUserMutation.mutateAsync(form);
      navigate('/admin/users', {
        state: { flash: 'User berhasil dibuat.' },
      });
    } catch (err) {
      setError(err);
    }
  };

  const errorMessage = err =>
    err?.response?.data?.message || err?.message || 'Gagal membuat user.';

  return (
    <div className='space-y-4'>
      <Breadcrumb
        items={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Users', to: '/admin/users' },
          { label: 'Tambah User' },
        ]}
      />

      <div className='flex items-start justify-between gap-3 flex-wrap'>
        <div>
          <h1 className='text-xl font-bold'>Tambah User</h1>
          <p className='text-sm text-gray-600'>Buat akun untuk Admin, Dosen, atau Mahasiswa.</p>
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

            <div className='space-y-1'>
              <label className='text-sm font-medium text-gray-700'>Role</label>
              <select
                name='role'
                className='w-full px-3 py-2 border rounded'
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
              <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
              <Input
                id="password"
                name="password"
                placeholder="Minimal 8 karakter (sesuaikan kebijakan)"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className='flex gap-2'>
              <Button type='submit' disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? 'Menyimpan...' : 'Simpan'}
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
