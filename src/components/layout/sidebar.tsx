import { Link, useLocation } from "@tanstack/react-router";
import { useAppStore } from "@/store/app-store";
import { LayoutDashboard, MessageCircle, KanbanSquare, BarChart3, Users, GitBranch, Settings, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import wfLogo from "@/assets/wf-logo.png";

const nav = [
  { to: "/",          label: "Dashboard",        icon: LayoutDashboard },
  { to: "/inbox",     label: "WhatsApp Inbox",   icon: MessageCircle },
  { to: "/leads",     label: "Leads & Pipeline", icon: KanbanSquare },
  { to: "/ads",       label: "Meta Ads",         icon: BarChart3 },
  { to: "/contacts",  label: "Contatos",         icon: Users },
  { to: "/routing",   label: "Roteamento",       icon: GitBranch },
  { to: "/settings",  label: "Configurações",    icon: Settings },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { pathname } = useLocation();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col z-20 shrink-0 transition-[width] duration-300 ease-out",
        "border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl",
        sidebarCollapsed ? "w-[76px]" : "w-[248px]",
      )}
    >
      <div className="flex items-center justify-center px-4 h-[96px] border-b border-sidebar-border">
        <img src={wfLogo} alt="WF Cirúrgicos" className="h-[72px] w-[72px] shrink-0 object-contain" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all",
                active
                  ? "bg-cyan/10 text-cyan"
                  : "text-sidebar-foreground/70 hover:text-cyan hover:bg-sidebar-accent/60",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] bg-cyan rounded-r glow-cyan" />
              )}
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              {!sidebarCollapsed && <span className="font-medium">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleSidebar}
        className="m-3 flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-cyan hover:bg-sidebar-accent/60 transition-colors"
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
        {!sidebarCollapsed && <span>Recolher</span>}
      </button>
    </aside>
  );
}

export function MobileBottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 glass border-t border-sidebar-border">
      <div className="flex justify-around items-center h-16 px-2">
        {nav.slice(0, 5).map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link key={to} to={to} className={cn("flex flex-col items-center gap-1 px-2 py-1 text-[10px]", active ? "text-cyan" : "text-muted-foreground")}>
              <Icon className="h-5 w-5" strokeWidth={1.75} />
              <span className="truncate max-w-[60px]">{label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
