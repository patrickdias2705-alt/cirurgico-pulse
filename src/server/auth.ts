import type { AnalyticsActor, AppRole } from "@/lib/analytics/types";

import { serverEnv } from "./env";

const SESSION_COOKIE = "wf_app_session";

interface WfSessionPayload {
  app_auth_enabled?: boolean;
  user?: {
    display_name?: string;
    role?: string;
    seller_id?: number | null;
    bitrix_user_id?: number | null;
  };
}

export class AnalyticsAuthError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function cookieValue(request: Request): string | null {
  const header = request.headers.get("cookie") ?? "";
  const cookie = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return cookie?.slice(SESSION_COOKIE.length + 1) ?? null;
}

export async function requireActor(request: Request): Promise<AnalyticsActor> {
  const session = cookieValue(request);
  if (!session) throw new AnalyticsAuthError(401, "AUTH_REQUIRED");

  const env = serverEnv();
  const response = await fetch(`${env.wfAuthBaseUrl}/api/auth/me`, {
    headers: { cookie: `${SESSION_COOKIE}=${session}` },
    signal: AbortSignal.timeout(8_000),
  });
  if (response.status === 401) throw new AnalyticsAuthError(401, "SESSION_EXPIRED");
  if (!response.ok) throw new AnalyticsAuthError(503, "AUTH_SERVICE_UNAVAILABLE");

  const payload = (await response.json()) as WfSessionPayload;
  const user = payload.user;
  const role = user?.role as AppRole | undefined;
  if (
    payload.app_auth_enabled === false ||
    !user ||
    !user.display_name ||
    !role ||
    !["SELLER", "SUPERVISOR", "ADMIN"].includes(role)
  ) {
    throw new AnalyticsAuthError(403, "PROFILE_NOT_AUTHORIZED");
  }
  return {
    memberId: env.analyticsMemberId,
    displayName: user.display_name,
    role,
    sellerId: user.seller_id ?? null,
    bitrixUserId: user.bitrix_user_id ?? null,
  };
}

export function sessionCookieName(): string {
  return SESSION_COOKIE;
}
