import { useEffect } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';

// UI components
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import SocialLoginButtons from '@/shared/components/branding/SocialLoginButtons';
import { Separator } from '@/shared/components/ui/separator';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import NavLink from '@/shared/components/ui/NavLink';

import { useRegisterForm } from '../hooks/useRegisterForm';

export default function Register() {
  const { setAuthLayoutBranding } = useOutletContext();
  const navigate = useNavigate();
  const {
    formData,
    agreedToTerms,
    isLoading,
    isSuccess,
    error,
    showPassword,
    showConfirmPassword,
    setAgreedToTerms,
    setShowPassword,
    setShowConfirmPassword,
    handleChange,
    handleSubmit,
    handleGoogleRegister,
    handleFacebookRegister,
    getPasswordStrength,
  } = useRegisterForm();

  useEffect(() => {
    setAuthLayoutBranding({
      variant: 'register',
      features: ['Akses Ribuan Materi', 'Sertifikat Digital', 'Forum Diskusi Interaktif'],
    });
  }, [setAuthLayoutBranding]);

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-200">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 animate-bounce" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Pendaftaran Berhasil!</h2>
        <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
          Akun Anda telah berhasil dibuat. Selamat bergabung di ekosistem pembelajaran digital kami.
        </p>
        
        <div className="w-full space-y-4">
          <Button 
            fullWidth 
            onClick={() => navigate('/login')}
            className="py-6 text-lg font-semibold shadow-lg shadow-emerald-200/50"
          >
            Masuk Sekarang <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-xs text-gray-400">
            Mengarahkan Anda ke halaman login secara otomatis dalam beberapa detik...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Form Header */}
      <div className="mb-8 text-center md:text-left">
        <h2 className="text-2xl font-bold text-gray-900">Buat Akun Baru</h2>
        <p className="text-gray-500 mt-2 text-sm">
          Lengkapi data diri Anda untuk mengakses layanan SPADA UNTIRTA.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="fullName">Nama Lengkap</Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <Input
              id="fullName"
              type="text"
              placeholder="Contoh: Budi Santoso"
              className="pl-10"
              value={formData.fullName}
              onChange={(e) => handleChange(e, 'fullName')}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Alamat Email</Label>
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
              aria-invalid={formData.email && !['untirta.ac.id', 'gmail.com'].includes(formData.email.split('@')[1])}
            />
          </div>
          {formData.email && !['untirta.ac.id', 'gmail.com'].includes(formData.email.split('@')[1]) && (
            <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500"></span>
              Gunakan email @untirta.ac.id atau @gmail.com
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  placeholder="Minimal 8 karakter"
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
            
            {/* Password Strength Indicator & Hints */}
            {formData.password && (
              <div className="mt-3 space-y-3">
                <div className="flex gap-1.5 h-1.5">
                  {[1, 2, 3].map((step) => {
                    const strength = getPasswordStrength(formData.password);
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
                    <div className={`flex items-center gap-1.5 ${formData.password.length >= 8 ? 'text-emerald-600' : 'text-gray-500'}`}>
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center ${formData.password.length >= 8 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        {formData.password.length >= 8 ? <CheckCircle2 className="w-2.5 h-2.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                      </div>
                      Minimal 8 karakter
                    </div>
                    <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(formData.password) ? 'text-emerald-600' : 'text-gray-500'}`}>
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center ${/[A-Z]/.test(formData.password) ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        {/[A-Z]/.test(formData.password) ? <CheckCircle2 className="w-2.5 h-2.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                      </div>
                      Mengandung huruf besar
                    </div>
                    <div className={`flex items-center gap-1.5 ${/[0-9]/.test(formData.password) ? 'text-emerald-600' : 'text-gray-500'}`}>
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center ${/[0-9]/.test(formData.password) ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        {/[0-9]/.test(formData.password) ? <CheckCircle2 className="w-2.5 h-2.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                      </div>
                      Mengandung angka
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Ulangi password"
                  className="pl-10 pr-10"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange(e, 'confirmPassword')}
                  aria-invalid={formData.confirmPassword && formData.password !== formData.confirmPassword}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 focus:outline-none"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-500"></span>
                Konfirmasi password tidak cocok
              </p>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                Password cocok
              </p>
            )}
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked)}
            required={true}
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none cursor-pointer text-gray-700 hover:text-gray-900"
          >
            Saya menyetujui <Link to="/terms" className="text-primary-600 hover:text-primary-700 font-medium">Syarat & Ketentuan</Link> yang berlaku
          </label>
        </div>

        {/* Submit Button */}
        <Button type="submit" loading={isLoading} showArrow fullWidth variant="default" className="mt-6 py-3">
          Daftar Sekarang
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-50 px-2 text-muted-foreground">
            Atau daftar dengan
          </span>
        </div>
      </div>

      {/* Social Login */}
      <SocialLoginButtons
        onGoogleClick={handleGoogleRegister}
        onFacebookClick={handleFacebookRegister}
        disabled={isLoading}
      />

      {/* Login Link */}
      <div className="mt-8">
        <NavLink text="Sudah memiliki akun?" linkText="Masuk disini" href="/login" />
      </div>
    </>
  );
}
