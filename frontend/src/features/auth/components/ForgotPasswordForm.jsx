import { Mail, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { useForgotPassword } from '../hooks/useForgotPassword';

export default function ForgotPasswordForm() {
  const { email, isLoading, isSubmitted, successMsg, errorMsg, handleChange, handleSubmit } = useForgotPassword();

  if (isSubmitted) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Instruksi Terkirim</h3>
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          {successMsg}
        </p>
        <p className="text-xs text-gray-400 mb-6">
          Silakan periksa folder <strong>Inbox</strong> atau <strong>Spam</strong> pada email Anda untuk mengklik tautan reset password (berlaku 15 menit).
        </p>
        <Link to="/login">
          <Button fullWidth variant="outline" className="py-3">
            Kembali ke Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
          </div>
          <Input
            id="email"
            type="email"
            required
            placeholder="nama@untirta.ac.id"
            className={`pl-10 ${errorMsg ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            value={email}
            onChange={handleChange}
          />
        </div>
        {errorMsg && (
          <p className="text-sm text-red-500 mt-1">{errorMsg}</p>
        )}
      </div>

      <Button type="submit" loading={isLoading} fullWidth variant="default" className="py-3">
        Kirim Instruksi Reset Password
      </Button>
    </form>
  );
}

