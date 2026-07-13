import { Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import PasswordStrengthIndicator from '@/shared/components/ui/PasswordStrengthIndicator';
import { useResetPassword } from '../hooks/useResetPassword';

export default function ResetPasswordForm() {
  const {
    formData,
    showPassword,
    showConfirmPassword,
    isLoading,
    error,
    setShowPassword,
    setShowConfirmPassword,
    handleChange,
    handleSubmit,
  } = useResetPassword();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div>
        <div className="space-y-1.5">
          <Label htmlFor="newPassword">Password Baru</Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimal 8 karakter"
                className="pl-10 pr-10"
                value={formData.newPassword}
                onChange={(e) => handleChange(e, 'newPassword')}
                required
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 focus:outline-none"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          <PasswordStrengthIndicator password={formData.newPassword} />
        </div>
      </div>

      <div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Ulangi password baru"
                className="pl-10 pr-10"
                value={formData.confirmPassword}
                onChange={(e) => handleChange(e, 'confirmPassword')}
                required
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 focus:outline-none"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
            <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500"></span>
              Konfirmasi password tidak cocok
            </p>
          )}
          {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
              Password cocok
            </p>
          )}
        </div>
      </div>

      <Button type="submit" loading={isLoading} fullWidth variant="default" className="py-3">
        Simpan Password Baru
      </Button>
    </form>
  );
}
