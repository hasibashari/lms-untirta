import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen } from 'lucide-react';

const AdminLayout = () => {
  const navItems = [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Kelas', to: '/admin/courses', icon: BookOpen },
  ];

  return (
    <div className='min-h-screen flex'>
      {/* Sidebar */}
      <aside className='w-64 bg-gray-800 text-white p-4'>
        <h2 className='text-lg font-bold mb-6'>Admin Panel</h2>
        <nav className='space-y-2'>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded px-3 py-2 text-sm transition ${isActive
                    ? 'bg-white/10 font-semibold'
                    : 'hover:bg-white/10'
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}

          <p className='mt-6 text-xs uppercase tracking-wide text-white/60'>
            Catatan
          </p>
          <p className='text-sm text-white/70 leading-snug'>
            Kelola users, kelas, dan penugasan dosen.
          </p>
        </nav>
      </aside>

      {/* Main content */}
      <main className='flex-1 bg-gray-100 p-6'>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
