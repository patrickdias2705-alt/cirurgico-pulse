# Operations

## Readiness and monitoring

- `GET /api/health` checks analytics migration version 1 without revealing connection information.
- The Quality page and `/api/analytics/quality` show sync status, last success, counts and stale state.
- `ANALYTICS_SYNC_STALE_MINUTES` controls the stale warning (default 10 minutes).
- A Bitrix outage does not erase snapshots; the dashboard serves the last committed data and marks it stale.

## Incident checks

1. Confirm WhatsApp WF authentication `/api/auth/me` works through the proxy.
2. Confirm `analytics.schema_migrations` is version 1.
3. Inspect `analytics.sync_state` using an authorized operator account; do not print credentials or upstream payloads.
4. If a sync failed, rerun from `last_cursor`, not `pending_cursor`. UPSERTs are idempotent.
5. Validate seller sessions cannot query another seller by changing `seller_id` in the URL.

## Manual migration

From a trusted machine with `psql`, review the target first, then run:

```sh
psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/001_analytics_foundation.sql
```

This command is documentation only and is never called by startup/build. Back up and rehearse against a schema-007 staging clone before production.
