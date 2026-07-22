import { useNavigate } from 'react-router-dom';
import { MailCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export default function RegisterSuccess() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-blue-200">
        <MailCheck className="h-10 w-10 text-blue-600 animate-pulse" />
      </div>
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Konfirmasi Email Anda!</h2>
      <p className="text-gray-600 max-w-sm mb-6 leading-relaxed text-sm">
        Pendaftaran berhasil. Kami telah mengirimkan email konfirmasi ke alamat email Anda. Silakan buka <strong>Inbox</strong> atau <strong>Spam</strong> untuk memverifikasi akun Anda.
      </p>
      
      <div className="w-full space-y-4">
        <Button 
          fullWidth 
          onClick={() => navigate('/login')}
          className="py-5 text-base font-semibold shadow-lg shadow-blue-200/50"
        >
          Ke Halaman Login <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <p className="text-xs text-gray-400">
          *Anda harus mengonfirmasi email sebelum dapat masuk ke sistem.
        </p>
      </div>
    </div>
  );
}

