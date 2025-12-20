import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  return (
    <div className='space-y-4'>
      <h1 className='text-xl font-bold'>Admin Dashboard</h1>

      <p>Halo, {user?.name}</p>

      <button onClick={logout} className='text-red-600 underline'>
        Logout
      </button>
    </div>
  );
};

export default AdminDashboard;
