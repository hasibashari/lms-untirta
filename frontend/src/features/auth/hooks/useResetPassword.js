import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword as resetPasswordAPI } from '../api/auth.api';
import { toast } from 'react-hot-toast';
import { getPasswordStrength } from '@/shared/utils/password.util';

export const useResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Token reset password tidak ditemukan atau tautan tidak valid.');
    }
  }, [token]);

  useEffect(() => {
    let timer;
    if (isSuccess && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isSuccess && countdown === 0) {
      navigate('/login', {
        state: {
          successMessage: 'Password Anda telah berhasil diperbarui. Silakan masuk menggunakan password baru Anda.',
        },
      });
    }
    return () => clearInterval(timer);
  }, [isSuccess, countdown, navigate]);

  const handleChange = (e, field) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!token) {
      setError('Token reset password tidak ditemukan.');
      return;
    }

    if (getPasswordStrength(formData.newPassword) < 3) {
      setError('Password terlalu lemah. Harus minimal 8 karakter, mengandung huruf besar, dan angka.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPasswordAPI({
        token,
        newPassword: formData.newPassword,
      });
      setIsSuccess(true);
      toast.success(res.message || 'Password berhasil diubah.');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Gagal mereset password';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login', {
      state: {
        successMessage: 'Password Anda telah berhasil diperbarui. Silakan masuk menggunakan password baru Anda.',
      },
    });
  };

  return {
    token,
    formData,
    showPassword,
    showConfirmPassword,
    isLoading,
    isSuccess,
    countdown,
    error,
    setShowPassword,
    setShowConfirmPassword,
    handleChange,
    handleSubmit,
    handleGoToLogin,
  };
};

