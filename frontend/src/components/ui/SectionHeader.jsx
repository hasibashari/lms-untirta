
/**
 * SectionHeader Component
 * Header untuk section dengan badge, title, dan subtitle.
 * 
 * @param {string} badge - Text badge/label di atas title
 * @param {string} title - Title utama section
 * @param {string} subtitle - Subtitle/deskripsi (optional)
 * @param {string} badgeColor - Warna badge (default: 'blue')
 * @param {string} className - Additional CSS classes
 */
const SectionHeader = ({
  badge,
  title,
  subtitle,
  badgeColor = 'blue',
  className = ''
}) => {
  const badgeColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
  };

  return (
    <div className={`text-center ${className}`}>
      {badge && (
        <p className={`text-sm font-semibold tracking-widest uppercase mb-2 ${badgeColorClasses[badgeColor] || badgeColorClasses.blue}`}>
          {badge}
        </p>
      )}
      <h3 className="text-2xl md:text-3xl font-bold text-slate-900">
        {title}
      </h3>
      {subtitle && (
        <p className="mt-2 text-slate-600 text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionHeader;
