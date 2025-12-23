import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * FormInput Component
 * Reusable input field dengan label, icon, dan password toggle.
 * Konsisten untuk digunakan di halaman Login, Register, dan form lainnya.
 * 
 * @param {string} label - Label untuk input
 * @param {string} type - Tipe input (text, email, etc.)
 * @param {string} placeholder - Placeholder text
 * @param {LucideIcon} icon - Icon dari lucide-react
 * @param {string} value - Controlled value
 * @param {function} onChange - Handler untuk perubahan value
 * @param {boolean} isPassword - Jika true, tampilkan toggle show/hide password
 * @param {string} error - Error message (optional)
 */
const FormInput = ({
  label,
  type = 'text',
  placeholder,
  icon: Icon,
  value,
  onChange,
  isPassword = false,
  error = ''
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-semibold text-gray-700 block">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
          </div>
        )}

        <input
          type={inputType}
          className={`
            block w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-2.5 
            border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg 
            text-gray-900 placeholder-gray-400 
            focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500/20 focus:border-red-500' : 'focus:ring-blue-500/20 focus:border-blue-600'}
            transition-all duration-200
          `}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default FormInput;
