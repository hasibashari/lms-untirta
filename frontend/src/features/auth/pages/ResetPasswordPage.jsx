import { useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import ResetPasswordForm from '../components/ResetPasswordForm';
import { useResetPassword } from '../hooks/useResetPassword';

export default function ResetPasswordPage() {
  const { setAuthLayoutBranding } = useOutletContext();
  const navigate = useNavigate();
  const { token, isSuccess, error } = useResetPassword();

  useEffect(() => {
    setAuthLayoutBranding({
      variant: 'login',
      stats: {
        icon: BookOpen,
        label: 'Total Modul Tersedia',
        value: '12,450+',
      },
    });
  }, [setAuthLayoutBranding]);

  if (!token) {
    return (
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <span className="text-2xl font-bold">!</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
        <p className="text-gray-500 mb-8">
          {error || 'Tautan reset password tidak valid atau tidak ditemukan.'}
        </p>
        <Button onClick={() => navigate('/forgot-password')} fullWidth variant="default" className="py-3">
          Kembali ke Lupa Password
        </Button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Berhasil Diubah</h2>
        <p className="text-gray-500 mb-8">
          Password akun Anda telah berhasil diperbarui. Silakan login menggunakan password baru Anda.
        </p>
        <Button onClick={() => navigate('/login')} fullWidth variant="default" className="py-3">
          Masuk ke Akun
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8 text-center md:text-left">
        <h2 className="text-2xl font-bold text-gray-900">Buat Password Baru</h2>
        <p className="text-gray-500 mt-2 text-sm">
          Silakan masukkan password baru Anda. Pastikan untuk mengingatnya dengan baik.
        </p>
      </div>

      <ResetPasswordForm />
    </>
  );
}
