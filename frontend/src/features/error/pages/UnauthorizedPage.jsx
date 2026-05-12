import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';

const ROLE_HOME = {
  ADMIN: '/admin/dashboard',
  DOSEN: '/dosen/dashboard',
  MAHASISWA: '/mahasiswa/dashboard',
};

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const homePath = user ? (ROLE_HOME[user.role] || '/') : '/login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md w-full">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-12 h-12 text-destructive" strokeWidth={1.5} />
          </div>
        </div>

        {/* Status code */}
        <p className="text-sm font-semibold text-destructive uppercase tracking-widest mb-2">
          Error 403
        </p>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Akses Ditolak
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-2">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
        {user && (
          <p className="text-sm text-muted-foreground mb-8">
            Anda masuk sebagai{' '}
            <span className="font-semibold text-foreground">{user.name}</span>
            {' '}dengan role{' '}
            <span className="font-semibold text-primary">{user.role}</span>.
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground hover:bg-accent transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
          <button
            onClick={() => navigate(homePath, { replace: true })}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <Home className="w-4 h-4" />
            Ke Dashboard Saya
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
