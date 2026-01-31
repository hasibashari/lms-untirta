import { cn } from '@/lib/utils';

/**
 * StatCard Component
 * Card untuk menampilkan statistik dengan value besar dan label.
 * Digunakan untuk summary section di halaman KRS.
 * 
 * @param {string|number} value - Nilai statistik yang ditampilkan (besar)
 * @param {string} label - Label/deskripsi statistik
 * @param {string} className - Additional CSS classes
 * @param {'default'|'primary'|'success'|'warning'} variant - Color variant untuk border accent
 */
const StatCard = ({
  value,
  label,
  className = '',
  variant = 'default'
}) => {
  const borderVariants = {
    default: 'border-t-slate-400',
    primary: 'border-t-blue-500',
    success: 'border-t-emerald-500',
    warning: 'border-t-amber-500',
    info: 'border-t-cyan-500',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-slate-200 border-t-4 p-3 sm:p-6 text-center shadow-sm',
        borderVariants[variant],
        className
      )}
    >
      <p className="text-2xl sm:text-3xl font-bold text-slate-800 mb-0.5 sm:mb-1">{value}</p>
      <p className="text-xs sm:text-sm text-slate-500 leading-tight">{label}</p>
    </div>
  );
};

export default StatCard;
