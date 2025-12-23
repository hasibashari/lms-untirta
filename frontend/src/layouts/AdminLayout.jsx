import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
  return (
    <div className='min-h-screen flex'>
      {/* Sidebar */}
      <aside className='w-64 bg-gray-800 text-white p-4'>
        <h2 className='text-lg font-bold mb-6'>Admin Panel</h2>
        <nav className='space-y-2'>
          <p>Dashboard</p>
          <p>Users</p>
          <p>Classes</p>
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
