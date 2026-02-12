import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { Footer } from '../components/footer';
import { Navbar } from '../components/navigation';
import SidebarNav from '../components/SidebarNav';
import { getDashboardNavItems } from '../utils/navigation';

const DashboardLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = getDashboardNavItems(user?.role);

  const isActive = (path) => {
    const item = navItems.find((i) => i.to === path);
    if (item?.exact) return location.pathname === path;
    if (item?.aliases) {
      return (
        item.aliases.some((alias) => location.pathname.startsWith(alias)) ||
        location.pathname.startsWith(path)
      );
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1">
        <SidebarNav
          navItems={navItems}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isActive={isActive}
        />

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

      <Footer />
    </div>
  );
};

export default DashboardLayout;
