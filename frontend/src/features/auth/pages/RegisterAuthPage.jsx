import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

import { register as registerAPI } from '../authService';

// UI components
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SocialLoginButtons from '@/components/ui/SocialLoginButtons';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import NavLink from '@/components/ui/NavLink';

export default function Register() {
  const { setAuthLayoutBranding } = useOutletContext();
  const navigate = useNavigate();

  useEffect(() => {
    setAuthLayoutBranding({
      variant: 'register',
      features: ['Akses Ribuan Materi', 'Sertifikat Digital', 'Forum Diskusi Interaktif'],
    });
  }, [setAuthLayoutBranding]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e, field) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!agreedToTerms) {
      setError('Anda harus menyetujui syarat & ketentuan.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    setIsLoading(true);
    try {
      await registerAPI({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
      });

      alert('Pendaftaran berhasil. Silakan login.');
      navigate('/login');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Registrasi gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {

  };

  const handleFacebookRegister = () => {

  };

  return (
    <>
      {/* Form Header */}
      <div className="mb-8 text-center md:text-left">
        <h2 className="text-2xl font-bold text-gray-900">Buat Akun Baru</h2>
        <p className="text-gray-500 mt-2 text-sm">
          Lengkapi data diri Anda untuk mengakses layanan SPADA.
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
            />
          </div>
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
            Saya menyetujui <a href="/terms" className="text-primary-600 hover:text-primary-700 font-medium">Syarat & Ketentuan</a> yang berlaku
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
