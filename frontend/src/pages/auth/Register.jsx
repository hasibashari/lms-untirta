import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { User, Mail, Lock } from 'lucide-react';

import { register as registerAPI } from '../../services/auth.service';

// UI components - using new unified components
import Input from '../../components/ui/Input';
import SocialLoginButtons from '../../components/ui/SocialLoginButtons';
import Divider from '../../components/ui/Divider';
import Button from '../../components/ui/Button';
import Checkbox from '../../components/ui/Checkbox';
import { NavLink } from '../../components/ui';

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
    console.log('Google Register clicked');
  };

  const handleFacebookRegister = () => {
    console.log('Facebook Register clicked');
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

        <Input
          label="Nama Lengkap"
          type="text"
          placeholder="Contoh: Budi Santoso"
          icon={User}
          value={formData.fullName}
          onChange={(e) => handleChange(e, 'fullName')}
        />

        <Input
          label="Alamat Email"
          type="email"
          placeholder="nama@untirta.ac.id"
          icon={Mail}
          value={formData.email}
          onChange={(e) => handleChange(e, 'email')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Password"
            isPassword={true}
            placeholder="Minimal 8 karakter"
            icon={Lock}
            value={formData.password}
            onChange={(e) => handleChange(e, 'password')}
          />

          <Input
            label="Konfirmasi Password"
            isPassword={true}
            placeholder="Ulangi password"
            icon={Lock}
            value={formData.confirmPassword}
            onChange={(e) => handleChange(e, 'confirmPassword')}
          />
        </div>

        {/* Terms Checkbox */}
        <Checkbox
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          required={true}
          label={
            <span className="text-sm text-gray-600">
              Saya menyetujui{' '}
              <a href="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                Syarat & Ketentuan
              </a>{' '}
              yang berlaku
            </span>
          }
        />

        {/* Submit Button */}
        <Button type="submit" loading={isLoading} showArrow fullWidth className="mt-6 py-3">
          Daftar Sekarang
        </Button>
      </form>

      {/* Divider */}
      <Divider text="Atau daftar dengan" className="my-8" />

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
