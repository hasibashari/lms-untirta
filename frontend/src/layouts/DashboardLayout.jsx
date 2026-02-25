import { Outlet, useLocation, Link } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from '../components/ui/sidebar';
import Logo from '../components/ui/Logo';
import ProfileDropdown from '../components/navigation/ProfileDropdown';
import { getDashboardNavItems } from '../utils/navigation';

/**
 * SidebarLogoHeader
 * Renders inside SidebarProvider — uses useSidebar() for collapse state.
 * Full logo when expanded, icon-only when collapsed (icon mode).
 */
const SidebarLogoHeader = () => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarHeader className="h-16 flex items-center justify-center px-4">
      {isCollapsed ? (
        <Logo variant="icon" />
      ) : (
        <Logo className="w-full" />
      )}
    </SidebarHeader>
  );
};

const DashboardLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navItems = getDashboardNavItems(user?.role, user);

  const isActive = (path) => {
    const item = navItems.find((i) => i.to === path);
    if (item?.exact) return location.pathname === path;
    if (item?.aliases) {
      return (
        item.aliases.some((alias) => location.pathname.startsWith(alias)) ||
        location.pathname.startsWith(path)
      );
    }
    return location.pathname.startsWith(path);
  };

  return (
    <SidebarProvider>
      {/* ── Left column: Fixed Sidebar (aside) ── */}
      <Sidebar collapsible="icon" className="bg-white">
        <SidebarLogoHeader />

        <SidebarContent className="pt-2">
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.to)}
                      tooltip={item.description || item.label}
                      size="lg"
                    >
                      <Link to={item.to}>
                        {Icon && <Icon />}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarRail />
      </Sidebar>

      {/* ── Right column: Main content area ── */}
      <SidebarInset className="bg-slate-50">
        {/* Topbar — inside SidebarInset so it never covers the sidebar */}
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 bg-white/95 shadow-sm backdrop-blur supports-backdrop-filter:bg-white/60 px-4">
          <SidebarTrigger className="-ml-1 text-slate-500 hover:text-slate-900" />
          <div className="ml-auto">
            <ProfileDropdown />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 w-full p-6 lg:p-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
