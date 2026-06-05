import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register as registerAPI } from '../authService';

export const useRegisterForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e, field) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const getPasswordStrength = (pwd) => {
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    return s;
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
        email: formData.email,
        password: formData.password,
      });

      setIsSuccess(true);
      // Auto redirect after 5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 5000);
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
    isSuccess,
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
