import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CountUp } from "@/components/ui/count-up";
import { brl, num, pct, timeAgo, initials } from "@/lib/format";
import { leadOriginBreakdown, leadsOverTime, funnel, conversations, contacts, agents, campaigns_meta, sourceColor } from "@/lib/mock-data";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, ArrowUpRight, Users, MessageCircle, Target, DollarSign, Facebook } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
});

function KpiCard({ label, value, hint, icon: Icon, trend, accent = "cyan", format }: {
  label: string; value: number; hint: string; icon: any; trend: number; accent?: "cyan" | "gold" | "purple" | "green"; format?: (n: number) => string;
}) {
  const accentColor = accent === "cyan" ? "#00D4FF" : accent === "gold" ? "#F5C842" : accent === "purple" ? "#A78BFA" : "#34D399";
  return (
    <div className="glass glass-hover rounded-xl p-5 relative overflow-hidden group">
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-20 blur-2xl" style={{ background: accentColor }} />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">{label}</p>
          <div className="mt-3 font-mono text-3xl font-semibold tracking-tight" style={{ color: accentColor }}>
            <CountUp value={value} format={format} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="h-9 w-9 rounded-lg flex items-center justify-center border border-border/60" style={{ background: `${accentColor}10` }}>
          <Icon className="h-4 w-4" style={{ color: accentColor }} strokeWidth={1.75} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-xs">
        {trend >= 0
          ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
        <span className={trend >= 0 ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>
          {trend >= 0 ? "+" : ""}{trend}%
        </span>
        <span className="text-muted-foreground">vs período anterior</span>
      </div>
    </div>
  );
}

function Dashboard() {
  const [range, setRange] = useState<"hoje" | "mes">("mes");

  const totalLeads = 848;
  const metaLeads = 560;
  const activeConvs = conversations.filter(c => c.status === "active").length;
  const conv = 11.4;
  const pipeline = 1284000;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Visão Geral</h2>
          <p className="text-sm text-muted-foreground mt-1">Operação WF Cirúrgicos · Atualizado agora · São Paulo</p>
        </div>
        <div className="flex items-center gap-2 glass rounded-lg p-1">
          {(["hoje", "mes"] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn("px-3 py-1.5 text-xs rounded-md font-medium transition-all",
                range === r ? "bg-cyan text-background" : "text-muted-foreground hover:text-foreground")}
            >
              {r === "hoje" ? "Hoje" : "Este Mês"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard label="Total Leads"          value={range === "hoje" ? 38 : totalLeads} hint={range === "hoje" ? "novos hoje" : "este mês"} icon={Users}         trend={12.4} accent="cyan" />
        <KpiCard label="Leads Meta Ads"       value={range === "hoje" ? 24 : metaLeads}  hint={`${pct((metaLeads/totalLeads)*100, 0)} do total`} icon={Facebook} trend={18.7} accent="gold" />
        <KpiCard label="Conversas Ativas"     value={activeConvs}                          hint="no WhatsApp"        icon={MessageCircle} trend={4.1}  accent="purple" />
        <KpiCard label="Taxa de Conversão"    value={conv}                                 hint="leads → clientes"   icon={Target}        trend={2.3}  accent="green" format={(n) => pct(n, 1)} />
        <KpiCard label="Pipeline de Receita"  value={pipeline}                             hint="propostas em aberto" icon={DollarSign}   trend={-3.8} accent="gold" format={brl} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <DonutCard />
        <AreaCard />
        <FunnelCard />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <RecentConvs />
        <TopAds />
      </div>
    </div>
  );
}

function DonutCard() {
  const total = leadOriginBreakdown.reduce((s, x) => s + x.value, 0);
  return (
    <div className="glass glass-hover rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold">Origem dos Leads</h3>
          <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{num(total)} total</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 items-center">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={leadOriginBreakdown} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3} stroke="none" animationDuration={1200}>
                {leadOriginBreakdown.map((s, i) => (
                  <Cell key={i} fill={s.color} style={{ filter: `drop-shadow(0 0 6px ${s.color}aa)` }} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "oklch(0.17 0.028 260)", border: "1px solid oklch(0.30 0.04 260)", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          {leadOriginBreakdown.map(s => (
            <div key={s.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                <span className="truncate">{s.name}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span>{s.value}</span>
                <span className="text-muted-foreground w-9 text-right">{((s.value/total)*100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AreaCard() {
  return (
    <div className="glass glass-hover rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold">Leads ao Longo do Tempo</h3>
          <p className="text-xs text-muted-foreground">30 dias · todas as origens</p>
        </div>
        <span className="text-xs flex items-center gap-1 text-emerald-400 font-medium"><ArrowUpRight className="h-3 w-3" />+18.7%</span>
      </div>
      <div className="mt-2 h-[220px]">
        <ResponsiveContainer>
          <AreaChart data={leadsOverTime} margin={{ left: -20, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="cyanFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="#00D4FF" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="oklch(0.25 0.03 260 / 0.5)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#7d8a9c" }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: "#7d8a9c" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "oklch(0.17 0.028 260)", border: "1px solid oklch(0.30 0.04 260)", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="value" stroke="#00D4FF" strokeWidth={2.5} fill="url(#cyanFill)" className="stroke-glow" animationDuration={1400} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FunnelCard() {
  const max = funnel[0].count;
  return (
    <div className="glass glass-hover rounded-xl p-5">
      <h3 className="font-display font-semibold">Funil de Conversão</h3>
      <p className="text-xs text-muted-foreground">Lead → Fechado</p>
      <div className="mt-4 space-y-2.5">
        {funnel.map((f, i) => {
          const width = (f.count / max) * 100;
          const colors = ["#00D4FF", "#60A5FA", "#A78BFA", "#F5C842", "#34D399"];
          return (
            <div key={f.stage}>
              <div className="flex items-baseline justify-between text-xs mb-1">
                <span className="text-muted-foreground">{f.stage}</span>
                <span className="font-mono">{num(f.count)}{i > 0 && <span className="text-muted-foreground/60 ml-2">{pct((f.count/funnel[i-1].count)*100, 0)}</span>}</span>
              </div>
              <div className="h-7 bg-secondary/50 rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md transition-all duration-[1400ms] ease-out"
                  style={{
                    width: `${width}%`,
                    background: `linear-gradient(90deg, ${colors[i]}, ${colors[i]}90)`,
                    boxShadow: `0 0 12px ${colors[i]}55`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentConvs() {
  const recent = conversations.slice(0, 5);
  const status: Record<string, { label: string; color: string }> = {
    new: { label: "novo", color: "#F5C842" },
    active: { label: "ativo", color: "#00D4FF" },
    resolved: { label: "resolvido", color: "#7d8a9c" },
  };
  return (
    <div className="glass glass-hover rounded-xl p-5 xl:col-span-2">
      <h3 className="font-display font-semibold">Conversas Recentes</h3>
      <p className="text-xs text-muted-foreground">WhatsApp · últimos atendimentos</p>
      <div className="mt-4 divide-y divide-border/60">
        {recent.map(c => {
          const contact = contacts.find(x => x.id === c.contactId)!;
          const s = status[c.status];
          return (
            <div key={c.id} className="flex items-center gap-3 py-3 group cursor-pointer">
              <div className="relative">
                <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: `${sourceColor[contact.source]}20`, color: sourceColor[contact.source] }}>
                  {initials(contact.name)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{contact.name}</p>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: `${s.color}15`, color: s.color }}>{s.label}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">{timeAgo(c.lastTime)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopAds() {
  const top = [...campaigns_meta].sort((a, b) => b.leads - a.leads).slice(0, 5);
  return (
    <div className="glass glass-hover rounded-xl p-5 xl:col-span-3 overflow-hidden">
      <h3 className="font-display font-semibold">Top Anúncios</h3>
      <p className="text-xs text-muted-foreground">Performance por campanha</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-medium py-2">Campanha</th>
              <th className="text-left font-medium">Plataforma</th>
              <th className="text-right font-medium">Spend</th>
              <th className="text-right font-medium">Leads</th>
              <th className="text-right font-medium">CPL</th>
              <th className="text-right font-medium">CTR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {top.map(c => (
              <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                <td className="py-2.5">{c.name}</td>
                <td className="text-muted-foreground text-xs">{c.platform}</td>
                <td className="text-right font-mono">{brl(c.spend)}</td>
                <td className="text-right font-mono text-cyan">{c.leads}</td>
                <td className="text-right font-mono">{brl(c.spend / c.leads)}</td>
                <td className="text-right font-mono">{pct((c.clicks/c.impressions)*100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
