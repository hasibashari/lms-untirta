import { Outlet, useLocation, Link } from 'react-router-dom';
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
} from '../ui/sidebar';
import Logo from '../ui/Logo';
import ProfileDropdown from '../navigation/ProfileDropdown';
import { ChatWidget } from '../../features/chatbot';

const SidebarLogoHeader = () => {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarHeader className="h-16 flex items-center justify-center px-4">
      <Link
        to="/"
        className="w-full"
        onClick={() => {
          if (isMobile) setOpenMobile(false);
        }}
      >
        <Logo className="w-full flex group-data-[collapsible=icon]:hidden transition-opacity duration-200" />
        <Logo variant="icon" className="hidden group-data-[collapsible=icon]:flex transition-opacity duration-200" />
      </Link>
    </SidebarHeader>
  );
};

const AppLayout = ({ navItems = [], roleLabel = 'Menu' }) => {
  const location = useLocation();

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
      <Sidebar collapsible="icon" className="bg-sidebar border-sidebar-border">
        <SidebarLogoHeader />

        <SidebarContent className="pt-2">
          <SidebarGroup>
            <SidebarGroupLabel>{roleLabel}</SidebarGroupLabel>
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
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
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

      <SidebarInset className="bg-background min-h-screen">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 bg-background/95 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/60 px-4">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          <div className="ml-auto flex items-center gap-4">
            <ProfileDropdown />
          </div>
        </header>

        <main className="flex-1 w-full p-6 lg:p-8">
          <Outlet />
        </main>
        <ChatWidget />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppLayout;
