import { Outlet } from "@tanstack/react-router";
import { Activity, ShieldCheck } from "lucide-react";

import wfLogo from "@/assets/wf-logo.png";
import { AuthGate } from "@/components/analytics/auth-gate";

import { MobileBottomNav, Sidebar } from "./sidebar";

export function AppLayout() {
  return (
    <AuthGate>
      <div className="relative flex min-h-screen overflow-hidden bg-background">
        <div className="gradient-mesh" />
        <Sidebar />
        <main className="relative flex min-w-0 flex-1 flex-col">
          <header className="z-10 flex h-[64px] shrink-0 items-center justify-between border-b border-border/60 bg-background/55 px-4 backdrop-blur-xl sm:px-6">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-lg font-semibold tracking-tight">Cirúrgico Pulse</h1>
              <span className="hidden items-center gap-1.5 rounded border border-border/70 px-2 py-1 font-mono text-[10px] text-muted-foreground sm:flex">
                <Activity className="h-3 w-3 text-moss" /> Dados operacionais
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-md border border-border/60 bg-secondary/60 px-3 py-1.5 text-xs text-muted-foreground md:flex">
                <ShieldCheck className="h-4 w-4 text-cyan" /> Escopo protegido por carteira
              </div>
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-cyan/30 bg-background">
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
    </AuthGate>
  );
}
