import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { syncBatchSchema } from "./sync";

describe("analytics sync contract", () => {
  it("accepts incremental batches and preserves final_batch", () => {
    const result = syncBatchSchema.parse({
      member_id: "portal",
      resource: "DEALS",
      cursor: "2026-09-17T12:00:00Z",
      final_batch: false,
      records: [],
    });
    expect(result.final_batch).toBe(false);
    expect(result.cursor).toContain("2026-09-17");
  });

  it("accepts categories as an independent reference resource", () => {
    expect(
      syncBatchSchema.parse({
        member_id: "portal",
        resource: "CATEGORIES",
        records: [{ id: 0, name: "FUNIL DE VENDAS" }],
      }).resource,
    ).toBe("CATEGORIES");
  });

  it("rejects oversized batches", () => {
    expect(() =>
      syncBatchSchema.parse({
        member_id: "portal",
        resource: "DEALS",
        records: Array.from({ length: 1001 }, () => ({})),
      }),
    ).toThrow();
  });

  it("defines convergent UPSERTs and independent migrations", () => {
    const migration = readFileSync(
      resolve(process.cwd(), "migrations/001_analytics_foundation.sql"),
      "utf8",
    );
    expect(migration).toContain("analytics.schema_migrations");
    expect(migration).not.toContain("INSERT INTO wf_schema_migrations");
    expect(readFileSync(resolve(process.cwd(), "src/server/sync.ts"), "utf8")).toMatch(
      /ON CONFLICT \(member_id, bitrix_deal_id\) DO UPDATE/,
    );
    expect(readFileSync(resolve(process.cwd(), "src/server/sync.ts"), "utf8")).toMatch(
      /ON CONFLICT \(member_id, bitrix_contact_id\) DO UPDATE/,
    );
  });
});
