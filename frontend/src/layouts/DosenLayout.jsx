import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Inbox,
  Menu,
} from 'lucide-react';
import { Footer } from '../components/footer';
import { Navbar } from '../components/navigation';
import SidebarNav from '../components/SidebarNav';

/**
 * DosenLayout
 * Layout utama untuk role Dosen dengan sidebar navigasi modern
 * Desain konsisten dengan MahasiswaLayout
 */
const DosenLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    {
      label: 'Dashboard',
      to: '/dosen/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Kelas Saya',
      to: '/dosen/classes',
      icon: BookOpen,
    },
    {
      label: 'Submissions',
      to: '/dosen/submissions',
      icon: Inbox,
    },
  ];

  // Check if current path starts with the nav item path (for nested routes)
  const isActive = (path) => {
    if (path === '/dosen/dashboard') {
      return location.pathname === path;
    }
    // Special handling for courses routes - they belong to "Kelas Saya"
    if (path === '/dosen/classes' && location.pathname.startsWith('/dosen/courses')) {
      return true;
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
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default DosenLayout;
