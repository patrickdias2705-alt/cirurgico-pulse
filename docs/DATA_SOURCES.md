# Data sources

## Bitrix snapshot

Deals provide stage, source, responsible user, opportunity, currency and creation/update/close timestamps. Contacts are intentionally minimal. Users, sources, stages and categories are synchronized reference data. The dashboard does not call Bitrix while rendering.

Friendly source labels are Instagram (`UC_5JWJUB`), Google (`UC_N5ZRK7`), Cliente da carteira (`UC_504DAI`), Tráfego (`UC_M1980I`) and WhatsApp (`WZa9e16c41-a4cc-4a95-b269-dc0784e92612`). A missing source is represented only in filters/UI as `Sem origem`; no fake source is persisted.

## WhatsApp WF

The dashboard reads only the views defined by its migration. Conversations supply owner, origin, unread, review state and CRM links. Assignment and transfer audits supply distribution facts. Messages supply direction/timestamp but never text. First-response time uses the first real inbound and the first subsequent `WF_WIDGET` outbound.

The n8n internal database, Meta Ads data, provider payloads and media are not analytics sources. “Origens” means Bitrix `SOURCE_ID`, not ad spend or platform attribution.
