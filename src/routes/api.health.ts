import { createFileRoute } from "@tanstack/react-router";

import { analyticsDb } from "@/server/db";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const sql = analyticsDb();
          const rows =
            await sql`SELECT COALESCE(MAX(version), 0) AS version FROM analytics.schema_migrations`;
          const current = Number(rows[0]?.version ?? 0);
          return Response.json(
            {
              ready: current >= 1,
              analytics_schema_required: 1,
              analytics_schema_current: current,
            },
            { status: current >= 1 ? 200 : 503 },
          );
        } catch {
          return Response.json(
            { ready: false, error: "ANALYTICS_DATABASE_UNAVAILABLE" },
            { status: 503 },
          );
        }
      },
    },
  },
});
