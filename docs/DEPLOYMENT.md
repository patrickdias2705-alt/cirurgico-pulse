# Deployment

The existing target is a TanStack Start SSR build for Cloudflare Workers (`wrangler.jsonc` with `nodejs_compat`). Do not deploy automatically.

1. Provision `wf_dashboard_ro` and `wf_analytics_sync` database roles outside application code. Give the first no write privileges; give the second only the grants listed in migration 001.
2. Review and manually apply `migrations/001_analytics_foundation.sql` to the existing PostgreSQL/Supabase database using a migration owner.
3. Set every variable from `.env.example` as encrypted server-side deployment configuration. Never prefix secrets with `VITE_`.
4. Run `bun install --frozen-lockfile`, `bun run test`, `bun run lint`, `bun run typecheck`, `bun run build`.
5. Deploy the generated Worker using the existing platform pipeline and configure the custom domain there.
6. Verify `/api/health`, auth proxy, seller RBAC and empty dashboard before activating n8n sync.
7. Configure the n8n endpoint/secret, run reference resources first, then contacts/deals, then inspect data quality.

Direct PostgreSQL connectivity must be validated in the target Cloudflare account before rollout. If that account does not permit the required TCP connectivity, deploy the unchanged TanStack server build to a Node-compatible EasyPanel service rather than exposing a database credential to the SPA.
