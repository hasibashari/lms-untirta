import { cn } from '@/lib/utils';
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

/**
 * InfoBanner Component
 * Banner untuk menampilkan informasi penting seperti jadwal, pengumuman, dll.
 * 
 * @param {string} children - Content text
 * @param {'info'|'warning'|'success'|'error'} variant - Banner style variant
 * @param {string} className - Additional CSS classes
 * @param {boolean} showIcon - Show/hide icon (default: true)
 */
const InfoBanner = ({
  children,
  variant = 'info',
  className = '',
  showIcon = true,
}) => {
  const variants = {
    info: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      text: 'text-cyan-700',
      icon: Info,
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      icon: AlertTriangle,
    },
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      icon: CheckCircle,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: XCircle,
    },
  };

  const { bg, border, text, icon: Icon } = variants[variant];

  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3 flex items-center gap-3',
        bg,
        border,
        className
      )}
    >
      {showIcon && <Icon size={20} className={cn(text, 'shrink-0')} />}
      <p className={cn('text-sm font-medium', text)}>{children}</p>
    </div>
  );
};

export default InfoBanner;
