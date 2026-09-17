import { useQuery } from "@tanstack/react-query";

import { defaultDateRange } from "./filters";
import type { AnalyticsFilters, DashboardPayload, DealRow } from "./types";

export interface DealsPage {
  items: DealRow[];
  total: number;
  page: number;
  pageSize: number;
}

export const initialAnalyticsFilters = (): AnalyticsFilters => ({
  ...defaultDateRange(),
  sellerId: null,
  sourceId: null,
  stageId: null,
});

export function analyticsSearch(filters: AnalyticsFilters): string {
  const params = new URLSearchParams({ date_from: filters.dateFrom, date_to: filters.dateTo });
  if (filters.sellerId) params.set("seller_id", String(filters.sellerId));
  if (filters.sourceId) params.set("source_id", filters.sourceId);
  if (filters.stageId) params.set("stage_id", filters.stageId);
  return params.toString();
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? `HTTP_${response.status}`);
  }
  return (await response.json()) as T;
}

export function useDashboardData(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ["analytics-dashboard", filters],
    queryFn: () =>
      requestJson<DashboardPayload>(`/api/analytics/dashboard?${analyticsSearch(filters)}`),
    enabled: typeof window !== "undefined",
    staleTime: 30_000,
    refetchInterval: 120_000,
  });
}

export function useDealsData(filters: AnalyticsFilters, page = 1) {
  return useQuery({
    queryKey: ["analytics-deals", filters, page],
    queryFn: () =>
      requestJson<DealsPage>(
        `/api/analytics/deals?${analyticsSearch(filters)}&page=${page}&page_size=30`,
      ),
    enabled: typeof window !== "undefined",
    staleTime: 30_000,
  });
}
