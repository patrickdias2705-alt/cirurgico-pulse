import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  ChevronLeft,
  Database,
  LayoutDashboard,
  ListFilter,
  MessageCircle,
  Users,
} from "lucide-react";

import wfLogo from "@/assets/wf-logo.png";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const nav = [
  { to: "/", label: "Visão geral", icon: LayoutDashboard },
  { to: "/leads", label: "Funil comercial", icon: ListFilter },
  { to: "/ads", label: "Origens", icon: BarChart3 },
  { to: "/contacts", label: "Negócios", icon: Users },
  { to: "/inbox", label: "Operação WhatsApp", icon: MessageCircle },
  { to: "/routing", label: "Performance", icon: Activity },
  { to: "/settings", label: "Qualidade dos dados", icon: Database },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { pathname } = useLocation();
  return (
    <aside
      className={cn(
        "z-20 hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl transition-[width] duration-300 md:flex",
        sidebarCollapsed ? "w-[76px]" : "w-[248px]",
      )}
    >
      <div className="flex h-[144px] items-center justify-center border-b border-sidebar-border px-4">
        <img
          src={wfLogo}
          alt="WF Cirúrgicos"
          className="h-[112px] w-[112px] shrink-0 object-contain"
        />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
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
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-cyan",
              )}
            >
              {active && (
                <span className="glow-cyan absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r bg-cyan" />
              )}
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              {!sidebarCollapsed && <span className="font-medium">{label}</span>}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={toggleSidebar}
        className="m-3 flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-cyan"
      >
        <ChevronLeft
          className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")}
        />
        {!sidebarCollapsed && <span>Recolher</span>}
      </button>
    </aside>
  );
}

export function MobileBottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-30 border-t border-sidebar-border md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {nav.slice(0, 5).map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 text-[10px]",
                active ? "text-cyan" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
              <span className="max-w-[60px] truncate">{label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
