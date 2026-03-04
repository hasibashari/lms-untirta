import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../layout/AppLayout';
import { getNavItems } from '../../config/navigation';

export default function DashboardLayout() {
  const { user } = useAuth();
  const navItems = getNavItems(user?.role, user);

  let roleLabel = 'Menu';
  if (user?.role === 'DOSEN') {
    roleLabel = 'Menu';
  }

  return <AppLayout navItems={navItems} roleLabel={roleLabel} />;
}
