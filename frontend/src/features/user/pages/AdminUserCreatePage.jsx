import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateUser } from '../hooks/useUsers';
import Breadcrumb from '@/shared/components/navigation/Breadcrumb';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { UserForm } from '../components/UserForm';

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
      setError(errorMessage(err));
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
          <UserForm
            form={form}
            onChange={handleChange}
            onSubmit={handleSubmit}
            isPending={createUserMutation.isPending}
            isEditMode={false}
            error={error}
            onCancel={() => navigate('/admin/users')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
