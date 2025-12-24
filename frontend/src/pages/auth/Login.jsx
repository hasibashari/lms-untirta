import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Mail, Lock, BookOpen } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';

// UI components - using new unified components
import Input from '../../components/ui/Input';
import SocialLoginButtons from '../../components/ui/SocialLoginButtons';
import Divider from '../../components/ui/Divider';
import Button from '../../components/ui/Button';
import Checkbox from '../../components/ui/Checkbox';
import { NavLink } from '../../components/ui';

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
      else if (user?.role === 'MAHASISWA') navigate('/mahasiswa/dashboard');
      else navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Login gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log('Google Login clicked');
  };

  const handleFacebookLogin = () => {
    console.log('Facebook Login clicked');
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

        <Input
          label="Email Institusi / Pribadi"
          type="email"
          placeholder="nama@email.com"
          icon={Mail}
          value={formData.email}
          onChange={(e) => handleChange(e, 'email')}
        />

        <div>
          <Input
            label="Password"
            isPassword={true}
            placeholder="Masukkan password Anda"
            icon={Lock}
            value={formData.password}
            onChange={(e) => handleChange(e, 'password')}
          />

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between mt-4">
            <Checkbox
              id="remember-me"
              label="Ingat saya"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />

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
        <Button type="submit" loading={isLoading} showArrow fullWidth className="py-3">
          Masuk Sekarang
        </Button>
      </form>

      {/* Divider */}
      <Divider text="Atau masuk dengan" className="my-8" />

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
