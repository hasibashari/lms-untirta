import { Link, useLocation } from 'react-router-dom';

/**
 * SidebarNav
 * Komponen sidebar navigasi generik untuk berbagai role
 * Props:
 * - navItems: array { label, to, icon, description? }
 * - sidebarOpen: bool (untuk mobile)
 * - setSidebarOpen: fn (untuk mobile)
 * - isActive: fn (path) => bool
 * - header (optional): node
 * - collapsed: bool (untuk desktop collapse)
 */
const SidebarNav = ({ navItems, sidebarOpen, setSidebarOpen, isActive, header, collapsed = false }) => {
  return (
    <aside
      className={`
        fixed top-20 left-0 h-[calc(100vh-5rem)] bg-white border-r border-slate-200 z-50 lg:z-30
        transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'}
        lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:translate-x-0 lg:shrink-0
        ${collapsed ? 'lg:w-16' : 'lg:w-72'}
      `}
    >
      {/* Mobile close button */}
      <button
        type="button"
        onClick={() => setSidebarOpen(false)}
        className="lg:hidden absolute top-4 right-4 z-10 p-2 hover:bg-slate-100 rounded-lg transition"
        aria-label="Tutup sidebar"
      >
        <span className="sr-only">Tutup sidebar</span>
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      {header && <div className="p-4 pb-0">{header}</div>}
      <nav className="flex-1 p-4 lg:pt-6">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center ${collapsed ? 'justify-center p-3 gap-0' : 'gap-3 px-4'} py-3 rounded-xl font-medium transition-all
                  ${active ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
                title={collapsed ? item.label : (item.description || item.label)}
              >
                {Icon && <Icon size={20} className="shrink-0" />}
                <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};

export default SidebarNav;
