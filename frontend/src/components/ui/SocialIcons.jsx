
/**
 * SocialIcons Component
 * Reusable social media icons dengan hover effect.
 * Dapat digunakan di footer, header, atau halaman lain.
 * 
 * @param {Array} socials - Array of social objects { icon: LucideIcon, href: string, label: string }
 * @param {string} variant - Style variant: 'dark' (default) atau 'light'
 */
const SocialIcons = ({ socials = [], variant = 'dark' }) => {
  const baseClasses = "w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300";

  const variantClasses = {
    dark: "bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white",
    light: "bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white"
  };

  return (
    <div className="flex gap-4">
      {socials.map((social, idx) => {
        const Icon = social.icon;
        return (
          <a
            key={idx}
            href={social.href}
            aria-label={social.label}
            className={`${baseClasses} ${variantClasses[variant]}`}
          >
            <Icon size={16} />
          </a>
        );
      })}
    </div>
  );
};

export default SocialIcons;
