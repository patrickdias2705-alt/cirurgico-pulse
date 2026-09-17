import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRightLeft,
  BriefcaseBusiness,
  CircleDollarSign,
  Clock3,
  DatabaseZap,
  MessageCircle,
  Target,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  DashboardEmpty,
  DashboardError,
  DashboardLoading,
} from "@/components/analytics/dashboard-states";
import { FiltersBar } from "@/components/analytics/filters-bar";
import { CountUp } from "@/components/ui/count-up";
import { initialAnalyticsFilters, useDashboardData } from "@/lib/analytics/client";
import type { AnalyticsFilters } from "@/lib/analytics/types";
import { brl, num } from "@/lib/format";

export const Route = createFileRoute("/_app/")({ component: Dashboard });

const chartColors = ["#3D8EF0", "#5BA8FF", "#6B8F7A", "#9B8AFB", "#E8A020", "#D94040"];

function Dashboard() {
  const [filters, setFilters] = useState<AnalyticsFilters>(() => initialAnalyticsFilters());
  const query = useDashboardData(filters);
  if (query.isPending) return <DashboardLoading />;
  if (query.isError || !query.data) return <DashboardError retry={() => void query.refetch()} />;
  const data = query.data;
  const empty =
    data.overview.newLeads === 0 &&
    data.overview.openDeals === 0 &&
    data.operations.openConversations === 0;
  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[.24em] text-cyan">Inteligência comercial</p>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            Pulso da operação
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bitrix24 + WhatsApp WF · fuso de São Paulo
          </p>
        </div>
        <SyncBadge status={data.quality.status} lastSync={data.quality.lastSuccessfulSyncAt} />
      </section>
      <FiltersBar filters={filters} data={data} onChange={setFilters} />
      <OperationalStrip data={data} />
      {empty ? (
        <DashboardEmpty />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
            <Metric icon={UserPlus} label="Novos leads" value={data.overview.newLeads} drilldown />
            <Metric icon={Users} label="Carteira" value={data.overview.portfolio} drilldown />
            <Metric icon={Target} label="Propostas" value={data.overview.proposals} drilldown />
            <Metric
              icon={Trophy}
              label="Ganhos"
              value={data.overview.won}
              tone="success"
              drilldown
            />
            <Metric
              icon={AlertTriangle}
              label="Desqualificados"
              value={data.overview.disqualified}
              drilldown
            />
            <Metric
              icon={BriefcaseBusiness}
              label="Negócios abertos"
              value={data.overview.openDeals}
              drilldown
            />
            <Metric
              icon={CircleDollarSign}
              label="Valor ganho"
              value={data.overview.wonValue}
              format={brl}
              wide
            />
            <Metric
              icon={BriefcaseBusiness}
              label="Pipeline aberto"
              value={data.overview.pipelineValue}
              format={brl}
              wide
            />
            <Metric
              icon={Target}
              label="Conversão"
              value={data.overview.conversionRate}
              format={(value) => `${value.toFixed(1)}%`}
            />
            <Metric icon={AlertTriangle} label="Needs review" value={data.overview.needsReview} />
            <Metric icon={Users} label="Sem responsável" value={data.overview.unassigned} />
            <Metric
              icon={MessageCircle}
              label="Conversas"
              value={data.operations.openConversations}
            />
            <Metric
              icon={Clock3}
              label="Resposta média"
              value={data.operations.averageFirstResponseSeconds ?? 0}
              format={formatDuration}
            />
          </section>
          <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <ChartCard title="Evolução comercial" subtitle="Entrada, proposta e ganho no período">
              <ResponsiveContainer width="100%" height={270}>
                <AreaChart data={data.timeseries}>
                  <defs>
                    <linearGradient id="leadArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#3D8EF0" stopOpacity={0.45} />
                      <stop offset="1" stopColor="#3D8EF0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1C2E4A" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => value.slice(5)}
                    tick={{ fill: "#8A9DC0", fontSize: 11 }}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#8A9DC0", fontSize: 11 }}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="newLeads"
                    name="Novos leads"
                    stroke="#5BA8FF"
                    fill="url(#leadArea)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="proposals"
                    name="Propostas"
                    stroke="#E8A020"
                    fill="transparent"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="won"
                    name="Ganhos"
                    stroke="#6B8F7A"
                    fill="transparent"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Funil real" subtitle="Etapa atual dos negócios criados no período">
              <div className="space-y-3 pt-2">
                {data.funnel.map((item, index) => (
                  <div key={item.bucket}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-mono font-semibold">
                        {num(item.count)}{" "}
                        <small className="font-sans font-normal text-muted-foreground">
                          ({item.percentage.toFixed(1)}%)
                        </small>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(item.percentage, item.count ? 4 : 0)}%`,
                          background: chartColors[index],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </section>
          <section className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title="Aquisição por origem"
              subtitle="Volume capturado pelo SOURCE_ID do Bitrix"
            >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.sources} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid stroke="#1C2E4A" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: "#8A9DC0", fontSize: 11 }}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="sourceName"
                    width={125}
                    tick={{ fill: "#E8EEF8", fontSize: 11 }}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="leads" name="Leads" radius={[0, 5, 5, 0]}>
                    {data.sources.map((item, index) => (
                      <Cell
                        key={`${item.sourceId}-${index}`}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard
              title="Performance por responsável"
              subtitle="Somente dados permitidos para o perfil autenticado"
            >
              <SellerTable sellers={data.sellers} />
            </ChartCard>
          </section>
        </>
      )}
    </div>
  );
}

const tooltipStyle = {
  background: "#0D1526",
  border: "1px solid #1C2E4A",
  borderRadius: 8,
  fontSize: 12,
};
function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <article className="glass rounded-xl p-5">
      <div className="mb-5">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </article>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
  format = num,
  tone,
  wide,
  drilldown = false,
}: {
  icon: typeof UserPlus;
  label: string;
  value: number;
  format?: (value: number) => string;
  tone?: string;
  wide?: boolean;
  drilldown?: boolean;
}) {
  const content = (
    <article className={`metric-card rounded-xl p-4 ${wide ? "col-span-2" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[.16em] text-muted-foreground">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${tone === "success" ? "text-moss" : "text-cyan"}`} />
      </div>
      <p className="mt-3 truncate font-mono text-2xl font-semibold">
        <CountUp value={value} format={format} duration={700} />
      </p>
    </article>
  );
  return drilldown ? (
    <Link
      to="/contacts"
      className="rounded-xl transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {content}
    </Link>
  ) : (
    content
  );
}
function OperationalStrip({ data }: { data: ReturnType<typeof useDashboardData>["data"] & {} }) {
  if (!data) return null;
  const items = [
    { icon: MessageCircle, label: "Inbound hoje", value: data.operations.inboundToday },
    { icon: MessageCircle, label: "Outbound hoje", value: data.operations.outboundToday },
    { icon: AlertTriangle, label: "Revisão", value: data.operations.needsReview },
    { icon: Users, label: "Sem responsável", value: data.operations.unassigned },
    { icon: ArrowRightLeft, label: "Transferências", value: data.operations.transfers },
  ];
  return (
    <section className="grid overflow-hidden rounded-xl border border-border/70 bg-card/55 sm:grid-cols-5">
      {items.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0 sm:border-b-0 sm:border-r"
        >
          <Icon className="h-4 w-4 text-cyan" />
          <div>
            <p className="font-mono text-lg font-semibold">{num(value)}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
function SyncBadge({ status, lastSync }: { status: string; lastSync: string | null }) {
  const healthy = status === "SUCCESS";
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${healthy ? "border-moss/40 bg-moss/10" : "border-amber-400/40 bg-amber-400/10"}`}
    >
      <DatabaseZap className={`h-4 w-4 ${healthy ? "text-moss" : "text-amber-400"}`} />
      <div>
        <p className="text-xs font-semibold">Sync {status.toLowerCase()}</p>
        <p className="text-[10px] text-muted-foreground">
          {lastSync ? new Date(lastSync).toLocaleString("pt-BR") : "Nunca sincronizado"}
        </p>
      </div>
    </div>
  );
}
function SellerTable({
  sellers,
}: {
  sellers: Array<{
    sellerId: number;
    sellerName: string;
    leads: number;
    proposals: number;
    won: number;
    wonValue: number;
    conversionRate: number;
  }>;
}) {
  return sellers.length ? (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="pb-3 font-medium">Responsável</th>
            <th className="pb-3 text-right font-medium">Leads</th>
            <th className="pb-3 text-right font-medium">Propostas</th>
            <th className="pb-3 text-right font-medium">Ganhos</th>
            <th className="pb-3 text-right font-medium">Conversão</th>
            <th className="pb-3 text-right font-medium">Valor ganho</th>
          </tr>
        </thead>
        <tbody>
          {sellers.map((seller) => (
            <tr key={seller.sellerId} className="border-b border-border/40 last:border-0">
              <td className="py-3 font-medium">{seller.sellerName}</td>
              <td className="py-3 text-right font-mono">{seller.leads}</td>
              <td className="py-3 text-right font-mono">{seller.proposals}</td>
              <td className="py-3 text-right font-mono text-moss">{seller.won}</td>
              <td className="py-3 text-right font-mono">{seller.conversionRate.toFixed(1)}%</td>
              <td className="py-3 text-right font-mono text-cyan">{brl(seller.wonValue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p className="py-16 text-center text-sm text-muted-foreground">
      Sem dados de responsáveis no período.
    </p>
  );
}
function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
  return `${(seconds / 3600).toFixed(1)}h`;
}
