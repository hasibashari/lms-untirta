import { NavLink, Outlet } from 'react-router-dom';

const AdminLayout = () => {
  return (
    <div className='min-h-screen flex'>
      {/* Sidebar */}
      <aside className='w-64 bg-gray-800 text-white p-4'>
        <h2 className='text-lg font-bold mb-6'>Admin Panel</h2>
        <nav className='space-y-2'>
          <NavLink
            to='/admin/dashboard'
            className={({ isActive }) =>
              `block rounded px-3 py-2 text-sm ${isActive
                ? 'bg-white/10 font-semibold'
                : 'hover:bg-white/10'
              }`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to='/admin/users'
            className={({ isActive }) =>
              `block rounded px-3 py-2 text-sm ${isActive
                ? 'bg-white/10 font-semibold'
                : 'hover:bg-white/10'
              }`
            }
          >
            Users
          </NavLink>

          <p className='mt-4 text-xs uppercase tracking-wide text-white/60'>
            Catatan
          </p>
          <p className='text-sm text-white/70 leading-snug'>
            Gunakan menu Users untuk menambah Admin/Dosen.
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
