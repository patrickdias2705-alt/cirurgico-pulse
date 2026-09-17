export interface ServerEnv {
  analyticsMemberId: string;
  analyticsDatabaseUrl: string;
  analyticsSyncDatabaseUrl: string;
  analyticsSyncSecret: string;
  wfAuthBaseUrl: string;
  bitrixDomain: string;
  syncStaleMinutes: number;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`CONFIG_MISSING_${name}`);
  return value;
}

export function serverEnv(): ServerEnv {
  const readUrl = required("ANALYTICS_DATABASE_URL");
  const stale = Number(process.env.ANALYTICS_SYNC_STALE_MINUTES ?? "10");
  return {
    analyticsMemberId: required("ANALYTICS_MEMBER_ID"),
    analyticsDatabaseUrl: readUrl,
    analyticsSyncDatabaseUrl: required("ANALYTICS_SYNC_DATABASE_URL"),
    analyticsSyncSecret: required("ANALYTICS_SYNC_SECRET"),
    wfAuthBaseUrl: required("WF_AUTH_BASE_URL").replace(/\/$/, ""),
    bitrixDomain: (process.env.BITRIX_DOMAIN ?? "b24-hybg84.bitrix24.com.br").trim(),
    syncStaleMinutes: Number.isFinite(stale) && stale > 0 ? stale : 10,
  };
}
