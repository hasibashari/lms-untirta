import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword as forgotPasswordAPI } from '../api/auth.api';

export const useForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      await forgotPasswordAPI({ email });
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
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
    errorMsg,
    handleChange,
    handleSubmit,
  };
};
