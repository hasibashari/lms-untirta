import { useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import ResetPasswordForm from '../components/ResetPasswordForm';
import { useResetPassword } from '../hooks/useResetPassword';

export default function ResetPasswordPage() {
  const { setAuthLayoutBranding } = useOutletContext();
  const navigate = useNavigate();
  const resetPasswordProps = useResetPassword();
  const { token, isSuccess, countdown, error, handleGoToLogin } = resetPasswordProps;

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
      <div className="text-center py-4 animate-in fade-in duration-300">
        <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Berhasil Diubah!</h2>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          Password akun Anda telah berhasil diperbarui. Silakan masuk menggunakan password baru Anda.
        </p>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-8 text-xs text-emerald-800 font-medium inline-flex items-center justify-center gap-2 w-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Mengalihkan ke halaman login dalam <strong>{countdown}</strong> detik...</span>
        </div>

        <Button onClick={handleGoToLogin} fullWidth variant="default" className="py-3 font-semibold">
          Masuk ke Akun Sekarang
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

      <ResetPasswordForm resetPasswordProps={resetPasswordProps} />
    </>
  );
}
