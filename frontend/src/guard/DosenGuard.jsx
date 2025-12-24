import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DosenGuard = () => {
  const { user, loading } = useAuth();

  if (loading) return <p>Memeriksa sesi...</p>;

  if (!user || user.role !== 'DOSEN') {
    return <Navigate to='/login' replace />;
  }

  return <Outlet />;
};

export default DosenGuard;
