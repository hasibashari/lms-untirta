import { LayoutDashboard, Users, BookOpen, Inbox, FileCheck, GraduationCap, Calendar, UserCheck, Layers, Award, FileText } from 'lucide-react';
import { ROLES } from '../utils/constants';

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
  { label: 'Input Nilai Akhir', to: '/dosen/grades', icon: Award },
  { label: 'Submissions', to: '/dosen/submissions', icon: Inbox },
];

const DOSEN_DOSPEM_NAV_ITEMS = [
  { label: 'Dashboard', to: '/dosen/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Kelas Saya', to: '/dosen/classes', icon: BookOpen, aliases: ['/dosen/courses'] },
  { label: 'Input Nilai Akhir', to: '/dosen/grades', icon: Award },
  { label: 'Perwalian', to: '/dosen/advisory', icon: UserCheck },
  { label: 'Submissions', to: '/dosen/submissions', icon: Inbox },
];

const MAHASISWA_NAV_ITEMS = [
  { label: 'Dashboard', to: '/mahasiswa/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Kelas Saya', to: '/mahasiswa/classes', icon: BookOpen },
  { label: 'Nilai Saya', to: '/mahasiswa/grades', icon: Award, description: 'Daftar Nilai Tugas' },
  { label: 'Rencana Studi', to: '/mahasiswa/krs', icon: FileText, description: 'Kartu Rencana Studi' },
  { label: 'Hasil Studi', to: '/mahasiswa/study-result', icon: GraduationCap, description: 'Transkrip Nilai' },
];

const NAV_MAP = {
  [ROLES.ADMIN]: ADMIN_NAV_ITEMS,
  [ROLES.DOSEN]: DOSEN_NAV_ITEMS,
  [ROLES.MAHASISWA]: MAHASISWA_NAV_ITEMS,
};

export const getNavItems = (role, user = null) => {
  if (role === ROLES.DOSEN && user?.isDospem) {
    return DOSEN_DOSPEM_NAV_ITEMS;
  }
  return NAV_MAP[role] || [];
};
