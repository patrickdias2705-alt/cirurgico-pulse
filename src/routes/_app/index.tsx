import { createFileRoute } from "@tanstack/react-router";
import { CountUp } from "@/components/ui/count-up";
import { brl, num } from "@/lib/format";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  UserPlus,
  Trophy,
  Megaphone,
  MessageCircle,
  GitBranch,
  Workflow,
  Lock,
  Facebook,
  Instagram,
  MessageSquare,
  FileText,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
});

// ───────────────────── Mock data ─────────────────────
const mockData = {
  vendasHoje: 18450.0,
  vendasMes: 146200.0,
  metaMes: 200000.0,
  metaSemana: 50000.0,
  vendasSemana: 29000.0,
  leadsHoje: 7,
  leadsMes: 134,
  leadsHojeSource: { fb: 4, ig: 2, wa: 1 },
  leadsMesSource: { fb: 68, ig: 41, wa: 25 },
  trendVendasDia: 12,
  trendVendasMes: 8,
  trendLeadsMes: 15,
  orcamentos: {
    total: 74,            // orçamentos enviados no mês
    vendidos: 28,         // viraram venda
    abertos: 38,          // em aberto / em negociação
    perdidos: 8,          // recusados
    valorAberto: 312800,  // R$ em propostas em aberto
    valorVendido: 146200, // R$ já fechado
    ticketMedio: 8230,    // ticket médio das propostas em aberto
  },
  vendedores: [
    { nome: "Carlos Silva",    vendas: 42300, orcamentos: 18, leads: 31 },
    { nome: "Ana Beatriz",     vendas: 38100, orcamentos: 22, leads: 28 },
    { nome: "Roberto Mendes",  vendas: 29800, orcamentos: 14, leads: 24 },
    { nome: "Juliana Costa",   vendas: 21500, orcamentos: 11, leads: 19 },
    { nome: "Marcos Oliveira", vendas: 14500, orcamentos:  9, leads: 15 },
  ],
};

const spark7 = [12, 15, 11, 18, 14, 16, 18.45].map((v, i) => ({ i, v: v * 1000 }));
const spark30 = Array.from({ length: 30 }).map((_, i) => ({
  i,
  v: 3000 + Math.round(Math.sin(i / 2.5) * 1200 + i * 180 + (i % 4) * 400),
}));

// ───────────────────── Dashboard ─────────────────────
function Dashboard() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Visão Geral</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Operação WF Cirúrgicos · Atualizado agora · São Paulo
          </p>
        </div>
      </div>

      {/* ROW 1 — Vendas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SalesCard
          label="Vendas hoje"
          value={mockData.vendasHoje}
          trend={mockData.trendVendasDia}
          trendLabel="vs ontem"
          spark={spark7}
        />
        <SalesCard
          label="Vendas em maio"
          value={mockData.vendasMes}
          trend={mockData.trendVendasMes}
          trendLabel="vs mês anterior"
          spark={spark30}
        />
      </div>

      {/* ROW 2 — Termômetros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ThermometerCard
          label="Meta do Mês"
          current={mockData.vendasMes}
          target={mockData.metaMes}
        />
        <ThermometerCard
          label="Meta da Semana"
          current={mockData.vendasSemana}
          target={mockData.metaSemana}
        />
      </div>

      {/* ROW 3 — Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LeadsCard
          label="Leads Gerados Hoje"
          value={mockData.leadsHoje}
          src={mockData.leadsHojeSource}
        />
        <LeadsCard
          label="Leads Gerados no Mês"
          value={mockData.leadsMes}
          src={mockData.leadsMesSource}
          trend={mockData.trendLeadsMes}
        />
      </div>

      {/* ROW 4 — Vendas por Vendedor */}
      <SellerBarCard
        title="Vendas por Vendedor — Maio"
        data={[...mockData.vendedores].sort((a, b) => b.vendas - a.vendas).map(v => ({
          nome: v.nome,
          value: v.vendas,
        }))}
        format={brl}
      />

      {/* ROW 5 — Orçamentos por Vendedor */}
      <SellerBarCard
        title="Orçamentos Enviados por Vendedor — Maio"
        data={[...mockData.vendedores].sort((a, b) => b.orcamentos - a.orcamentos).map(v => ({
          nome: v.nome,
          value: v.orcamentos,
          conversion: Math.round((v.vendas / 5000 / v.orcamentos) * 10), // mock %
        }))}
        format={(n) => `${num(n)} orç.`}
        showConversion
      />

      {/* ROW 6 — Ranking */}
      <RankingCard />

      {/* Em Breve */}
      <div className="pt-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="h-px flex-1 bg-border/60" />
          <h3 className="font-display text-sm uppercase tracking-[0.22em] text-muted-foreground">
            Mais Funcionalidades
          </h3>
          <div className="h-px flex-1 bg-border/60" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <LockedCard icon={Megaphone}    name="Meta Ads Analytics"   desc="Performance de campanhas Facebook & Instagram." />
          <LockedCard icon={MessageCircle} name="WhatsApp Inbox"       desc="Atendimento centralizado em uma única caixa." />
          <LockedCard icon={GitBranch}    name="Pipeline de Leads"    desc="Funil visual estilo Kanban por estágio." />
          <LockedCard icon={Workflow}     name="Regras de Roteamento" desc="Distribuição automática de leads por critérios." />
        </div>
      </div>
    </div>
  );
}

// ───────────────────── Sales card with sparkline ─────────────────────
function SalesCard({
  label, value, trend, trendLabel, spark,
}: { label: string; value: number; trend: number; trendLabel: string; spark: { i: number; v: number }[] }) {
  const up = trend >= 0;
  return (
    <div className="glass glass-hover rounded-xl p-6 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full opacity-25 blur-3xl"
           style={{ background: "#1A6FD4" }} />
      <div className="relative">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
          {label}
        </p>
        <div className="mt-3 font-mono text-5xl font-semibold tracking-tight text-foreground">
          <CountUp value={value} format={brl} duration={1500} />
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {up ? (
            <TrendingUp className="h-3.5 w-3.5 text-moss" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-400" />
          )}
          <span className={cn("font-semibold", up ? "text-moss" : "text-red-400")}>
            {up ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
          <span className="text-muted-foreground">{trendLabel}</span>
        </div>
        <div className="mt-4 h-[68px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3D8EF0" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#3D8EF0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="#5BA8FF"
                strokeWidth={2}
                fill={`url(#spark-${label})`}
                animationDuration={1400}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ───────────────────── Thermometer (circular progress) ─────────────────────
function ThermometerCard({
  label, current, target,
}: { label: string; current: number; target: number }) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  const remaining = Math.max(0, target - current);
  const reached = pct >= 100;
  const color = reached ? "#6B8F7A" : "#1A6FD4";

  const [animPct, setAnimPct] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimPct(pct));
    return () => cancelAnimationFrame(t);
  }, [pct]);

  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (c * animPct) / 100;

  return (
    <div className="glass glass-hover rounded-xl p-6 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full opacity-20 blur-3xl"
           style={{ background: color }} />
      <div className="relative flex items-center gap-6">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="rgba(28,46,74,0.7)"
              strokeWidth={stroke}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={color}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              style={{
                transition: "stroke-dashoffset 1500ms cubic-bezier(0.22, 1, 0.36, 1)",
                filter: `drop-shadow(0 0 8px ${color}99)`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-mono text-4xl font-bold" style={{ color }}>
              <CountUp value={pct} duration={1500} />%
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
            {label}
          </p>
          <div className="mt-2 font-mono text-lg">
            <span className="text-foreground font-semibold">{brl(current)}</span>
            <span className="text-muted-foreground"> / {brl(target)}</span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {reached
              ? "🎉 Meta batida!"
              : <>Faltam <span className="font-mono font-semibold" style={{ color }}>{brl(remaining)}</span> para bater a meta</>}
          </p>
        </div>
      </div>
    </div>
  );
}

// ───────────────────── Leads card ─────────────────────
function LeadsCard({
  label, value, src, trend,
}: { label: string; value: number; src: { fb: number; ig: number; wa: number }; trend?: number }) {
  return (
    <div className="glass glass-hover rounded-xl p-6 relative overflow-hidden">
      <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full opacity-20 blur-3xl"
           style={{ background: "#3D8EF0" }} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
            {label}
          </p>
          <div className="mt-3 font-mono text-4xl font-semibold tracking-tight text-foreground">
            <CountUp value={value} duration={1300} />
          </div>
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {trend >= 0
                ? <TrendingUp className="h-3.5 w-3.5 text-moss" />
                : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
              <span className={cn("font-semibold", trend >= 0 ? "text-moss" : "text-red-400")}>
                {trend >= 0 ? "+" : ""}{trend}%
              </span>
              <span className="text-muted-foreground">vs mês anterior</span>
            </div>
          )}
        </div>
        <div className="h-10 w-10 rounded-lg flex items-center justify-center border border-border/60"
             style={{ background: "rgba(26,111,212,0.12)" }}>
          <UserPlus className="h-5 w-5 text-cyan" strokeWidth={1.75} />
        </div>
      </div>
      <div className="relative mt-5 pt-4 border-t border-border/60 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Facebook className="h-3.5 w-3.5" style={{ color: "#1A6FD4" }} />
          FB Ads: <span className="font-mono font-semibold text-foreground">{src.fb}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Instagram className="h-3.5 w-3.5" style={{ color: "#3D8EF0" }} />
          Instagram: <span className="font-mono font-semibold text-foreground">{src.ig}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" style={{ color: "#6B8F7A" }} />
          WhatsApp: <span className="font-mono font-semibold text-foreground">{src.wa}</span>
        </span>
      </div>
    </div>
  );
}

// ───────────────────── Horizontal bar chart card ─────────────────────
function SellerBarCard({
  title, data, format, showConversion,
}: {
  title: string;
  data: { nome: string; value: number; conversion?: number }[];
  format: (n: number) => string;
  showConversion?: boolean;
}) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="glass glass-hover rounded-xl p-6">
      <h3 className="font-display font-semibold text-lg">{title}</h3>
      <div className="mt-5 space-y-3">
        {data.map((d, i) => {
          const width = (d.value / max) * 100;
          return (
            <div key={d.nome} className="group">
              <div className="flex items-baseline justify-between text-sm mb-1.5">
                <span className="font-medium">{d.nome}</span>
                <span className="font-mono text-foreground/90 flex items-center gap-2">
                  {showConversion && d.conversion !== undefined && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border"
                          style={{
                            background: "rgba(107,143,122,0.12)",
                            color: "#6B8F7A",
                            borderColor: "rgba(107,143,122,0.4)",
                          }}>
                      {d.conversion}% conv.
                    </span>
                  )}
                  {format(d.value)}
                </span>
              </div>
              <div
                className="h-8 rounded-md overflow-hidden backdrop-blur-sm"
                style={{
                  background: "rgba(232, 238, 248, 0.06)",
                  border: "1px solid rgba(232, 238, 248, 0.08)",
                }}
              >
                <div
                  className="h-full rounded-md"
                  style={{
                    width: `${width}%`,
                    background: "linear-gradient(90deg, rgba(91,168,255,0.55) 0%, rgba(61,142,240,0.7) 60%, rgba(107,143,122,0.55) 100%)",
                    boxShadow: "0 0 18px rgba(91,168,255,0.35)",
                    transition: `width 1400ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 80}ms`,
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

// ───────────────────── Ranking ─────────────────────
function RankingCard() {
  const ranked = [...mockData.vendedores].sort((a, b) => b.vendas - a.vendas);
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean); // 2 - 1 - 3

  const styles = [
    { pos: 2, color: "#C0C0C0", glow: "rgba(192,192,192,0.35)", emoji: "🥈", size: "scale-95" },
    { pos: 1, color: "#FFD166", glow: "rgba(255,209,102,0.45)", emoji: "🥇", size: "scale-110" },
    { pos: 3, color: "#CD7F32", glow: "rgba(205,127,50,0.35)", emoji: "🥉", size: "scale-95" },
  ];

  return (
    <div className="glass glass-hover rounded-xl p-6">
      <h3 className="font-display font-semibold text-lg flex items-center gap-2">
        <Trophy className="h-5 w-5 text-gold" /> Ranking de Vendedores
      </h3>

      {/* Podium */}
      <div className="mt-6 grid grid-cols-3 gap-4 items-end">
        {podium.map((v, i) => {
          const s = styles[i];
          const taxa = Math.round((v.vendas / 5000 / v.orcamentos) * 10);
          return (
            <div key={v.nome} className={cn("transition-transform", s.size)}>
              <div
                className="rounded-xl p-5 text-center relative overflow-hidden"
                style={{
                  border: `1px solid ${s.color}66`,
                  background: `linear-gradient(135deg, rgba(13,21,38,0.9), rgba(17,29,51,0.9))`,
                  boxShadow: `0 0 0 1px ${s.color}33, 0 0 24px ${s.glow}`,
                }}
              >
                <div className="text-3xl">{s.emoji}</div>
                <div
                  className="mx-auto mt-2 h-12 w-12 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{
                    background: `${s.color}20`,
                    color: s.color,
                    border: `1px solid ${s.color}66`,
                  }}
                >
                  {v.nome.split(" ").map(w => w[0]).slice(0, 2).join("")}
                </div>
                <p className="mt-3 font-display font-semibold text-sm truncate">{v.nome}</p>
                <div className="mt-2 font-mono text-lg font-bold" style={{ color: s.color }}>
                  <CountUp value={v.vendas} format={brl} duration={1500} />
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {v.orcamentos} orç. · {taxa}% conv.
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rest table */}
      {rest.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <th className="text-left font-medium py-2.5 w-16">Posição</th>
                <th className="text-left font-medium">Vendedor</th>
                <th className="text-right font-medium">Vendas</th>
                <th className="text-right font-medium">Orçamentos</th>
                <th className="text-right font-medium">Conversão</th>
                <th className="text-right font-medium">Leads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rest.map((v, i) => {
                const taxa = Math.round((v.vendas / 5000 / v.orcamentos) * 10);
                return (
                  <tr key={v.nome} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3 font-mono text-muted-foreground">#{i + 4}</td>
                    <td className="font-medium">{v.nome}</td>
                    <td className="text-right font-mono text-cyan">
                      <CountUp value={v.vendas} format={brl} duration={1400} />
                    </td>
                    <td className="text-right font-mono">
                      <CountUp value={v.orcamentos} duration={1200} />
                    </td>
                    <td className="text-right font-mono text-moss">{taxa}%</td>
                    <td className="text-right font-mono">
                      <CountUp value={v.leads} duration={1200} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ───────────────────── Locked Em Breve card ─────────────────────
function LockedCard({
  icon: Icon, name, desc,
}: { icon: any; name: string; desc: string }) {
  return (
    <div
      className="glass rounded-xl p-5 relative overflow-hidden opacity-50 cursor-default select-none"
      style={{ filter: "saturate(0.7)" }}
    >
      <div className="absolute top-3 right-3 z-10">
        <span
          className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1"
          style={{
            background: "rgba(13,21,38,0.85)",
            border: "1px solid rgba(26,111,212,0.6)",
            color: "#5BA8FF",
            backdropFilter: "blur(8px)",
          }}
        >
          <Lock className="h-2.5 w-2.5" /> Em Breve
        </span>
      </div>
      <div className="h-10 w-10 rounded-lg flex items-center justify-center border border-border/60 mb-4"
           style={{ background: "rgba(26,111,212,0.08)" }}>
        <Icon className="h-5 w-5 text-cyan" strokeWidth={1.75} />
      </div>
      <h4 className="font-display font-semibold text-sm">{name}</h4>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
