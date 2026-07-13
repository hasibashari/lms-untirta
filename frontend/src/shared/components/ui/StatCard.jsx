import { Link } from 'react-router-dom';

const COLOR_MAP = {
  blue: 'bg-primary/10 text-primary group-hover:bg-primary/20',
  emerald: 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20',
  violet: 'bg-violet-500/10 text-violet-600 group-hover:bg-violet-500/20',
  amber: 'bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20',
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = 'blue',
  to,
  onClick,
  loading = false,
  highlight = false,
  highlightText,
  highlightIcon: HighlightIcon,
}) {
  const colorClass = COLOR_MAP[color] || COLOR_MAP.blue;

  const innerContent = (
    <>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${colorClass}`}>
          {Icon && <Icon size={24} />}
        </div>
        <div>
          <p className="text-2xl font-bold text-card-foreground">{loading ? '-' : value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
      {highlight && value > 0 && highlightText && (
        <div className="mt-3 text-xs text-amber-600 font-medium flex items-center gap-1">
          {HighlightIcon && <HighlightIcon size={12} />}
          {highlightText}
        </div>
      )}
    </>
  );

  const baseClasses = `group bg-card rounded-xl border p-5 transition-all ${
    highlight ? 'border-amber-300 ring-1 ring-amber-100' : 'border-border hover:border-primary/50'
  }`;

  if (to) {
    return (
      <Link to={to} className={`${baseClasses} hover:shadow-sm`}>
        {innerContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div onClick={onClick} className={`${baseClasses} hover:shadow-sm cursor-pointer`}>
        {innerContent}
      </div>
    );
  }

  return (
    <div className={baseClasses}>
      {innerContent}
    </div>
  );
}
