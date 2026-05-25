import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';

export const useLoginForm = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e, field) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await login(formData.email, formData.password);

      // Navigasi berdasarkan role
      if (user?.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user?.role === 'DOSEN') navigate('/dosen/dashboard');
      else if (user?.role === 'MAHASISWA') navigate('/mahasiswa/classes');
      else navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Login gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Logic Google Login nantinya di sini
  };

  const handleFacebookLogin = () => {
    // Logic Facebook Login nantinya di sini
  };

  return {
    formData,
    rememberMe,
    isLoading,
    error,
    showPassword,
    setRememberMe,
    setShowPassword,
    handleChange,
    handleSubmit,
    handleGoogleLogin,
    handleFacebookLogin,
  };
};
