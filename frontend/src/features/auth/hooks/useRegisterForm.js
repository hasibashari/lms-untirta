import { useState } from 'react';
import { register as registerAPI } from '../api/auth.api';
import { getPasswordStrength } from '@/shared/utils/password.util';
export const useRegisterForm = ({ onSuccess } = {}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e, field) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);

    if (!agreedToTerms) {
      setError('Anda harus menyetujui syarat & ketentuan.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    if (getPasswordStrength(formData.password) < 3) {
      setError('Password terlalu lemah. Harus minimal 8 karakter, mengandung huruf besar, dan angka.');
      return;
    }

    const allowedDomains = ['untirta.ac.id', 'gmail.com'];
    const emailParts = formData.email.split('@');
    if (emailParts.length < 2 || !allowedDomains.includes(emailParts[1])) {
      setError('Harap gunakan email dengan domain @untirta.ac.id atau @gmail.com');
      return;
    }

    setIsLoading(true);
    try {
      await registerAPI({
        name: formData.fullName,
        email: formData.email.toLowerCase(),
        password: formData.password,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Registrasi gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
  };

  const handleFacebookRegister = () => {
  };

  return {
    formData,
    agreedToTerms,
    isLoading,
    error,
    showPassword,
    showConfirmPassword,
    setAgreedToTerms,
    setShowPassword,
    setShowConfirmPassword,
    handleChange,
    handleSubmit,
    handleGoogleRegister,
    handleFacebookRegister,
    getPasswordStrength,
  };
};
