import { Filter } from "lucide-react";
import type { AnalyticsFilters, DashboardPayload } from "@/lib/analytics/types";

export function FiltersBar({
  filters,
  data,
  onChange,
}: {
  filters: AnalyticsFilters;
  data: DashboardPayload;
  onChange: (next: AnalyticsFilters) => void;
}) {
  const applyPreset = (preset: "today" | "7" | "30" | "month" | "previous") => {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const [year, month, day] = today.split("-").map(Number);
    const toInput = (date: Date) => date.toISOString().slice(0, 10);
    if (preset === "today") return onChange({ ...filters, dateFrom: today, dateTo: today });
    if (preset === "7" || preset === "30") {
      const days = Number(preset);
      return onChange({
        ...filters,
        dateFrom: toInput(new Date(Date.UTC(year, month - 1, day - days + 1))),
        dateTo: today,
      });
    }
    if (preset === "month")
      return onChange({
        ...filters,
        dateFrom: `${year}-${String(month).padStart(2, "0")}-01`,
        dateTo: today,
      });
    const previousEnd = new Date(Date.UTC(year, month - 1, 0));
    const previousStart = new Date(
      Date.UTC(previousEnd.getUTCFullYear(), previousEnd.getUTCMonth(), 1),
    );
    return onChange({ ...filters, dateFrom: toInput(previousStart), dateTo: toInput(previousEnd) });
  };
  return (
    <div className="glass flex flex-wrap items-end gap-3 rounded-xl p-3">
      <div className="mr-1 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-cyan">
        <Filter className="h-4 w-4" />
      </div>
      <label className="filter-field">
        <span>De</span>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
        />
      </label>
      <label className="filter-field">
        <span>Até</span>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
        />
      </label>
      {data.actor.role !== "SELLER" && (
        <label className="filter-field">
          <span>Responsável</span>
          <select
            value={filters.sellerId ?? ""}
            onChange={(e) =>
              onChange({ ...filters, sellerId: e.target.value ? Number(e.target.value) : null })
            }
          >
            <option value="">Todas</option>
            {data.filterOptions.sellers.map((item) => (
              <option key={item.sellerId} value={item.sellerId}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="filter-field">
        <span>Origem</span>
        <select
          value={filters.sourceId ?? ""}
          onChange={(e) => onChange({ ...filters, sourceId: e.target.value || null })}
        >
          <option value="">Todas</option>
          {data.filterOptions.sources.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="filter-field">
        <span>Etapa</span>
        <select
          value={filters.stageId ?? ""}
          onChange={(e) => onChange({ ...filters, stageId: e.target.value || null })}
        >
          <option value="">Todas</option>
          {data.filterOptions.stages.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex h-10 overflow-hidden rounded-lg border border-border bg-secondary/70">
        {[
          ["today", "Hoje"],
          ["7", "7d"],
          ["30", "30d"],
          ["month", "Mês"],
          ["previous", "Anterior"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => applyPreset(value as "today" | "7" | "30" | "month" | "previous")}
            className="border-r border-border px-2.5 text-xs last:border-0 hover:bg-primary/15 hover:text-cyan"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
