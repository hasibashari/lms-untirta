import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Mail, Lock, BookOpen, Eye, EyeOff } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';

// UI components
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SocialLoginButtons from '@/components/ui/SocialLoginButtons';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import NavLink from '@/components/ui/NavLink';

export default function Login() {
  const { setAuthLayoutBranding } = useOutletContext();
  const { login } = useAuth();
  const navigate = useNavigate();

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

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e, field) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await login(formData.email, formData.password);

      if (rememberMe) {
        // token sudah tersimpan di localStorage oleh AuthContext
      }

      if (user?.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user?.role === 'DOSEN') navigate('/dosen/dashboard');
      else if (user?.role === 'MAHASISWA') navigate('/mahasiswa/classes');
      else navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Login gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {

  };

  const handleFacebookLogin = () => {

  };

  return (
    <>
      {/* Header */}
      <div className="mb-8 text-center md:text-left">
        <h2 className="text-2xl font-bold text-gray-900">Masuk ke Akun</h2>
        <p className="text-gray-500 mt-2 text-sm">
          Silakan masukkan email dan password yang terdaftar.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email Institusi / Pribadi</Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="nama@untirta.ac.id"
              className="pl-10"
              value={formData.email}
              onChange={(e) => handleChange(e, 'email')}
            />
          </div>
        </div>

        <div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password Anda"
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={(e) => handleChange(e, 'password')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 focus:outline-none"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked)}
              />
              <label
                htmlFor="remember-me"
                className="text-sm font-medium leading-none cursor-pointer text-gray-700"
              >
                Ingat saya
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
              >
                Lupa password?
              </a>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button type="submit" loading={isLoading} showArrow fullWidth variant="default" className="py-3">
          Masuk Sekarang
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-50 px-2 text-muted-foreground">
            Atau masuk dengan
          </span>
        </div>
      </div>

      {/* Social Login */}
      <SocialLoginButtons
        onGoogleClick={handleGoogleLogin}
        onFacebookClick={handleFacebookLogin}
        disabled={isLoading}
      />

      {/* Register Link */}
      <div className="mt-8">
        <NavLink text="Belum memiliki akun?" linkText="Daftar sekarang" href="/register" />
      </div>
    </>
  );
}
