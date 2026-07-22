import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';
import { resendVerification } from '../api/auth.api';
import { toast } from 'react-hot-toast';

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
  const [isUnverifiedEmail, setIsUnverifiedEmail] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleChange = (e, field) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
    if (isUnverifiedEmail) setIsUnverifiedEmail(false);
    if (resendSuccess) setResendSuccess(false);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setIsUnverifiedEmail(false);
    setResendSuccess(false);
    setIsLoading(true);

    try {
      const user = await login(formData.email, formData.password);

      // Navigasi berdasarkan role
      if (user?.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user?.role === 'DOSEN') navigate('/dosen/dashboard');
      else if (user?.role === 'MAHASISWA') navigate('/mahasiswa/classes');
      else navigate('/');
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Login gagal.';
      setError(errorMessage);

      if (err?.response?.status === 403 || errorMessage.includes('belum diverifikasi')) {
        setIsUnverifiedEmail(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      toast.error('Silakan masukkan alamat email Anda.');
      return;
    }

    setIsResending(true);
    try {
      const res = await resendVerification({ email: formData.email });
      setResendSuccess(true);
      toast.success(res.message || 'Email konfirmasi telah dikirimkan kembali.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal mengirim email konfirmasi.');
    } finally {
      setIsResending(false);
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
    isUnverifiedEmail,
    isResending,
    resendSuccess,
    setRememberMe,
    setShowPassword,
    handleChange,
    handleSubmit,
    handleResendVerification,
    handleGoogleLogin,
    handleFacebookLogin,
  };
};

