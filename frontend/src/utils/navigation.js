import { LayoutDashboard, Users, BookOpen, Inbox } from 'lucide-react';
import { ROLES } from './constants';

const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Kelas', to: '/admin/courses', icon: BookOpen },
];

const DOSEN_NAV_ITEMS = [
  { label: 'Dashboard', to: '/dosen/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Kelas Saya', to: '/dosen/classes', icon: BookOpen, aliases: ['/dosen/courses'] },
  { label: 'Submissions', to: '/dosen/submissions', icon: Inbox },
];

const NAV_MAP = {
  [ROLES.ADMIN]: ADMIN_NAV_ITEMS,
  [ROLES.DOSEN]: DOSEN_NAV_ITEMS,
};

export const getDashboardNavItems = (role) => NAV_MAP[role] || [];
