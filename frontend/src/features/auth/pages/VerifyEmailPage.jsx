import { useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle2, AlertCircle, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useVerifyEmail } from '../hooks/useVerifyEmail';

export default function VerifyEmailPage() {
  const { setAuthLayoutBranding } = useOutletContext();
  const navigate = useNavigate();
  const {
    isLoading,
    isSuccess,
    errorMsg,
    resendEmail,
    setResendEmail,
    isResending,
    resendSent,
    handleResend,
  } = useVerifyEmail();

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

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Memproses Verifikasi Email...</h3>
        <p className="text-gray-500 text-sm">Mohon tunggu sebentar selagi kami mengonfirmasi akun Anda.</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center py-6">
        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Berhasil Diverifikasi!</h2>
        <p className="text-gray-600 mb-8 text-sm">
          Akun Anda telah aktif secara penuh. Silakan masuk untuk mulai menggunakan layanan LMS Untirta.
        </p>
        <Button onClick={() => navigate('/login')} fullWidth variant="default" className="py-3">
          Masuk ke Akun
        </Button>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifikasi Gagal</h2>
        <p className="text-gray-600 text-sm mb-6">
          {errorMsg || 'Tautan verifikasi email tidak valid atau telah kadaluwarsa.'}
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 text-sm mb-2">Kirim Ulang Email Konfirmasi</h4>
        <p className="text-xs text-gray-500 mb-4">
          Masukkan alamat email Anda untuk menerima tautan verifikasi baru:
        </p>

        {resendSent ? (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 font-medium text-center">
            Instruksi verifikasi baru telah dikirimkan ke email Anda. Silakan periksa Inbox/Spam.
          </div>
        ) : (
          <form onSubmit={handleResend} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="resendEmail" className="sr-only">Email</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="resendEmail"
                  type="email"
                  required
                  placeholder="nama@untirta.ac.id"
                  className="pl-9 text-sm"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" loading={isResending} fullWidth variant="default" size="sm">
              Kirim Ulang Link
            </Button>
          </form>
        )}
      </div>

      <div className="mt-6 text-center">
        <Button variant="ghost" onClick={() => navigate('/login')} className="text-sm text-gray-500">
          Kembali ke Login
        </Button>
      </div>
    </div>
  );
}
