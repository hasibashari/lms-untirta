import { ArrowRight } from 'lucide-react';

// Loading spinner component - extracted outside to avoid re-creation during render
const LoadingSpinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/**
 * Button Component
 * Atomic button dengan variant, loading state, dan icon support.
 * 
 * @param {ReactNode} children - Button content
 * @param {'primary'|'secondary'|'danger'|'outline'} variant - Style variant
 * @param {'button'|'submit'|'reset'} type - Button type
 * @param {boolean} loading - Loading state
 * @param {boolean} disabled - Disabled state
 * @param {boolean} fullWidth - Full width button
 * @param {LucideIcon} icon - Icon component (optional)
 * @param {'left'|'right'} iconPosition - Icon position
 * @param {boolean} showArrow - Show arrow icon on the right
 * @param {string} className - Additional CSS classes
 */
function Button({
  children,
  variant = 'primary',
  type = 'button',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  showArrow = false,
  className = '',
  ...props
}) {
  const base = `
    inline-flex items-center justify-center gap-2 
    px-4 py-2 rounded-lg text-sm font-semibold 
    transition-all duration-200 
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.98]
  `;

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${widthClass} ${className}`.trim()}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner />
          <span>Memproses...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
          {showArrow && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
        </>
      )}
    </button>
  );
}

export default Button;
