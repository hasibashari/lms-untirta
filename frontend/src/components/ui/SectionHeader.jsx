import { cn } from '@/lib/utils';

/**
 * SectionHeader Component
 * Header untuk section dengan background gradient.
 * Digunakan untuk judul section seperti "MATA KULIAH DITAWARKAN"
 * 
 * @param {string} title - Main title text
 * @param {string} subtitle - Optional subtitle (e.g., student name and ID)
 * @param {string} className - Additional CSS classes
 */
const SectionHeader = ({
  title,
  subtitle,
  className = '',
}) => {
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-slate-100 to-slate-50 rounded-t-lg px-6 py-4 border-b border-slate-200',
        className
      )}
    >
      <h2 className="text-base font-bold text-slate-700 tracking-wide text-center">
        {title}
        {subtitle && (
          <span className="font-semibold"> - {subtitle}</span>
        )}
      </h2>
    </div>
  );
};

export default SectionHeader;
