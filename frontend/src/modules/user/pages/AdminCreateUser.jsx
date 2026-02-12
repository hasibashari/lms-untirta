import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../user.service';
import Breadcrumb from '../../../components/navigation/Breadcrumb';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Card from '../../../components/ui/Card';

export default function CreateUser() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DOSEN',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    try {
      await createUser(form);
      navigate('/admin/users', {
        state: { flash: 'User berhasil dibuat.' },
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
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
          <p className='text-sm text-gray-600'>Buat akun untuk Admin atau Dosen.</p>
        </div>
        <Button variant='secondary' onClick={() => navigate('/admin/users')}>
          Kembali
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className='space-y-4 max-w-lg'>
          {error && (
            <p className='text-sm text-red-600'>{errorMessage(error)}</p>
          )}

          <Input
            label='Nama'
            name='name'
            placeholder='Nama lengkap'
            value={form.name}
            onChange={handleChange}
            required
          />

          <Input
            label='Email'
            name='email'
            placeholder='email@kampus.ac.id'
            value={form.email}
            onChange={handleChange}
            required
          />

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
            </select>
            <p className='text-xs text-gray-500'>Role menentukan akses menu dan fitur.</p>
          </div>

          <Input
            label='Password'
            name='password'
            placeholder='Minimal 8 karakter (sesuaikan kebijakan)'
            type='password'
            value={form.password}
            onChange={handleChange}
            required
          />

          <div className='flex gap-2'>
            <Button type='submit' disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
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
      </Card>
    </div>
  );
}
