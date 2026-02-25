/**
 * DashboardJumbotron
 * Hero / welcome banner at the top of dashboard pages.
 * Accepts `title`, `subtitle`, optional `children` for action buttons,
 * and an optional `icon` component.
 */
const DashboardJumbotron = ({ title, subtitle, children, icon: Icon, className = '' }) => {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-6 lg:p-8 ${className}`}
    >
      {/* Decorative background shapes */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-64 h-32 bg-white/5 rounded-full blur-3xl" />
        <svg
          className="absolute right-4 bottom-4 w-32 h-32 text-white/4"
          viewBox="0 0 200 200"
          fill="currentColor"
        >
          <circle cx="100" cy="100" r="80" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="hidden sm:flex shrink-0 w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm items-center justify-center">
              <Icon className="w-7 h-7 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm lg:text-base text-blue-100/80 max-w-xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Optional action slot */}
        {children && (
          <div className="flex items-center gap-2 shrink-0">
            {children}
          </div>
        )}
      </div>
    </section>
  );
};

export default DashboardJumbotron;
