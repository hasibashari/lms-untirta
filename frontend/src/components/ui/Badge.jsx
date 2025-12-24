/**
 * Badge Component (renamed from PillBadge)
 * Badge berbentuk pill dengan icon dan text.
 * Digunakan untuk highlight fitur atau status.
 * 
 * @param {LucideIcon} icon - Icon dari lucide-react
 * @param {string} text - Text yang ditampilkan
 * @param {'blue'|'orange'|'green'|'red'|'gray'} variant - Color variant
 * @param {string} className - Additional CSS classes
 */
const Badge = ({
  icon: Icon,
  text,
  variant = 'blue',
  className = ''
}) => {
  const variants = {
    blue: 'bg-blue-100/50 text-blue-700 border-blue-100',
    orange: 'bg-orange-100/50 text-orange-700 border-orange-100',
    green: 'bg-green-100/50 text-green-700 border-green-100',
    red: 'bg-red-100/50 text-red-700 border-red-100',
    gray: 'bg-gray-100/50 text-gray-700 border-gray-100',
  };

  const iconColors = {
    blue: 'text-orange-500',
    orange: 'text-orange-500',
    green: 'text-green-500',
    red: 'text-red-500',
    gray: 'text-gray-500',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${variants[variant]} ${className}`}>
      {Icon && <Icon size={16} className={iconColors[variant]} />}
      <span>{text}</span>
    </div>
  );
};

export default Badge;
