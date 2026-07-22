import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import SocialLoginButtons from '@/shared/components/branding/SocialLoginButtons';
import { Separator } from '@/shared/components/ui/separator';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import NavLink from '@/shared/components/ui/NavLink';

import { useLoginForm } from '../hooks/useLoginForm';

export default function LoginForm() {
  const {
    formData,
    rememberMe,
    isLoading,
    error,
    showPassword,
    isUnverifiedEmail,
    isResending,
    resendSuccess,
    setRememberMe,
    setShowPassword,
    handleChange,
    handleSubmit,
    handleResendVerification,
    handleGoogleLogin,
    handleFacebookLogin,
  } = useLoginForm();

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && !isUnverifiedEmail && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
            {error}
          </p>
        )}

        {isUnverifiedEmail && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-sm text-amber-900 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold text-amber-900">Email Belum Diverifikasi</h5>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Email Anda (<strong>{formData.email}</strong>) belum diaktifkan. Silakan periksa folder Inbox atau Spam email Anda.
                </p>
              </div>
            </div>

            {resendSuccess ? (
              <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-2.5 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Link konfirmasi baru telah berhasil dikirimkan ke email Anda!</span>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResendVerification}
                loading={isResending}
                className="w-full bg-white hover:bg-amber-100 text-amber-900 border-amber-300 text-xs font-semibold py-2"
              >
                <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isResending ? 'animate-spin' : ''}`} />
                Kirim Ulang Email Konfirmasi
              </Button>
            )}
          </div>
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
              <Link
                to="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
              >
                Lupa password?
              </Link>
            </div>
          </div>
        </div>

        <Button type="submit" loading={isLoading} showArrow fullWidth variant="default" className="py-3">
          Masuk Sekarang
        </Button>
      </form>

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

      <SocialLoginButtons
        onGoogleClick={handleGoogleLogin}
        onFacebookClick={handleFacebookLogin}
        disabled={isLoading}
      />

      <div className="mt-8">
        <NavLink text="Belum memiliki akun?" linkText="Daftar sekarang" href="/register" />
      </div>
    </>
  );
}
