import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CountUp } from "@/components/ui/count-up";
import { brl, num, pct } from "@/lib/format";
import { campaigns_meta, spendVsLeads } from "@/lib/mock-data";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Facebook, Instagram, Globe, Pause, Eye, PlugZap, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/ads")({
  component: AdsPage,
});

const ranges = ["7d", "30d", "90d", "custom"] as const;

function AdsPage() {
  const [range, setRange] = useState<typeof ranges[number]>("30d");
  const [query, setQuery] = useState("");

  const totals = campaigns_meta.reduce((s, c) => ({
    spend: s.spend + c.spend,
    leads: s.leads + c.leads,
    impressions: s.impressions + c.impressions,
    clicks: s.clicks + c.clicks,
  }), { spend: 0, leads: 0, impressions: 0, clicks: 0 });

  const cpl = totals.spend / totals.leads;
  const ctr = (totals.clicks / totals.impressions) * 100;
  const roas = 4.2;

  const platformData = ["Facebook", "Instagram", "Audience Network"].map(p => ({
    name: p,
    value: campaigns_meta.filter(c => c.platform === p).reduce((s, c) => s + c.leads, 0),
    color: p === "Facebook" ? "#1A6FD4" : p === "Instagram" ? "#3D8EF0" : "#0F4A96",
  }));

  const byCampaign = [...campaigns_meta].sort((a, b) => b.leads - a.leads).map(c => ({
    name: c.name, leads: c.leads, cpl: c.spend / c.leads,
  }));

  const filtered = campaigns_meta.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold">Meta Ads Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">Performance de campanhas Facebook e Instagram</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 glass rounded-lg p-1">
            {ranges.map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={cn("px-3 py-1.5 text-xs rounded-md font-medium transition-all",
                  range === r ? "bg-cyan text-background" : "text-muted-foreground hover:text-foreground")}>
                {r === "custom" ? <Calendar className="h-3.5 w-3.5" /> : r}
              </button>
            ))}
          </div>
          <button className="h-9 px-3 rounded-md bg-gold/15 border border-gold/50 text-gold text-xs font-semibold flex items-center gap-2 hover:bg-gold/25 hover:glow-gold transition-all">
            <PlugZap className="h-4 w-4" /> Conectar Meta
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiMini label="Total Investido" value={totals.spend} format={brl} color="#3D8EF0" />
        <KpiMini label="Total Leads"     value={totals.leads}              color="#1A6FD4" />
        <KpiMini label="CPL"             value={cpl}        format={brl} color="#0F4A96" />
        <KpiMini label="CTR"             value={ctr}        format={(n) => pct(n)} color="#1DB87E" />
        <KpiMini label="ROAS"            value={roas}       format={(n) => `${n.toFixed(1)}x`} color="#3D8EF0" />
        <KpiMini label="Impressões"      value={totals.impressions}        color="#1A6FD4" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="glass glass-hover rounded-xl p-5 xl:col-span-2">
          <h3 className="font-display font-semibold">Investimento × Leads</h3>
          <p className="text-xs text-muted-foreground">30 dias · dois eixos</p>
          <div className="mt-2 h-[260px]">
            <ResponsiveContainer>
              <LineChart data={spendVsLeads} margin={{ left: -10, right: 8, top: 10 }}>
                <CartesianGrid stroke="rgba(28,46,74,0.5)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8A9DC0" }} axisLine={false} tickLine={false} interval={4} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#3D8EF0" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#1A6FD4" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0D1526", border: "1px solid #1C2E4A", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="left"  type="monotone" dataKey="spend" name="Investimento (R$)" stroke="#3D8EF0" strokeWidth={2.5} dot={false} className="stroke-glow" animationDuration={1400} />
                <Line yAxisId="right" type="monotone" dataKey="leads" name="Leads" stroke="#1A6FD4" strokeWidth={2.5} dot={false} className="stroke-glow" animationDuration={1400} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass glass-hover rounded-xl p-5">
          <h3 className="font-display font-semibold">Leads por Plataforma</h3>
          <p className="text-xs text-muted-foreground">Distribuição atual</p>
          <div className="mt-2 h-[200px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={platformData} dataKey="value" innerRadius={55} outerRadius={85} stroke="none" animationDuration={1200}>
                  {platformData.map((p, i) => <Cell key={i} fill={p.color} style={{ filter: `drop-shadow(0 0 6px ${p.color}aa)` }} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0D1526", border: "1px solid #1C2E4A", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 text-xs">
            {platformData.map(p => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: p.color, boxShadow: `0 0 6px ${p.color}` }} />{p.name}</div>
                <span className="font-mono">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="glass glass-hover rounded-xl p-5 xl:col-span-2">
          <h3 className="font-display font-semibold">Leads por Campanha</h3>
          <div className="mt-3 h-[280px]">
            <ResponsiveContainer>
              <BarChart data={byCampaign} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid stroke="rgba(28,46,74,0.4)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#8A9DC0" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#E8EEF8" }} axisLine={false} tickLine={false} width={170} />
                <Tooltip
                  contentStyle={{ background: "#0D1526", border: "1px solid #1C2E4A", borderRadius: 8, fontSize: 12 }}
                  formatter={(_v: any, _n, p: any) => [`${p.payload.leads} leads · CPL ${brl(p.payload.cpl)}`, "Performance"]}
                />
                <Bar dataKey="leads" radius={[0, 4, 4, 0]} animationDuration={1400}>
                  {byCampaign.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? "#1A6FD4" : "#3D8EF0"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass glass-hover rounded-xl p-5">
          <h3 className="font-display font-semibold">Top Criativos</h3>
          <p className="text-xs text-muted-foreground mb-3">Anúncios em destaque</p>
          <div className="space-y-3">
            {campaigns_meta.slice(0, 4).map((c, i) => (
              <div key={c.id} className="flex gap-3 p-2 rounded-lg hover:bg-secondary/40 transition-colors">
                <div className="h-14 w-14 rounded-md bg-gradient-to-br from-cyan/30 to-gold/20 border border-border/60 flex items-center justify-center shrink-0">
                  {c.platform === "Facebook" ? <Facebook className="h-5 w-5 text-cyan" /> :
                    c.platform === "Instagram" ? <Instagram className="h-5 w-5 text-gold" /> :
                    <Globe className="h-5 w-5 text-purple-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">{c.platform} · {c.leads} leads</p>
                  <div className="flex gap-3 mt-1 font-mono text-[11px]">
                    <span className="text-gold">{brl(c.spend)}</span>
                    <span className="text-cyan">CPL {brl(c.spend / c.leads)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign table */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold">Campanhas</h3>
            <p className="text-xs text-muted-foreground">{campaigns_meta.length} campanhas no período</p>
          </div>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar campanha..." className="bg-secondary/60 border border-border/60 rounded-md px-3 py-1.5 text-xs outline-none focus:border-cyan/60 w-[240px]" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <th className="text-left font-medium py-2.5">Campanha</th>
                <th className="text-left font-medium">Status</th>
                <th className="text-right font-medium">Budget</th>
                <th className="text-right font-medium">Spend</th>
                <th className="text-right font-medium">Leads</th>
                <th className="text-right font-medium">CPL</th>
                <th className="text-right font-medium">CTR</th>
                <th className="text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {c.platform === "Facebook" ? <Facebook className="h-3.5 w-3.5 text-cyan" /> :
                        c.platform === "Instagram" ? <Instagram className="h-3.5 w-3.5 text-gold" /> :
                        <Globe className="h-3.5 w-3.5 text-purple-400" />}
                      {c.name}
                    </div>
                  </td>
                  <td>
                    <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-semibold",
                      c.status === "Ativa" ? "bg-emerald-500/15 text-emerald-400" : "bg-muted-foreground/15 text-muted-foreground")}>{c.status}</span>
                  </td>
                  <td className="text-right font-mono">{brl(c.budget)}</td>
                  <td className="text-right font-mono">{brl(c.spend)}</td>
                  <td className="text-right font-mono text-cyan">{c.leads}</td>
                  <td className="text-right font-mono">{brl(c.spend / c.leads)}</td>
                  <td className="text-right font-mono">{pct((c.clicks/c.impressions)*100)}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <button className="h-7 w-7 rounded-md hover:bg-secondary/60 flex items-center justify-center"><Eye className="h-3.5 w-3.5" /></button>
                      <button className="h-7 w-7 rounded-md hover:bg-secondary/60 flex items-center justify-center"><Pause className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiMini({ label, value, format, color }: { label: string; value: number; format?: (n: number) => string; color: string }) {
  return (
    <div className="glass glass-hover rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">{label}</p>
      <div className="mt-2 font-mono text-2xl font-semibold" style={{ color }}>
        <CountUp value={value} format={format} />
      </div>
    </div>
  );
}
