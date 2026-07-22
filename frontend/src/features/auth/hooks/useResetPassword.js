import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { resetPassword as resetPasswordAPI } from '../api/auth.api';
import { toast } from 'react-hot-toast';
import { getPasswordStrength } from '@/shared/utils/password.util';

export const useResetPassword = () => {
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
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Token reset password tidak ditemukan atau tautan tidak valid.');
    }
  }, [token]);

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

  return {
    token,
    formData,
    showPassword,
    showConfirmPassword,
    isLoading,
    isSuccess,
    error,
    setShowPassword,
    setShowConfirmPassword,
    handleChange,
    handleSubmit,
  };
};

