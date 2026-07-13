import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
import RegisterSuccess from '../components/RegisterSuccess';
import { useRegisterForm } from '../hooks/useRegisterForm';

export default function Register() {
  const { setAuthLayoutBranding } = useOutletContext();
  const { isSuccess } = useRegisterForm();

  useEffect(() => {
    setAuthLayoutBranding({
      variant: 'register',
      features: ['Akses Ribuan Materi', 'Sertifikat Digital', 'Forum Diskusi Interaktif'],
    });
  }, [setAuthLayoutBranding]);

  if (isSuccess) {
    return <RegisterSuccess />;
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

      <RegisterForm />
    </>
  );
}
