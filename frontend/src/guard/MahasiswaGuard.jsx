import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MahasiswaGuard = () => {
  const { user, loading } = useAuth();

  if (loading) return <p>Memeriksa sesi...</p>;

  if (!user || user.role !== 'MAHASISWA') {
    return <Navigate to='/login' replace />;
  }

  return <Outlet />;
};

export default MahasiswaGuard;
