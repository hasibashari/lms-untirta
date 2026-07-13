import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserById } from '../api/user.api';
import Breadcrumb from '@/shared/components/navigation/Breadcrumb';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import PageLoader from '@/shared/components/feedback/PageLoader';
import { useUpdateUser } from '../hooks/useUsers';
import { UserForm } from '../components/UserForm';

export default function AdminUserEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const updateUserMutation = useUpdateUser();

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'DOSEN',
    password: '',
  });

  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState(null);

  const errorMessage = err =>
    err?.response?.data?.message || err?.message || 'Gagal mengubah user.';

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
      .catch(err => setError(errorMessage(err)))
      .finally(() => setInitLoading(false));
  }, [id]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    try {
      const payload = { ...form };
      if (!payload.password) {
        delete payload.password;
      }

      await updateUserMutation.mutateAsync({ id, payload });
      navigate('/admin/users', { state: { flash: 'User sukses di-update.' } });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (initLoading) {
    return <PageLoader />;
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
          <UserForm
            form={form}
            onChange={handleChange}
            onSubmit={handleSubmit}
            isPending={updateUserMutation.isPending}
            isEditMode={true}
            error={error}
            onCancel={() => navigate('/admin/users')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
