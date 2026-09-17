# Architecture

## Before

The repository was a TanStack Start visual prototype. All CRM, inbox, campaigns, routing and settings data came from `src/lib/mock-data.ts`, route-local constants and a Zustand store that simulated mutations in the browser. There was no authentication, database or API layer.

## Current design

```text
Bitrix24 REST -> n8n scheduled workflow -> POST /api/internal/analytics/bitrix-sync
                                             -> analytics snapshot tables

WhatsApp WF schema 007 -> read-only analytics views ---+
                                                        +-> server query layer -> authenticated API -> React Query UI
analytics snapshot tables -----------------------------+

WhatsApp WF /api/auth/* -> same-origin auth proxy -> wf_app_session -> server-side RBAC
```

TanStack Start remains the full-stack framework and the existing Cloudflare Worker build remains configured. React 19, Tailwind 4, Recharts, Lucide, Syne, DM Sans, JetBrains Mono, the navy palette, glass cards, collapsible sidebar and mobile bottom navigation were preserved.

Two database identities are deliberately separate: `ANALYTICS_DATABASE_URL` is read-only and serves dashboard queries; `ANALYTICS_SYNC_DATABASE_URL` can upsert only the analytics snapshot. The browser uses neither.

Dashboard results are aggregated in one server request and cached in memory for 60 seconds. All queries bind `member_id`; seller sessions additionally force their canonical `seller_id` regardless of browser parameters.
