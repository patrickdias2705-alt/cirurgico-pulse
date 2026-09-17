export const BITRIX_STAGE_BUCKETS = {
  NEW: "NEW_LEAD",
  PREPARATION: "PORTFOLIO",
  PREPAYMENT_INVOICE: "PROPOSAL",
  UC_OGQ7O3: "AUTO_UNREGISTERED",
  WON: "DISQUALIFIED",
  LOSE: "WON",
} as const;

export const BITRIX_SOURCE_LABELS: Record<string, string> = {
  UC_5JWJUB: "Instagram",
  UC_N5ZRK7: "Google",
  UC_504DAI: "Cliente da carteira",
  UC_M1980I: "Tráfego",
  "WZa9e16c41-a4cc-4a95-b269-dc0784e92612": "WhatsApp",
};

export function businessBucket(stageId: string): string | null {
  return BITRIX_STAGE_BUCKETS[stageId as keyof typeof BITRIX_STAGE_BUCKETS] ?? null;
}

export function conversionRate(won: number, eligible: number): number {
  return eligible > 0 ? (won / eligible) * 100 : 0;
}
