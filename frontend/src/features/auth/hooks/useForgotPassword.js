import { useState } from 'react';
import { forgotPassword as forgotPasswordAPI } from '../api/auth.api';

export const useForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await forgotPasswordAPI({ email });
      setSuccessMsg(res.message || res.data?.message || 'Jika email terdaftar di sistem, instruksi untuk reset password telah dikirimkan ke email Anda.');
      setIsSubmitted(true);
    } catch (error) {
      const message = error.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    isLoading,
    isSubmitted,
    successMsg,
    errorMsg,
    handleChange,
    handleSubmit,
  };
};

