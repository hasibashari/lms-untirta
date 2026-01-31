import { cn } from '@/lib/utils';

/**
 * CourseBadge Component
 * Badge inline untuk menampilkan info mata kuliah seperti SKS, tipe, mode, dll.
 * Lebih compact dari Badge utama, cocok untuk digunakan dalam tabel.
 * 
 * @param {string} children - Text content
 * @param {'primary'|'success'|'warning'|'info'|'purple'|'gray'} variant - Color variant
 * @param {string} className - Additional CSS classes
 */
const CourseBadge = ({
  children,
  variant = 'primary',
  className = '',
}) => {
  const variants = {
    primary: 'bg-blue-600 text-white',
    success: 'bg-emerald-500 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-cyan-500 text-white',
    purple: 'bg-purple-500 text-white',
    teal: 'bg-teal-500 text-white',
    gray: 'bg-slate-500 text-white',
    outline: 'bg-white text-slate-600 border border-slate-300',
    // Soft variants
    'primary-soft': 'bg-blue-100 text-blue-700',
    'success-soft': 'bg-emerald-100 text-emerald-700',
    'warning-soft': 'bg-amber-100 text-amber-700',
    'info-soft': 'bg-cyan-100 text-cyan-700',
    'purple-soft': 'bg-purple-100 text-purple-700',
    'teal-soft': 'bg-teal-100 text-teal-700',
    'gray-soft': 'bg-slate-100 text-slate-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export default CourseBadge;
