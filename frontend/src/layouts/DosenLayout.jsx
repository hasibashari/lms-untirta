import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DosenLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className='min-h-screen flex'>
      <aside className='w-64 bg-blue-700 text-white p-4'>
        <h2 className='text-lg font-bold mb-6'>Dosen Panel</h2>
        <nav className='space-y-2'>
          <NavLink
            to='/dosen/dashboard'
            className={({ isActive }) =>
              `block rounded px-3 py-2 text-sm ${isActive
                ? 'bg-white/15 font-semibold'
                : 'hover:bg-white/10'
              }`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to='/dosen/classes'
            className={({ isActive }) =>
              `block rounded px-3 py-2 text-sm ${isActive
                ? 'bg-white/15 font-semibold'
                : 'hover:bg-white/10'
              }`
            }
          >
            Kelas Saya
          </NavLink>
        </nav>

        <button
          onClick={handleLogout}
          className='mt-4 w-full px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition'
        >
          Logout
        </button>
      </aside>

      <main className='flex-1 bg-gray-100 p-6'>
        <Outlet />
      </main>
    </div>
  );
};

export default DosenLayout;
