import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Award,
  Menu,
  FileText,
  GraduationCap,
} from 'lucide-react';
import { Footer } from '../components/footer';
import { Navbar } from '../components/navigation';
import SidebarNav from '../components/SidebarNav';


/**
 * MahasiswaLayout
 * Layout utama untuk role Mahasiswa dengan sidebar navigasi modern
 * Terinspirasi dari Dicoding untuk pengalaman belajar yang fokus
 */
const MahasiswaLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar

  const navItems = [
    {
      label: 'Dashboard',
      to: '/mahasiswa/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Kelas Saya',
      to: '/mahasiswa/classes',
      icon: BookOpen,
    },
    {
      label: 'Rencana Studi',
      to: '/mahasiswa/study-plan',
      icon: FileText,
      description: 'Kartu Rencana Studi',
    },
    {
      label: 'Hasil Studi',
      to: '/mahasiswa/study-result',
      icon: GraduationCap,
      description: 'Transkrip Nilai',
    },
  ];

  // Check if current path starts with the nav item path (for nested routes)
  const isActive = (path) => {
    if (path === '/mahasiswa/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Content Wrapper - Sidebar + Main */}
      <div className="flex flex-1">
        {/* Sidebar (Reusable) */}
        <SidebarNav
          navItems={navItems}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isActive={isActive}
        />
        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="p-6 lg:p-8">
            <div className="lg:hidden mb-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
              >
                <Menu size={18} />
                <span className="font-medium">Menu</span>
              </button>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
      {/* Footer - Full Width */}
      <Footer />
    </div>
  );
};

export default MahasiswaLayout;