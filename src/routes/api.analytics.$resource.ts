import { createFileRoute } from "@tanstack/react-router";

import { enforceSellerScope, parseAnalyticsFilters } from "@/lib/analytics/filters";
import { loadDashboard, loadDeals } from "@/server/analytics";
import { AnalyticsAuthError, requireActor } from "@/server/auth";

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "private, max-age=30" } });
}

export const Route = createFileRoute("/api/analytics/$resource")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const actor = await requireActor(request);
          const parsed = parseAnalyticsFilters(new URL(request.url));
          const filters = {
            ...parsed,
            sellerId: enforceSellerScope(actor.role, actor.sellerId, parsed.sellerId),
          };
          if (params.resource === "dashboard") return json(await loadDashboard(actor, filters));
          if (
            [
              "overview",
              "funnel",
              "sources",
              "sellers",
              "timeseries",
              "operations",
              "quality",
              "filters",
            ].includes(params.resource)
          ) {
            const dashboard = await loadDashboard(actor, filters);
            const resources = {
              overview: dashboard.overview,
              funnel: dashboard.funnel,
              sources: dashboard.sources,
              sellers: dashboard.sellers,
              timeseries: dashboard.timeseries,
              operations: dashboard.operations,
              quality: dashboard.quality,
              filters: dashboard.filterOptions,
            };
            return json(resources[params.resource as keyof typeof resources]);
          }
          if (params.resource === "deals") {
            const url = new URL(request.url);
            return json(
              await loadDeals(
                actor,
                filters,
                Number(url.searchParams.get("page") ?? 1),
                Number(url.searchParams.get("page_size") ?? 30),
              ),
            );
          }
          return json({ error: "ANALYTICS_RESOURCE_NOT_FOUND" }, 404);
        } catch (error) {
          if (error instanceof AnalyticsAuthError)
            return json({ error: error.message }, error.status);
          if (error instanceof Error && error.message.startsWith("INVALID_"))
            return json({ error: error.message }, 400);
          console.error("ANALYTICS_REQUEST_FAILED", {
            error: error instanceof Error ? error.name : "UnknownError",
          });
          return json({ error: "ANALYTICS_UNAVAILABLE" }, 503);
        }
      },
    },
  },
});
