import { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { Mail, BookOpen, ArrowLeft } from 'lucide-react';
import api from '@/shared/api/apiService';
import { toast } from 'react-hot-toast';

// UI components
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';

export default function ForgotPasswordPage() {
  const { setAuthLayoutBranding } = useOutletContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMsg(''); // Reset error
    try {
      await api.post('/auth/forgot-password', { email });
      // Langsung redirect ke halaman reset password
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      // Tangkap pesan error dari backend
      const message = error.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8 text-center md:text-left">
        <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke login
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Lupa Password?</h2>
        <p className="text-gray-500 mt-2 text-sm">
          Masukkan email yang terdaftar pada akun Anda untuk melanjutkan proses reset password.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <Input
              id="email"
              type="email"
              required
              placeholder="nama@untirta.ac.id"
              className={`pl-10 ${errorMsg ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMsg) setErrorMsg(''); // Hapus pesan error saat mengetik
              }}
            />
          </div>
          {errorMsg && (
            <p className="text-sm text-red-500 mt-1">{errorMsg}</p>
          )}
        </div>

        <Button type="submit" loading={isLoading} fullWidth variant="default" className="py-3">
          Lanjut ke Reset Password
        </Button>
      </form>
    </>
  );
}
