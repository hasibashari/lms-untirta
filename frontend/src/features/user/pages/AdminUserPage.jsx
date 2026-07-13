import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Breadcrumb from '@/shared/components/navigation/Breadcrumb';
import { Button } from '@/shared/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import PaginationComponent from '@/shared/components/data-display/Pagination';
import PageLoader from '@/shared/components/feedback/PageLoader';
import { useUsers, useDeleteUser } from '../hooks/useUsers';
import ConfirmDialog from '@/shared/components/feedback/ConfirmDialog';
import { UserMobileCard } from '../components/UserMobileCard';
import { UserTable } from '../components/UserTable';

export default function Users() {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const navigate = useNavigate();
  const location = useLocation();
  const flash = location.state?.flash;

  const { data, isLoading, isError, error: fetchError } = useUsers({ page: currentPage, limit });
  const deleteMutation = useDeleteUser();
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const users = data?.data || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.total || 0;

  const handleDelete = (user, e) => {
    e.stopPropagation();
    setDeleteConfirm(user);
  };

  const handleEdit = (userId) => {
    navigate(`/admin/users/${userId}/edit`);
  };

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

      {isLoading && <PageLoader />}
      {isError && <p className='text-red-600'>{errorMessage(fetchError)}</p>}

      {!isLoading && !isError && users.length === 0 && (
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

      {!isLoading && !isError && users.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-slate-100">
            {users.map(u => (
              <UserMobileCard
                key={u.id}
                user={u}
                roleVariant={roleVariant}
                roleLabel={roleLabel}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <UserTable
              users={users}
              currentPage={currentPage}
              limit={limit}
              roleVariant={roleVariant}
              roleLabel={roleLabel}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>
      )}

      {!isLoading && !isError && users.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 px-1">
          <p className="text-sm text-slate-500 order-2 sm:order-1">
            Menampilkan <span className="font-medium text-slate-900">{users.length}</span> dari <span className="font-medium text-slate-900">{totalItems}</span> user
          </p>
          <div className="order-1 sm:order-2">
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteConfirm)}
        title="Hapus user ini?"
        description={`User ${deleteConfirm?.name || ''} akan dihapus secara permanen.`}
        confirmText="Hapus"
        onConfirm={() =>
          deleteMutation.mutate(deleteConfirm.id, {
            onSuccess: () => setDeleteConfirm(null),
            onError: () => setDeleteConfirm(null),
          })
        }
        onCancel={() => setDeleteConfirm(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
