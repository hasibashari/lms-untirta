import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { resetPassword as resetPasswordAPI } from '../api/auth.api';
import { toast } from 'react-hot-toast';
import { getPasswordStrength } from '@/shared/utils/password.util';

export const useResetPassword = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

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
    if (!email) {
      setError('Email tidak valid atau tidak ditemukan.');
    }
  }, [email]);

  const handleChange = (e, field) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
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
        email,
        newPassword: formData.newPassword,
      });
      setIsSuccess(true);
      toast.success(res.message || 'Password berhasil diubah.');
    } catch (err) {
      setError(err.message || 'Gagal mereset password');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
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
