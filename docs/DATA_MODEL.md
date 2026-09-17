# Data model

Migration `001_analytics_foundation.sql` creates, without executing automatically:

- `analytics.schema_migrations`: independent migration ledger.
- `analytics.bitrix_categories`, `bitrix_stages`, `bitrix_sources`, `bitrix_users`: reference snapshots.
- `analytics.bitrix_contacts`: minimal contact snapshot (name, normalized phone, owner, source, timestamps).
- `analytics.bitrix_deals`: deal snapshot keyed by `(member_id, bitrix_deal_id)`.
- `analytics.sync_state`: cursor, state, safe error code and processed count per resource.
- `analytics.deal_facts`: joins deal snapshots to friendly business mappings.
- `analytics.wf_conversation_facts`, `wf_assignment_facts`, `wf_transfer_facts`, `wf_response_facts`, `wf_message_facts`: minimal security-barrier views over inspected WF schema 007 columns.

No message body, media, token or provider payload is copied into analytics. Indices cover the period, close date, owner/source/stage and contact phone access paths. Bitrix IDs are external keys and every upsert is scoped by `member_id`.

The canonical mappings for category 0 are explicit: `NEW -> NEW_LEAD`, `PREPARATION -> PORTFOLIO`, `PREPAYMENT_INVOICE -> PROPOSAL`, `UC_OGQ7O3 -> AUTO_UNREGISTERED`, `WON -> DISQUALIFIED`, `LOSE -> WON`.
