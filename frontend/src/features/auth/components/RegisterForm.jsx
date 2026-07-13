import { Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import SocialLoginButtons from '@/shared/components/branding/SocialLoginButtons';
import { Separator } from '@/shared/components/ui/separator';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import NavLink from '@/shared/components/ui/NavLink';
import PasswordStrengthIndicator from '@/shared/components/ui/PasswordStrengthIndicator';

import { useRegisterForm } from '../hooks/useRegisterForm';

export default function RegisterForm({ onSuccess }) {
  const {
    formData,
    agreedToTerms,
    isLoading,
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
  } = useRegisterForm({ onSuccess });

  return (
    <>
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
            
            <PasswordStrengthIndicator password={formData.password} />
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
