import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminGuard = () => {
  const { user, loading } = useAuth();

  if (loading) return <p>Memeriksa sesi...</p>;

  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default AdminGuard;
