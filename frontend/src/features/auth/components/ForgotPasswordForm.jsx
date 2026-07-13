import { Mail } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { useForgotPassword } from '../hooks/useForgotPassword';

export default function ForgotPasswordForm() {
  const { email, isLoading, errorMsg, handleChange, handleSubmit } = useForgotPassword();

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
        Lanjut ke Reset Password
      </Button>
    </form>
  );
}
