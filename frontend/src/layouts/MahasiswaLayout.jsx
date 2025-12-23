import { Outlet } from 'react-router-dom';

const MahasiswaLayout = () => {
  return (
    <div className='min-h-screen flex'>
      <aside className='w-64 bg-green-700 text-white p-4'>
        <h2 className='text-lg font-bold mb-6'>Mahasiswa Panel</h2>
        <nav className='space-y-2'>
          <p>Dashboard</p>
          <p>Kelas Saya</p>
          <p>Nilai</p>
        </nav>
      </aside>

      <main className='flex-1 bg-gray-100 p-6'>
        <Outlet />
      </main>
    </div>
  );
};

export default MahasiswaLayout;
