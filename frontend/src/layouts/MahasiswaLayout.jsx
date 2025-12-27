import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Award,
  ClipboardList,
  Menu,
  X,
} from 'lucide-react';
import { Footer } from '../components/footer';
import { Navbar } from '../components/navigation';


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
      label: 'Nilai Saya',
      to: '/mahasiswa/grades',
      icon: Award,
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
        {/* Sidebar */}
        <aside
          className={`
            fixed top-20 left-0 h-[calc(100vh-5rem)] bg-white border-r border-slate-200 z-50 lg:z-30
            transform transition-all duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'}
            lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:translate-x-0 lg:w-72 lg:shrink-0
          `}
        >
          {/* Mobile close button (tanpa header sidebar) */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 z-10 p-2 hover:bg-slate-100 rounded-lg transition"
            aria-label="Tutup sidebar"
          >
            <X size={20} className="text-slate-500" />
          </button>

          {/* Navigation */}
          <nav className="flex-1 p-4 lg:pt-6">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
                    ${active
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                  `}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

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
