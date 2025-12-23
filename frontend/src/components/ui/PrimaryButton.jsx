import { ArrowRight } from 'lucide-react';

/**
 * PrimaryButton Component
 * Tombol utama dengan style konsisten untuk CTA (Call To Action).
 * Mendukung icon, loading state, dan berbagai variant.
 * 
 * @param {string} children - Text button
 * @param {string} type - Button type (submit, button, reset)
 * @param {boolean} loading - Loading state
 * @param {boolean} disabled - Disabled state
 * @param {boolean} showArrow - Tampilkan arrow icon
 * @param {function} onClick - Click handler
 * @param {string} className - Additional CSS classes
 * @param {string} variant - 'primary' | 'secondary' | 'outline'
 */
const PrimaryButton = ({
  children,
  type = 'button',
  loading = false,
  disabled = false,
  showArrow = true,
  onClick,
  className = '',
  variant = 'primary'
}) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg shadow-gray-600/30',
    outline: 'bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
  };

  const baseClass = `
    w-full font-bold py-3 px-4 rounded-lg
    transform transition-all duration-200 
    active:scale-[0.98] 
    flex items-center justify-center gap-2 group
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
  `;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClass} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
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
          Memproses...
        </>
      ) : (
        <>
          {children}
          {showArrow && (
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          )}
        </>
      )}
    </button>
  );
};

export default PrimaryButton;
