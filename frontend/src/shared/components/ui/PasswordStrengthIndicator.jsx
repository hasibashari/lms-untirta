import { CheckCircle2 } from 'lucide-react';
import { getPasswordStrength } from '../../utils/password.util';

export default function PasswordStrengthIndicator({ password }) {
  if (!password) return null;

  const strength = getPasswordStrength(password);

  return (
    <div className="mt-3 space-y-3">
      <div className="flex gap-1.5 h-1.5">
        {[1, 2, 3].map((step) => {
          const isActive = step <= strength;
          const colors = ['bg-gray-200', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500'];
          return (
            <div
              key={step}
              className={`flex-1 rounded-full transition-all duration-300 ${isActive ? colors[strength] : 'bg-gray-200'}`}
            />
          );
        })}
      </div>
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
          Syarat Password:
        </p>
        <div className="grid grid-cols-1 gap-1.5 text-xs">
          <div className={`flex items-center gap-1.5 ${password.length >= 8 ? 'text-emerald-600' : 'text-gray-500'}`}>
            <div className={`w-3 h-3 rounded-full flex items-center justify-center ${password.length >= 8 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
              {password.length >= 8 ? <CheckCircle2 className="w-2.5 h-2.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
            </div>
            Minimal 8 karakter
          </div>
          <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(password) ? 'text-emerald-600' : 'text-gray-500'}`}>
            <div className={`w-3 h-3 rounded-full flex items-center justify-center ${/[A-Z]/.test(password) ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
              {/[A-Z]/.test(password) ? <CheckCircle2 className="w-2.5 h-2.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
            </div>
            Mengandung huruf besar
          </div>
          <div className={`flex items-center gap-1.5 ${/[0-9]/.test(password) ? 'text-emerald-600' : 'text-gray-500'}`}>
            <div className={`w-3 h-3 rounded-full flex items-center justify-center ${/[0-9]/.test(password) ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
              {/[0-9]/.test(password) ? <CheckCircle2 className="w-2.5 h-2.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
            </div>
            Mengandung angka
          </div>
        </div>
      </div>
    </div>
  );
}
