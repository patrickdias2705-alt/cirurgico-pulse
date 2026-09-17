import { describe, expect, it } from "vitest";

import { businessBucket, conversionRate } from "./mappings";

describe("Bitrix business mapping", () => {
  it("honors the inverted WF WON/LOSE semantics", () => {
    expect(businessBucket("WON")).toBe("DISQUALIFIED");
    expect(businessBucket("LOSE")).toBe("WON");
  });

  it.each([
    ["NEW", "NEW_LEAD"],
    ["PREPARATION", "PORTFOLIO"],
    ["PREPAYMENT_INVOICE", "PROPOSAL"],
    ["UC_OGQ7O3", "AUTO_UNREGISTERED"],
  ])("maps %s to %s", (stage, bucket) => expect(businessBucket(stage)).toBe(bucket));

  it("does not invent mappings and handles empty KPI data", () => {
    expect(businessBucket("UNKNOWN")).toBeNull();
    expect(conversionRate(0, 0)).toBe(0);
    expect(conversionRate(2, 8)).toBe(25);
  });
});
