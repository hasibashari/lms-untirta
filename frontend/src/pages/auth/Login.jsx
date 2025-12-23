import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);

      // Redirect berdasarkan role
      if (user.role === 'ADMIN') navigate('/admin/dashboard');
      if (user.role === 'DOSEN') navigate('/dosen/dashboard');
      if (user.role === 'MAHASISWA') navigate('/mahasiswa/dashboard');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <h1 className='text-xl font-bold'>Login</h1>

      {error && <p className='text-red-600'>{error}</p>}

      <Input label='Email' value={email} onChange={e => setEmail(e.target.value)} />

      <Input
        label='Password'
        type='password'
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <Button type='submit' disabled={loading}>
        {loading ? 'Masuk...' : 'Login'}
      </Button>
    </form>
  );
};

export default Login;
