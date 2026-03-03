import { useCallback, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

import AuthBranding from '../components/shared/AuthBranding';
import Navbar from '../components/navigation/Navbar';
import Footer from '../components/shared/footer/Footer';

const DEFAULT_BRANDING = {
  variant: 'login',
  stats: {
    icon: BookOpen,
    label: 'Total Modul Tersedia',
    value: '12,450+',
  },
  features: ['Akses Ribuan Materi', 'Sertifikat Digital', 'Forum Diskusi Interaktif'],
};

export default function AuthLayout() {
  const [branding, setBranding] = useState(DEFAULT_BRANDING);

  const setAuthLayoutBranding = useCallback((nextBranding) => {
    setBranding((prev) => ({ ...prev, ...(nextBranding || {}) }));
  }, []);

  const outletContext = useMemo(
    () => ({ setAuthLayoutBranding }),
    [setAuthLayoutBranding]
  );

  return (
    <>

      <Navbar />

      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-8 md:p-8 lg:p-10 overflow-auto">
        {/* Main Card Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl flex flex-col md:flex-row h-auto">
          {/* Left Side (branding) - content is configured by pages */}
          <AuthBranding
            variant={branding.variant}
            stats={branding.stats}
            features={branding.features} />

          {/* Right Side (page content) */}
          <div className="w-full md:w-7/12 p-8 md:p-10 lg:p-12 xl:p-16 flex flex-col justify-center">
            <div className="max-w-md sm:max-w-lg lg:max-w-lg mx-auto w-full">
              <Outlet context={outletContext} />
            </div>
          </div>
        </div>
      </div>

      <Footer />

    </>
  );
}
