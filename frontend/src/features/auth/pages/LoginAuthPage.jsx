import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Mail, Lock, BookOpen, Eye, EyeOff } from 'lucide-react';

// UI components
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import SocialLoginButtons from '@/shared/components/branding/SocialLoginButtons';
import { Separator } from '@/shared/components/ui/separator';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import NavLink from '@/shared/components/ui/NavLink';

import { useLoginForm } from '../hooks/useLoginForm';

export default function Login() {
  const { setAuthLayoutBranding } = useOutletContext();
  const {
    formData,
    rememberMe,
    isLoading,
    error,
    showPassword,
    setRememberMe,
    setShowPassword,
    handleChange,
    handleSubmit,
    handleGoogleLogin,
    handleFacebookLogin,
  } = useLoginForm();

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
              aria-invalid={formData.email && formData.email.includes('@') && !['untirta.ac.id', 'gmail.com'].includes(formData.email.split('@')[1])}
            />
          </div>
          {formData.email && formData.email.includes('@') && !['untirta.ac.id', 'gmail.com'].includes(formData.email.split('@')[1]) && (
            <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-amber-500"></span>
              Gunakan email @untirta.ac.id atau @gmail.com
            </p>
          )}
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
