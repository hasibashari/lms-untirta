import { useAuth } from '@/app/providers/AuthContext';
import AppLayout from './AppLayout';
import { getNavItems } from '@/shared/config/navigation';

export default function DashboardLayout() {
  const { user } = useAuth();
  const navItems = getNavItems(user?.role, user);

  let roleLabel = 'Menu';
  if (user?.role === 'DOSEN') {
    roleLabel = 'Menu';
  }

  return <AppLayout navItems={navItems} roleLabel={roleLabel} />;
}
