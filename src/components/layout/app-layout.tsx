import { Outlet } from "@tanstack/react-router";
import { Sidebar, MobileBottomNav } from "./sidebar";
import { Bell, Search } from "lucide-react";
import wfLogo from "@/assets/wf-logo.png";

export function AppLayout() {
  return (
    <div className="relative flex min-h-screen bg-background overflow-hidden">
      <div className="gradient-mesh" />
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-[72px] border-b border-border/60 bg-background/40 backdrop-blur-xl flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-lg font-semibold tracking-tight">WF Cirúrgicos</h1>
            <span className="hidden md:inline font-mono text-[11px] text-muted-foreground border border-border/70 rounded px-2 py-0.5">v3.2 • SP</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-secondary/60 border border-border/60 rounded-md px-3 py-1.5 w-[280px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Buscar contatos, conversas, campanhas..."
                className="bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 w-full"
              />
              <span className="font-mono text-[10px] text-muted-foreground border border-border/60 rounded px-1.5">⌘K</span>
            </div>
            <button className="relative h-9 w-9 rounded-md hover:bg-secondary/60 flex items-center justify-center transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-cyan glow-cyan" />
            </button>
            <div className="h-9 w-9 rounded-full bg-background border border-cyan/30 flex items-center justify-center overflow-hidden">
              <img src={wfLogo} alt="WF" className="h-7 w-7 object-contain" />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto pb-20 md:pb-0">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
