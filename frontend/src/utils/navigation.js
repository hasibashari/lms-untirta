import { LayoutDashboard, Users, BookOpen, Inbox, FileCheck, GraduationCap, Calendar, UserCheck, Layers } from 'lucide-react';
import { ROLES } from './constants';

const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Mata Kuliah', to: '/admin/courses', icon: BookOpen },
  { label: 'Kelas Offering', to: '/admin/classes', icon: Layers },
  { label: 'Konfigurasi Akademik', to: '/admin/academic', icon: Calendar },
  { label: 'Dosen Pembimbing', to: '/admin/advisor-assignment', icon: UserCheck },
  { label: 'Monitoring KRS', to: '/admin/krs', icon: FileCheck },
  { label: 'Transkrip', to: '/admin/transcript', icon: GraduationCap },
];

const DOSEN_NAV_ITEMS = [
  { label: 'Dashboard', to: '/dosen/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Kelas Saya', to: '/dosen/classes', icon: BookOpen, aliases: ['/dosen/courses'] },
  { label: 'Submissions', to: '/dosen/submissions', icon: Inbox },
];

const DOSEN_DOSPEM_NAV_ITEMS = [
  { label: 'Dashboard', to: '/dosen/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Kelas Saya', to: '/dosen/classes', icon: BookOpen, aliases: ['/dosen/courses'] },
  { label: 'Perwalian', to: '/dosen/advisory', icon: UserCheck },
  { label: 'Submissions', to: '/dosen/submissions', icon: Inbox },
];

const NAV_MAP = {
  [ROLES.ADMIN]: ADMIN_NAV_ITEMS,
  [ROLES.DOSEN]: DOSEN_NAV_ITEMS,
};

export const getDashboardNavItems = (role, user = null) => {
  if (role === ROLES.DOSEN && user?.isDospem) {
    return DOSEN_DOSPEM_NAV_ITEMS;
  }
  return NAV_MAP[role] || [];
};
