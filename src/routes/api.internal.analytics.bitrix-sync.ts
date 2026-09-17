import { createFileRoute } from "@tanstack/react-router";

import { ingestSyncBatch, syncBatchSchema, verifySyncSecret } from "@/server/sync";
import { serverEnv } from "@/server/env";

export const Route = createFileRoute("/api/internal/analytics/bitrix-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!verifySyncSecret(request.headers.get("X-Pulse-Sync-Secret"))) {
          return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
        }
        const parsed = syncBatchSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success)
          return Response.json({ error: "INVALID_SYNC_PAYLOAD" }, { status: 422 });
        if (parsed.data.member_id !== serverEnv().analyticsMemberId) {
          return Response.json({ error: "MEMBER_SCOPE_MISMATCH" }, { status: 403 });
        }
        try {
          const result = await ingestSyncBatch(parsed.data);
          return Response.json({ ok: true, ...result });
        } catch (error) {
          console.error("BITRIX_ANALYTICS_SYNC_FAILED", {
            resource: parsed.data.resource,
            error: error instanceof Error ? error.name : "UnknownError",
          });
          return Response.json({ error: "SYNC_FAILED" }, { status: 500 });
        }
      },
    },
  },
});
