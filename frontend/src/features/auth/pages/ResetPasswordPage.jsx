import { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, BookOpen, CheckCircle2 } from 'lucide-react';
import api from '@/shared/api/apiService';
import { toast } from 'react-hot-toast';

// UI components
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';

export default function ResetPasswordPage() {
  const { setAuthLayoutBranding } = useOutletContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
    setAuthLayoutBranding({
      variant: 'login',
      stats: {
        icon: BookOpen,
        label: 'Total Modul Tersedia',
        value: '12,450+',
      },
    });

    if (!email) {
      setError('Email tidak valid atau tidak ditemukan.');
    }
  }, [setAuthLayoutBranding, email]);

  const handleChange = (e, field) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  const getPasswordStrength = (pwd) => {
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    return s;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      const res = await api.post('/auth/reset-password', {
        email,
        newPassword: formData.newPassword,
      });
      setIsSuccess(true);
      toast.success(res.message || 'Password berhasil diubah.');
    } catch (err) {
      // Error handled by interceptor but we set local error state to show in form
      setError(err.message || 'Gagal mereset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <span className="text-2xl font-bold">!</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
        <p className="text-gray-500 mb-8">
          {error || 'Email tidak valid atau tidak ditemukan.'}
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Password Baru</Label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 8 karakter"
                  className="pl-10 pr-10"
                  value={formData.newPassword}
                  onChange={(e) => handleChange(e, 'newPassword')}
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 focus:outline-none"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            {/* Password Strength Indicator & Hints */}
            {formData.newPassword && (
              <div className="mt-3 space-y-3">
                <div className="flex gap-1.5 h-1.5">
                  {[1, 2, 3].map((step) => {
                    const strength = getPasswordStrength(formData.newPassword);
                    const isActive = step <= strength;
                    const colors = ['bg-gray-200', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500'];
                    return (
                      <div 
                        key={step} 
                        className={`flex-1 rounded-full transition-all duration-300 ${isActive ? colors[strength] : 'bg-gray-200'}`}
                      />
                    );
                  })}
                </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Syarat Password:
                  </p>
                  <div className="grid grid-cols-1 gap-1.5 text-xs">
                    <div className={`flex items-center gap-1.5 ${formData.newPassword.length >= 8 ? 'text-emerald-600' : 'text-gray-500'}`}>
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center ${formData.newPassword.length >= 8 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        {formData.newPassword.length >= 8 ? <CheckCircle2 className="w-2.5 h-2.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                      </div>
                      Minimal 8 karakter
                    </div>
                    <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(formData.newPassword) ? 'text-emerald-600' : 'text-gray-500'}`}>
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center ${/[A-Z]/.test(formData.newPassword) ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        {/[A-Z]/.test(formData.newPassword) ? <CheckCircle2 className="w-2.5 h-2.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                      </div>
                      Mengandung huruf besar
                    </div>
                    <div className={`flex items-center gap-1.5 ${/[0-9]/.test(formData.newPassword) ? 'text-emerald-600' : 'text-gray-500'}`}>
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center ${/[0-9]/.test(formData.newPassword) ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        {/[0-9]/.test(formData.newPassword) ? <CheckCircle2 className="w-2.5 h-2.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                      </div>
                      Mengandung angka
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Ulangi password baru"
                  className="pl-10 pr-10"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange(e, 'confirmPassword')}
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 focus:outline-none"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-500"></span>
                Konfirmasi password tidak cocok
              </p>
            )}
            {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                Password cocok
              </p>
            )}
          </div>
        </div>

        <Button type="submit" loading={isLoading} fullWidth variant="default" className="py-3">
          Simpan Password Baru
        </Button>
      </form>
    </>
  );
}
