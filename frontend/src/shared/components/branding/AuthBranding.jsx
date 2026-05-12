import { BookOpen, CheckCircle } from 'lucide-react';
import Logo from '@/shared/components/branding/Logo';

/**
 * AuthBranding Component
 * Panel kiri untuk halaman auth (Login/Register) dengan branding dan hero content.
 * Dapat dikustomisasi untuk konteks berbeda (login vs register).
 *
 * @param {string} variant - 'login' atau 'register' untuk konteks berbeda
 * @param {object} stats - Object dengan icon, label, dan value untuk stats decoration (untuk login)
 * @param {Array} features - Array of feature strings untuk ditampilkan (untuk register)
 */
const AuthBranding = ({
  variant = 'login',
  stats = {
    icon: BookOpen,
    label: 'Total Modul Tersedia',
    value: '12,450+',
  },
  features = ['Akses Ribuan Materi', 'Sertifikat Digital', 'Forum Diskusi Interaktif'],
}) => {
  const content = {
    login: {
      title: 'Selamat Datang Kembali!',
      description:
        'Lanjutkan progres belajar Anda. Akses materi terbaru dan terhubung kembali dengan dosen Anda.',
    },
    register: {
      title: 'Mulai Perjalanan Belajar Anda.',
      description:
        'Bergabunglah dengan ribuan mahasiswa dan dosen di seluruh Indonesia dalam satu platform pembelajaran terintegrasi.',
    },
  };

  const { title, description } = content[variant] || content.login;
  const StatsIcon = stats.icon;
  const isRegister = variant === 'register';

  return (
    <div className="relative w-full md:w-5/12 bg-linear-to-br from-blue-700 to-blue-900 p-8 text-white flex flex-col justify-between overflow-hidden">
      {/* Abstract Shapes */}
      {isRegister ? (
        <>
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </>
      ) : (
        <>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-orange-500/30 rounded-full blur-2xl"></div>
        </>
      )}

      {/* Logo */}
      <div className="relative z-10">
        <Logo variant="auth" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 my-10 md:my-0">
        {!isRegister && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-100 text-xs font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Sistem Online
          </div>
        )}

        <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">{title}</h2>
        <p className="text-blue-100 text-lg leading-relaxed mb-8">{description}</p>

        {isRegister ? (
          <div className="space-y-3">
            {features.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-blue-50">
                <CheckCircle size={18} className="text-orange-400" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500 rounded-lg">
                <StatsIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-200">{stats.label}</p>
                <p className="text-xl font-bold">{stats.value}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Copyright */}
      <div className="relative z-10 text-sm text-blue-200/60">
        &copy; {new Date().getFullYear()} Spada Indonesia.{isRegister && ' All rights reserved.'}
      </div>
    </div>
  );
};

export default AuthBranding;
