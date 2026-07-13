import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const COLOR_MAP = {
  primary: {
    bg: 'bg-primary/10',
    bgHover: 'group-hover:bg-primary/20',
    text: 'text-primary',
    border: 'hover:border-primary/50',
  },
  blue: {
    bg: 'bg-blue-50',
    bgHover: 'group-hover:bg-blue-100',
    text: 'text-blue-600',
    border: 'hover:border-blue-300',
  },
  emerald: {
    bg: 'bg-emerald-50',
    bgHover: 'group-hover:bg-emerald-100',
    text: 'text-emerald-600',
    border: 'hover:border-emerald-300',
  },
  violet: {
    bg: 'bg-violet-50',
    bgHover: 'group-hover:bg-violet-100',
    text: 'text-violet-600',
    border: 'hover:border-violet-300',
  },
  amber: {
    bg: 'bg-amber-50',
    bgHover: 'group-hover:bg-amber-100',
    text: 'text-amber-600',
    border: 'hover:border-amber-300',
  },
  orange: {
    bg: 'bg-orange-50',
    bgHover: 'group-hover:bg-orange-100',
    text: 'text-orange-600',
    border: 'hover:border-orange-300',
  },
  red: {
    bg: 'bg-red-50',
    bgHover: 'group-hover:bg-red-100',
    text: 'text-red-600',
    border: 'hover:border-red-300',
  },
};

export default function ActionCard({
  title,
  subtitle,
  icon: Icon,
  to,
  onClick,
  color = 'primary',
  children,
}) {
  const colors = COLOR_MAP[color] || COLOR_MAP.primary;

  const innerContent = (
    <div className="flex items-center gap-4 p-5">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${colors.bg} ${colors.bgHover}`}>
        {Icon && <Icon size={24} className={colors.text} />}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-card-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <ArrowRight size={20} className={`text-muted-foreground group-hover:${colors.text} group-hover:translate-x-1 transition-all`} />
    </div>
  );

  const baseClasses = `group block bg-card rounded-xl border border-border transition-all ${colors.border} hover:shadow-sm overflow-hidden w-full text-left`;

  if (to && !children) {
    return (
      <Link to={to} className={baseClasses}>
        {innerContent}
      </Link>
    );
  }
  
  if (to && children) {
    return (
      <div className={baseClasses}>
        <Link to={to} className="block w-full">
           {innerContent}
        </Link>
        <div className="px-5 pb-4 relative z-10 border-t border-border/40 pt-4 mt-1 bg-muted/20">
          {children}
        </div>
      </div>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={baseClasses}>
        {innerContent}
        {children && <div className="px-5 pb-4 text-left relative z-10">{children}</div>}
      </button>
    );
  }

  return (
    <div className={baseClasses}>
      {innerContent}
      {children && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}
