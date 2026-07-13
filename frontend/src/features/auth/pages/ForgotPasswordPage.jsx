import { useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';
import ForgotPasswordForm from '../components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  const { setAuthLayoutBranding } = useOutletContext();

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
        <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke login
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Lupa Password?</h2>
        <p className="text-gray-500 mt-2 text-sm">
          Masukkan email yang terdaftar pada akun Anda untuk melanjutkan proses reset password.
        </p>
      </div>

      <ForgotPasswordForm />
    </>
  );
}
