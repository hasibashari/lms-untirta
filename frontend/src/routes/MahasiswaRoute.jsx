import { Navigate, Outlet } from 'react-router-dom';

const MahasiswaRoute = () => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user || user.role !== 'MAHASISWA') {
    return <Navigate to='/login' replace />;
  }

  return <Outlet />;
};

export default MahasiswaRoute;
