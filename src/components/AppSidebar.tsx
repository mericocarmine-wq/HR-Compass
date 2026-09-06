import { 
  LayoutDashboard, Users, UsersRound, Clock, CalendarDays, Receipt, FileText, ShieldAlert, ClipboardList, Settings, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { 
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, 
  SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar 
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useRole } from '@/hooks/useRole';

const allNavItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, minRole: 'empleado' },
  { title: 'Equipo', url: '/equipo', icon: UsersRound, minRole: 'empleado' },
  { title: 'Empleados', url: '/empleados', icon: Users, minRole: 'manager' },
  { title: 'Registro Jornada', url: '/jornada', icon: Clock, minRole: 'empleado' },
  { title: 'Registro Empresa', url: '/registro-horario', icon: ClipboardList, minRole: 'empleado' },
  { title: 'Vacaciones', url: '/vacaciones', icon: CalendarDays, minRole: 'empleado' },
  { title: 'Nóminas', url: '/nominas', icon: Receipt, minRole: 'empleado' },
  { title: 'Documentos', url: '/documentos', icon: FileText, minRole: 'empleado' },
  { title: 'Informe Laboral', url: '/informe-laboral', icon: ShieldAlert, minRole: 'empleado' },
  { title: 'Configuración', url: '/configuracion', icon: Settings, minRole: 'manager' },
];

const roleHierarchy: Record<string, number> = {
  owner: 4,
  admin: 3,
  manager: 2,
  empleado: 1,
};

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const { signOut } = useAuth();
  const { company } = useCompany();
  const { role } = useRole();
  const collapsed = state === 'collapsed';

  const userLevel = roleHierarchy[role] || 1;
  const navItems = allNavItems.filter(item => userLevel >= (roleHierarchy[item.minRole] || 1));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            {company?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-accent-foreground">{company?.name || 'Axontia'}</span>
              <span className="text-xs text-sidebar-foreground">RRHH Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      title={collapsed ? item.title : undefined}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 space-y-1">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={signOut} 
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent gap-2"
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="text-xs">Cerrar sesión</span>}
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="w-full text-sidebar-foreground hover:bg-sidebar-accent">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
