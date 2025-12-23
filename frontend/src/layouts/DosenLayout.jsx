import { Outlet } from 'react-router-dom';

const DosenLayout = () => {
  return (
    <div className='min-h-screen flex'>
      <aside className='w-64 bg-blue-700 text-white p-4'>
        <h2 className='text-lg font-bold mb-6'>Dosen Panel</h2>
        <nav className='space-y-2'>
          <p>Dashboard</p>
          <p>Kelas</p>
          <p>Tugas</p>
        </nav>
      </aside>

      <main className='flex-1 bg-gray-100 p-6'>
        <Outlet />
      </main>
    </div>
  );
};

export default DosenLayout;
