import { type ReactNode, useState } from "react";

import { initialAnalyticsFilters, useDashboardData } from "@/lib/analytics/client";
import type { AnalyticsFilters, DashboardPayload } from "@/lib/analytics/types";

import { DashboardError, DashboardLoading } from "./dashboard-states";
import { FiltersBar } from "./filters-bar";

export function AnalyticsPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: (data: DashboardPayload, filters: AnalyticsFilters) => ReactNode;
}) {
  const [filters, setFilters] = useState<AnalyticsFilters>(() => initialAnalyticsFilters());
  const query = useDashboardData(filters);
  if (query.isPending) return <DashboardLoading />;
  if (query.isError || !query.data) return <DashboardError retry={() => void query.refetch()} />;
  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      <header>
        <p className="text-[11px] uppercase tracking-[.22em] text-cyan">Cirúrgico Pulse</p>
        <h2 className="mt-1 font-display text-3xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </header>
      <FiltersBar filters={filters} data={query.data} onChange={setFilters} />
      {children(query.data, filters)}
    </div>
  );
}

export function DataTable({ headers, rows }: { headers: string[]; rows: Array<Array<ReactNode>> }) {
  return (
    <div className="glass overflow-x-auto rounded-xl">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/30 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
            {headers.map((header, index) => (
              <th key={header} className={`px-4 py-3 font-medium ${index ? "text-right" : ""}`}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-border/50 last:border-0 hover:bg-secondary/20"
            >
              {row.map((cell, index) => (
                <td
                  key={index}
                  className={`px-4 py-3 ${index ? "text-right font-mono" : "font-medium"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="p-12 text-center text-sm text-muted-foreground">
          Nenhum registro encontrado para os filtros.
        </p>
      )}
    </div>
  );
}
