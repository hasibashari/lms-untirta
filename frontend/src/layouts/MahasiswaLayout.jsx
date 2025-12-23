import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MahasiswaLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className='min-h-screen flex'>
      <aside className='w-64 bg-green-700 text-white p-4 flex flex-col'>
        <h2 className='text-lg font-bold mb-6'>Mahasiswa Panel</h2>
        <nav className='space-y-2 flex-1'>
          <Link
            to='/mahasiswa/dashboard'
            className='block px-4 py-2 rounded hover:bg-green-600 transition'
          >
            Dashboard
          </Link>
          <Link
            to='/mahasiswa/dashboard'
            className='block px-4 py-2 rounded hover:bg-green-600 transition'
          >
            Kelas Saya
          </Link>
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

export default MahasiswaLayout;
