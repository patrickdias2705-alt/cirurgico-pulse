# KPI definitions

All period boundaries are interpreted in `America/Sao_Paulo` and sent to PostgreSQL as UTC instants. Category is always Bitrix category 0.

- **Novos leads / carteira / propostas / desqualificados:** deals created in the selected period whose current explicit business bucket is respectively `NEW_LEAD`, `PORTFOLIO`, `PROPOSAL`, `DISQUALIFIED`.
- **Ganhos and value won:** deals currently mapped to business `WON` (`stage_id=LOSE`) with `closed_at` in the period. This intentionally ignores Bitrix's default WON/LOSE semantics.
- **Eligible leads:** deals created in the period except `AUTO_UNREGISTERED`; unknown buckets remain eligible so drift is visible instead of silently discarded.
- **Conversion:** won deals closed in the period divided by eligible deals created in the period. This is an operational period ratio, not a cohort conversion.
- **Open deals / pipeline value:** current snapshot of open deals and their `opportunity`, as constrained by active seller/source/stage filters. It is not limited by creation date.
- **Funnel:** current stage distribution of deals created in the selected period. Percent uses all mapped funnel buckets; drop-off compares adjacent displayed buckets.
- **Origin metrics:** deals created in the period grouped by Bitrix `source_id`; conversion is current business WON divided by deals for that origin in the period.
- **Conversations/new conversations:** WF conversation snapshot / conversations created in period.
- **Inbound/outbound today:** messages by effective provider/created timestamp on the current São Paulo calendar date. Status events are not messages.
- **First human response:** seconds from the first customer inbound to the first later outbound with `sender_origin=WF_WIDGET`. Automated/system/app echoes are excluded.
- **Round-robin:** assignment audit rows with `AUTO_TRAFFIC_ROUND_ROBIN`. Other assignment reasons are shown as preserved ownership/other.
- **Transfers:** successful (`status=SUCCESS`) ownership-transfer audit rows in the period.

Source and stage filters also constrain linked operational indicators. A WhatsApp-only conversation without the requested CRM link is excluded from a CRM-specific filter, but remains present without that filter.
