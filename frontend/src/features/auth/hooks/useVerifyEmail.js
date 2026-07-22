import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { verifyEmail as verifyEmailAPI, resendVerification as resendVerificationAPI } from '../api/auth.api';
import { toast } from 'react-hot-toast';

export const useVerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setErrorMsg('Token verifikasi email tidak ditemukan atau tautan tidak valid.');
      return;
    }

    const verify = async () => {
      setIsLoading(true);
      try {
        const res = await verifyEmailAPI({ token });
        setIsSuccess(true);
        toast.success(res.message || 'Email berhasil diverifikasi!');
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Tautan verifikasi email tidak valid atau telah kadaluwarsa.';
        setErrorMsg(message);
      } finally {
        setIsLoading(false);
      }
    };

    verify();
  }, [token]);

  const handleResend = async (e) => {
    if (e) e.preventDefault();
    if (!resendEmail) return;

    setIsResending(true);
    try {
      const res = await resendVerificationAPI({ email: resendEmail });
      setResendSent(true);
      toast.success(res.message || 'Email konfirmasi telah dikirimkan kembali.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim email verifikasi.');
    } finally {
      setIsResending(false);
    }
  };

  return {
    token,
    isLoading,
    isSuccess,
    errorMsg,
    resendEmail,
    setResendEmail,
    isResending,
    resendSent,
    handleResend,
  };
};
