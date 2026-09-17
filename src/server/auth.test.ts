import { afterEach, describe, expect, it, vi } from "vitest";

import { requireActor } from "./auth";

const env = {
  ANALYTICS_DATABASE_URL: "postgres://read-only.invalid/db",
  ANALYTICS_SYNC_DATABASE_URL: "postgres://sync.invalid/db",
  ANALYTICS_MEMBER_ID: "member-real",
  ANALYTICS_SYNC_SECRET: "test-secret",
  WF_AUTH_BASE_URL: "https://wf-auth.test",
};

describe("analytics authentication", () => {
  afterEach(() => vi.restoreAllMocks());

  it("derives role and seller from the server-side WF session", async () => {
    Object.assign(process.env, env);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          app_auth_enabled: true,
          user: { display_name: "Mavi", role: "SELLER", seller_id: 2, bitrix_user_id: 20 },
        }),
      ),
    );
    const actor = await requireActor(
      new Request("https://pulse.test/api/analytics/dashboard", {
        headers: { cookie: "wf_app_session=opaque" },
      }),
    );
    expect(actor).toMatchObject({
      memberId: "member-real",
      role: "SELLER",
      sellerId: 2,
      bitrixUserId: 20,
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://wf-auth.test/api/auth/me",
      expect.objectContaining({ headers: { cookie: "wf_app_session=opaque" } }),
    );
  });

  it("does not accept an unauthenticated request", async () => {
    Object.assign(process.env, env);
    await expect(
      requireActor(new Request("https://pulse.test/api/analytics/dashboard")),
    ).rejects.toMatchObject({ status: 401 });
  });
});
