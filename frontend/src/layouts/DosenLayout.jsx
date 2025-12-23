import { NavLink, Outlet } from 'react-router-dom';

const DosenLayout = () => {
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

          <p className='mt-4 text-xs uppercase tracking-wide text-white/70'>
            Kelas
          </p>
          <p className='text-sm text-white/80 leading-snug'>
            Pilih kelas dari Dashboard untuk mengelola materi, mahasiswa, tugas, dan submission.
          </p>
        </nav>
      </aside>

      <main className='flex-1 bg-gray-100 p-6'>
        <Outlet />
      </main>
    </div>
  );
};

export default DosenLayout;
