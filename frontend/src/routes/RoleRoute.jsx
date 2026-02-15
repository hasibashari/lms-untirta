import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageLoader from '../components/shared/PageLoader';

const RoleRoute = ({ roles }) => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user || !roles.includes(user.role)) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default RoleRoute;
