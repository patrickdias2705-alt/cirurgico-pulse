import { describe, expect, it } from "vitest";

import {
  defaultDateRange,
  enforceSellerScope,
  parseAnalyticsFilters,
  resolveDateRange,
} from "./filters";

describe("analytics filters", () => {
  it("forces a seller to their own portfolio", () => {
    expect(enforceSellerScope("SELLER", 2, 1)).toBe(2);
    expect(enforceSellerScope("SUPERVISOR", null, 1)).toBe(1);
  });

  it("rejects seller ids outside the canonical team", () => {
    expect(() => parseAnalyticsFilters(new URL("https://pulse.test/?seller_id=99"))).toThrow(
      "INVALID_SELLER_FILTER",
    );
  });

  it("preserves exact source and stage filters", () => {
    const filters = parseAnalyticsFilters(
      new URL(
        "https://pulse.test/?date_from=2026-09-01&date_to=2026-09-17&source_id=UC_N5ZRK7&stage_id=NEW",
      ),
    );
    expect(filters).toMatchObject({ sourceId: "UC_N5ZRK7", stageId: "NEW" });
  });

  it("uses America/Sao_Paulo at the UTC boundary", () => {
    expect(defaultDateRange(new Date("2026-01-01T02:30:00Z")).dateTo).toBe("2025-12-31");
    const range = resolveDateRange("2026-01-01", "2026-01-01");
    expect(range.from.toISOString()).toBe("2026-01-01T03:00:00.000Z");
    expect(range.toExclusive.toISOString()).toBe("2026-01-02T03:00:00.000Z");
  });
});
