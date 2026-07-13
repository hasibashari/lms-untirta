import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export default function RegisterSuccess() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-200">
        <CheckCircle2 className="h-10 w-10 text-emerald-600 animate-bounce" />
      </div>
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Pendaftaran Berhasil!</h2>
      <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
        Akun Anda telah berhasil dibuat. Selamat bergabung di ekosistem pembelajaran digital kami.
      </p>
      
      <div className="w-full space-y-4">
        <Button 
          fullWidth 
          onClick={() => navigate('/login')}
          className="py-6 text-lg font-semibold shadow-lg shadow-emerald-200/50"
        >
          Masuk Sekarang <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <p className="text-xs text-gray-400">
          Mengarahkan Anda ke halaman login secara otomatis dalam beberapa detik...
        </p>
      </div>
    </div>
  );
}
