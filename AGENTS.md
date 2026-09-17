# Cirúrgico Pulse guardrails

Cirúrgico Pulse is a read-only commercial analytics product for WF Cirúrgicos. Its sources of truth are the Bitrix snapshot in the `analytics` schema and explicitly approved views over the WhatsApp WF operational schema 007.

## Non-negotiable rules

- Never write to `public.wf_*` tables from this repository.
- Never change WhatsApp ownership, round-robin, messages, media, CRM registration, n8n production workflows, Bitrix entities or stages.
- Never infer Bitrix semantics: `WON` means `DISQUALIFIED`, and `LOSE` means business `WON` for category 0.
- Never expose database URLs, service-role credentials, Bitrix tokens, n8n secrets, 360dialog keys or session cookies to the browser or logs.
- Seller RBAC is enforced server-side. Sellers 1/2/3 may only query their own portfolio. Supervisor/admin may use the global seller filter.
- Production must show unavailable/empty states, never fallback KPIs or random fixtures.
- `analytics.schema_migrations` is independent. Do not touch `wf_schema_migrations`.
- Migrations are manual and additive. Do not execute them automatically during build or startup.
- Deployment and production sync activation always require explicit approval.

## Required verification

Run `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`, and `git diff --check`. Review generated client bundles for server-only env names before release.

See `docs/ARCHITECTURE.md`, `docs/KPI_DEFINITIONS.md`, and `docs/OPERATIONS.md` before changing query semantics.
