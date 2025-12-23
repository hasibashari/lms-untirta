function Button({ children, variant = 'primary', type = 'button', ...props }) {
  const base = 'px-4 py-2 rounded text-sm font-medium transition';

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]}`}
      {...props} // ← Ini akan pass semua props termasuk onClick, disabled, dll
    >
      {children}
    </button>
  );
}

export default Button;
