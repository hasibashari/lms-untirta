import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginAsAdmin = () => {
    // Simulate login as Admin
    login({ id: 1, name: 'Admin', role: 'ADMIN' }, 'fake-admin-token');
    navigate('/admin/dashboard');
  };

  const handleLoginAsDosen = () => {
    login({ id: 2, name: 'Dosen', role: 'DOSEN' }, 'fake-dosen-token');
    navigate('/dosen/dashboard');
  };

  const handleLoginAsMahasiswa = () => {
    login({ id: 3, name: 'Mahasiswa', role: 'MAHASISWA' }, 'fake-mahasiswa-token');
    navigate('/mahasiswa/dashboard');
  };

  return (
    <div className='space-y-4'>
      <h1 className='text-xl font-bold'>Login (Simulasi)</h1>

      <Button onClick={handleLoginAsAdmin}>Login sebagai Admin</Button>

      <Button variant='secondary' onClick={handleLoginAsDosen}>
        Login sebagai Dosen
      </Button>

      <Button variant='danger' onClick={handleLoginAsMahasiswa}>
        Login sebagai Mahasiswa
      </Button>
    </div>
  );
};

export default Login;
