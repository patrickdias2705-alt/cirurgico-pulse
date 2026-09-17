# Bitrix incremental sync

Use n8n as orchestrator; do not query its database. No production workflow is changed by this repository.

## Endpoint

`POST /api/internal/analytics/bitrix-sync` with `X-Pulse-Sync-Secret` and JSON:

```json
{
  "member_id": "portal-member-id",
  "resource": "DEALS",
  "records": [],
  "cursor": "2026-09-17T15:00:00Z",
  "final_batch": true
}
```

Resources: `CATEGORIES`, `STAGES`, `SOURCES`, `USERS`, `CONTACTS`, `DEALS`. Batches accept at most 1,000 records. The server performs UPSERTs; repeated deals/contacts converge on the same primary key. Deal updates older than `raw_updated_timestamp` cannot overwrite a newer snapshot.

`pending_cursor` may move during a run, but `last_cursor` and `last_successful_sync_at` advance only when `final_batch=true` commits. Failure records `SYNC_BATCH_REJECTED` and preserves the last valid cursor. Secrets, bodies and Bitrix IDs from message content are not logged.

## Recommended n8n schedule

1. Every 2–5 minutes, read the last successful cursor from workflow state, request Bitrix records ordered by modification time, and send bounded batches.
2. Retry 429/5xx with exponential backoff and jitter. Never mark the final batch until every prior batch succeeded.
3. Synchronize references before deals; synchronize related contacts discovered by changed deals.
4. Nightly, paginate a broader reconciliation window to repair drift using the same idempotent endpoint.
5. Alert when `/api/analytics/quality` reports `FAILED`, `NEVER` or `STALE`.

The connector must map Bitrix response names to the normalized field names documented in `docs/DATA_MODEL.md`. Do not send OAuth tokens in payloads.
