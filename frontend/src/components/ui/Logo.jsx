import { Globe } from 'lucide-react';

/**
 * Logo Component
 * Reusable brand logo. Accepts `variant` and `className` to allow
 * visual tweaks (e.g. footer uses white text).
 */
const Logo = ({ variant, className = '' }) => {
  const isFooter = variant === 'footer';
  const isAuth = variant === 'auth';

  const globeClass = `transition-transform ${isFooter ? 'w-8 h-8 text-white' : isAuth ? 'w-6 h-6 text-white' : 'w-8 h-8 text-blue-500'} ${!isFooter && !isAuth ? 'group-hover:rotate-12' : ''}`;
  const containerClass = `${isAuth ? 'flex items-center justify-center w-10 h-10 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20' : 'relative flex items-center justify-center w-10 h-10'}`;
  const dotBg = isFooter ? 'bg-orange-500' : 'bg-orange-400';
  const titleClass = `text-xl font-extrabold tracking-tight uppercase ${isFooter || isAuth ? 'text-white' : 'text-slate-900'}`;
  const spanClass = isFooter ? 'text-blue-500' : isAuth ? 'text-white' : 'text-slate-900';

  return (
    <div className={`flex items-center gap-3 cursor-pointer group ${className}`}>
      <div className={containerClass}>
        <Globe className={globeClass} />
        <span className={`absolute top-0 right-0 w-2.5 h-2.5 ${dotBg} rounded-full border-2 border-white`}></span>
      </div>

      <h1 className={titleClass}>
        SPADA <span className={spanClass}>UNTIRTA</span>
      </h1>
    </div>
  );
};

export default Logo;
