import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';
import PageLoader from '@/shared/components/feedback/PageLoader';
import toast from 'react-hot-toast';

// Peta role → dashboard utama masing-masing role
const ROLE_HOME = {
  ADMIN: '/admin/dashboard',
  DOSEN: '/dosen/dashboard',
  MAHASISWA: '/mahasiswa/dashboard',
};

const RoleRoute = ({ roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const hasToasted = useRef(false);

  const isUnauthorized = !loading && user && !roles.includes(user.role);

  useEffect(() => {
    if (isUnauthorized && !hasToasted.current) {
      hasToasted.current = true;
      toast.error('Anda tidak memiliki akses ke halaman tersebut.', {
        id: 'unauthorized-role',
        duration: 4000,
        style: {
          fontWeight: '500',
        },
      });
    }
  }, [isUnauthorized]);

  if (loading) return <PageLoader />;

  // Belum login → ke halaman login
  if (!user) return <Navigate to="/login" replace />;

  // Role tidak sesuai → redirect ke dashboard milik role user, bukan ke login
  if (!roles.includes(user.role)) {
    const homePath = ROLE_HOME[user.role] || '/login';
    return <Navigate to={homePath} replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RoleRoute;
