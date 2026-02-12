import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageLoader } from '../components/shared';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
