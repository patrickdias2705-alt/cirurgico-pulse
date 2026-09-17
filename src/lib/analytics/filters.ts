import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import type { AnalyticsFilters, AppRole } from "./types";

export const OPERATION_TIMEZONE = "America/Sao_Paulo";

export interface DateRange {
  from: Date;
  toExclusive: Date;
}

function validDate(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function defaultDateRange(now = new Date()): Pick<AnalyticsFilters, "dateFrom" | "dateTo"> {
  const end = formatInTimeZone(now, OPERATION_TIMEZONE, "yyyy-MM-dd");
  const startDate = new Date(now.getTime() - 29 * 86_400_000);
  return {
    dateFrom: formatInTimeZone(startDate, OPERATION_TIMEZONE, "yyyy-MM-dd"),
    dateTo: end,
  };
}

export function resolveDateRange(dateFrom: string, dateTo: string): DateRange {
  if (!validDate(dateFrom) || !validDate(dateTo) || dateFrom > dateTo) {
    throw new Error("INVALID_DATE_RANGE");
  }
  const from = fromZonedTime(`${dateFrom}T00:00:00`, OPERATION_TIMEZONE);
  const endStart = fromZonedTime(`${dateTo}T00:00:00`, OPERATION_TIMEZONE);
  return { from, toExclusive: new Date(endStart.getTime() + 86_400_000) };
}

export function parseAnalyticsFilters(url: URL): AnalyticsFilters {
  const defaults = defaultDateRange();
  const dateFrom = url.searchParams.get("date_from") ?? defaults.dateFrom;
  const dateTo = url.searchParams.get("date_to") ?? defaults.dateTo;
  resolveDateRange(dateFrom, dateTo);

  const sellerRaw = url.searchParams.get("seller_id");
  const sellerId = sellerRaw === null || sellerRaw === "" ? null : Number(sellerRaw);
  if (sellerId !== null && ![1, 2, 3].includes(sellerId)) {
    throw new Error("INVALID_SELLER_FILTER");
  }

  return {
    dateFrom,
    dateTo,
    sellerId,
    sourceId: url.searchParams.get("source_id") || null,
    stageId: url.searchParams.get("stage_id") || null,
  };
}

export function enforceSellerScope(
  role: AppRole,
  actorSellerId: number | null,
  requestedSellerId: number | null,
): number | null {
  if (role === "SELLER") {
    if (actorSellerId === null) throw new Error("SELLER_PROFILE_INVALID");
    return actorSellerId;
  }
  return requestedSellerId;
}
