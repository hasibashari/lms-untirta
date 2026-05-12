import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';
import PageLoader from '@/shared/components/feedback/PageLoader';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
