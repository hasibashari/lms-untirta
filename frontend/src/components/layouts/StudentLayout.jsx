import { useAuth } from '../../contexts/AuthContext';
import AppLayout from './AppLayout';
import { getNavItems } from '../../config/navigation';

export default function StudentLayout() {
  const { user } = useAuth();
  const navItems = getNavItems('MAHASISWA', user);

  return <AppLayout navItems={navItems} roleLabel="Menu" />;
}