import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import LoginForm from '../components/LoginForm';

export default function Login() {
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
        <h2 className="text-2xl font-bold text-gray-900">Masuk ke Akun</h2>
        <p className="text-gray-500 mt-2 text-sm">
          Silakan masukkan email dan password yang terdaftar.
        </p>
      </div>

      <LoginForm />
    </>
  );
}
