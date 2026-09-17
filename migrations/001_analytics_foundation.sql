-- Cirurgico Pulse analytics foundation.
-- Manual execution only. Does not mutate the WF operational tables or wf_schema_migrations.

BEGIN;

CREATE SCHEMA IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS analytics.schema_migrations (
    version integer PRIMARY KEY,
    name text NOT NULL UNIQUE,
    applied_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
    IF to_regclass('public.wf_conversations') IS NULL
       OR to_regclass('public.wf_messages') IS NULL
       OR to_regclass('public.wf_conversation_assignments') IS NULL
       OR to_regclass('public.wf_ownership_transfer_audit') IS NULL THEN
        RAISE EXCEPTION 'PULSE_ANALYTICS_REQUIRES_WF_SCHEMA_007';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wf_analytics_sync') THEN
        GRANT USAGE ON SCHEMA analytics TO wf_analytics_sync;
        GRANT SELECT, INSERT, UPDATE ON
            analytics.bitrix_categories,
            analytics.bitrix_stages,
            analytics.bitrix_sources,
            analytics.bitrix_users,
            analytics.bitrix_contacts,
            analytics.bitrix_deals,
            analytics.sync_state
        TO wf_analytics_sync;
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS analytics.bitrix_categories (
    member_id text NOT NULL,
    category_id bigint NOT NULL,
    name text NOT NULL,
    is_default boolean NOT NULL DEFAULT false,
    sort integer,
    updated_at timestamptz NOT NULL DEFAULT now(),
    synced_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (member_id, category_id)
);

CREATE TABLE IF NOT EXISTS analytics.bitrix_stages (
    member_id text NOT NULL,
    category_id bigint NOT NULL,
    stage_id text NOT NULL,
    name text NOT NULL,
    sort integer,
    semantic text,
    business_bucket text CHECK (
        business_bucket IS NULL OR business_bucket IN (
            'NEW_LEAD', 'PORTFOLIO', 'PROPOSAL', 'AUTO_UNREGISTERED',
            'DISQUALIFIED', 'WON'
        )
    ),
    updated_at timestamptz NOT NULL DEFAULT now(),
    synced_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (member_id, category_id, stage_id),
    FOREIGN KEY (member_id, category_id)
        REFERENCES analytics.bitrix_categories(member_id, category_id)
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS analytics.bitrix_sources (
    member_id text NOT NULL,
    source_id text NOT NULL,
    name text NOT NULL,
    friendly_name text NOT NULL,
    sort integer,
    active boolean NOT NULL DEFAULT true,
    updated_at timestamptz NOT NULL DEFAULT now(),
    synced_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (member_id, source_id)
);

CREATE TABLE IF NOT EXISTS analytics.bitrix_users (
    member_id text NOT NULL,
    bitrix_user_id bigint NOT NULL,
    name text NOT NULL,
    last_name text NOT NULL DEFAULT '',
    display_name text NOT NULL,
    active boolean NOT NULL DEFAULT true,
    seller_id integer CHECK (seller_id IN (1, 2, 3)),
    role text NOT NULL DEFAULT 'OTHER' CHECK (
        role IN ('SELLER', 'SUPERVISOR', 'ADMIN', 'OTHER')
    ),
    updated_at timestamptz NOT NULL DEFAULT now(),
    synced_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (member_id, bitrix_user_id)
);

CREATE TABLE IF NOT EXISTS analytics.bitrix_contacts (
    member_id text NOT NULL,
    bitrix_contact_id bigint NOT NULL,
    name text NOT NULL,
    phone_e164 text,
    assigned_by_id bigint,
    source_id text,
    bitrix_created_at timestamptz,
    bitrix_updated_at timestamptz,
    synced_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (member_id, bitrix_contact_id)
);

CREATE TABLE IF NOT EXISTS analytics.bitrix_deals (
    member_id text NOT NULL,
    bitrix_deal_id bigint NOT NULL,
    title text NOT NULL,
    bitrix_contact_id bigint,
    assigned_by_id bigint,
    category_id bigint NOT NULL,
    stage_id text NOT NULL,
    source_id text,
    opportunity numeric(18, 2),
    currency text NOT NULL DEFAULT 'BRL',
    bitrix_created_at timestamptz NOT NULL,
    bitrix_updated_at timestamptz NOT NULL,
    closed_at timestamptz,
    is_open boolean NOT NULL,
    raw_updated_timestamp timestamptz NOT NULL,
    synced_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (member_id, bitrix_deal_id)
);

CREATE INDEX IF NOT EXISTS bitrix_deals_period_idx
    ON analytics.bitrix_deals (member_id, bitrix_created_at DESC);
CREATE INDEX IF NOT EXISTS bitrix_deals_closed_idx
    ON analytics.bitrix_deals (member_id, closed_at DESC)
    WHERE closed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS bitrix_deals_filter_idx
    ON analytics.bitrix_deals (member_id, assigned_by_id, source_id, category_id, stage_id);
CREATE INDEX IF NOT EXISTS bitrix_contacts_phone_idx
    ON analytics.bitrix_contacts (member_id, phone_e164)
    WHERE phone_e164 IS NOT NULL;

CREATE TABLE IF NOT EXISTS analytics.sync_state (
    member_id text NOT NULL,
    resource text NOT NULL CHECK (
        resource IN ('DEALS', 'CONTACTS', 'USERS', 'SOURCES', 'CATEGORIES', 'STAGES', 'FULL_RECONCILIATION')
    ),
    status text NOT NULL DEFAULT 'NEVER' CHECK (
        status IN ('NEVER', 'RUNNING', 'SUCCESS', 'FAILED')
    ),
    last_cursor text,
    pending_cursor text,
    last_started_at timestamptz,
    last_successful_sync_at timestamptz,
    last_error_code text,
    records_processed bigint NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (member_id, resource)
);

-- Explicit business semantics. WON and LOSE intentionally follow WF labels, not Bitrix defaults.
INSERT INTO analytics.bitrix_categories (member_id, category_id, name, is_default)
VALUES ('*', 0, 'FUNIL DE VENDAS', true)
ON CONFLICT (member_id, category_id) DO NOTHING;

INSERT INTO analytics.bitrix_stages (
    member_id, category_id, stage_id, name, sort, semantic, business_bucket
)
VALUES
    ('*', 0, 'NEW', 'LEADS', 10, 'PROCESS', 'NEW_LEAD'),
    ('*', 0, 'PREPARATION', 'CLIENTES DA CARTEIRA', 20, 'PROCESS', 'PORTFOLIO'),
    ('*', 0, 'PREPAYMENT_INVOICE', 'PROPOSTA COMERCIAL', 30, 'PROCESS', 'PROPOSAL'),
    ('*', 0, 'UC_OGQ7O3', 'LEAD SEM CADASTRO', 40, 'PROCESS', 'AUTO_UNREGISTERED'),
    ('*', 0, 'WON', 'LEAD DESQUALIFICADO', 90, 'FAILURE', 'DISQUALIFIED'),
    ('*', 0, 'LOSE', 'PROPOSTA GANHA', 100, 'SUCCESS', 'WON')
ON CONFLICT (member_id, category_id, stage_id) DO UPDATE SET
    name = EXCLUDED.name,
    sort = EXCLUDED.sort,
    semantic = EXCLUDED.semantic,
    business_bucket = EXCLUDED.business_bucket,
    updated_at = now();

INSERT INTO analytics.bitrix_sources (
    member_id, source_id, name, friendly_name, sort
)
VALUES
    ('*', 'UC_5JWJUB', 'Instagram', 'Instagram', 10),
    ('*', 'UC_N5ZRK7', 'Google', 'Google', 20),
    ('*', 'UC_504DAI', 'Cliente da carteira', 'Cliente da carteira', 30),
    ('*', 'UC_M1980I', 'Tráfego', 'Tráfego', 40),
    ('*', 'WZa9e16c41-a4cc-4a95-b269-dc0784e92612', 'Whatsapp 5511946276198', 'WhatsApp', 50)
ON CONFLICT (member_id, source_id) DO UPDATE SET
    name = EXCLUDED.name,
    friendly_name = EXCLUDED.friendly_name,
    sort = EXCLUDED.sort,
    updated_at = now();

INSERT INTO analytics.bitrix_users (
    member_id, bitrix_user_id, name, last_name, display_name, seller_id, role
)
VALUES
    ('*', 22, 'Lara', 'Brito', 'Lara Brito', 1, 'SELLER'),
    ('*', 20, 'Mavi', '', 'Mavi', 2, 'SELLER'),
    ('*', 18, 'Julia', '', 'Julia', 3, 'SELLER'),
    ('*', 12, 'Juliane', 'Oliveira', 'Juliane Oliveira', NULL, 'SUPERVISOR'),
    ('*', 1, 'Júlio', 'César', 'Júlio César', NULL, 'SUPERVISOR'),
    ('*', 16, 'Patrick', '', 'Patrick', NULL, 'ADMIN')
ON CONFLICT (member_id, bitrix_user_id) DO UPDATE SET
    name = EXCLUDED.name,
    last_name = EXCLUDED.last_name,
    display_name = EXCLUDED.display_name,
    seller_id = EXCLUDED.seller_id,
    role = EXCLUDED.role,
    updated_at = now();

CREATE OR REPLACE VIEW analytics.deal_facts
WITH (security_barrier = true) AS
SELECT
    deal.member_id,
    deal.bitrix_deal_id,
    deal.title,
    deal.bitrix_contact_id,
    deal.assigned_by_id,
    COALESCE(portal_user.display_name, canonical_user.display_name, 'Não atribuído') AS seller_name,
    COALESCE(portal_user.seller_id, canonical_user.seller_id) AS seller_id,
    deal.category_id,
    deal.stage_id,
    COALESCE(portal_stage.name, canonical_stage.name, deal.stage_id) AS stage_name,
    COALESCE(portal_stage.business_bucket, canonical_stage.business_bucket) AS business_bucket,
    deal.source_id,
    COALESCE(portal_source.friendly_name, canonical_source.friendly_name, 'Sem origem') AS source_name,
    deal.opportunity,
    deal.currency,
    deal.bitrix_created_at,
    deal.bitrix_updated_at,
    deal.closed_at,
    deal.is_open,
    deal.synced_at
FROM analytics.bitrix_deals AS deal
LEFT JOIN analytics.bitrix_users AS portal_user
  ON portal_user.member_id = deal.member_id
 AND portal_user.bitrix_user_id = deal.assigned_by_id
LEFT JOIN analytics.bitrix_users AS canonical_user
  ON canonical_user.member_id = '*'
 AND canonical_user.bitrix_user_id = deal.assigned_by_id
LEFT JOIN analytics.bitrix_stages AS portal_stage
  ON portal_stage.member_id = deal.member_id
 AND portal_stage.category_id = deal.category_id
 AND portal_stage.stage_id = deal.stage_id
LEFT JOIN analytics.bitrix_stages AS canonical_stage
  ON canonical_stage.member_id = '*'
 AND canonical_stage.category_id = deal.category_id
 AND canonical_stage.stage_id = deal.stage_id
LEFT JOIN analytics.bitrix_sources AS portal_source
  ON portal_source.member_id = deal.member_id
 AND portal_source.source_id = deal.source_id
LEFT JOIN analytics.bitrix_sources AS canonical_source
  ON canonical_source.member_id = '*'
 AND canonical_source.source_id = deal.source_id;

CREATE OR REPLACE VIEW analytics.wf_conversation_facts
WITH (security_barrier = true) AS
SELECT
    conversation.id AS conversation_id,
    conversation.member_id,
    conversation.bitrix_deal_id,
    conversation.bitrix_contact_id,
    conversation.assigned_seller_id AS seller_id,
    conversation.assigned_bitrix_user_id,
    conversation.crm_source_id,
    conversation.conversation_origin,
    conversation.ownership_status,
    conversation.ownership_review_reason,
    conversation.unread_count,
    conversation.created_at,
    conversation.last_message_at,
    conversation.last_customer_inbound_at
FROM public.wf_conversations AS conversation;

CREATE OR REPLACE VIEW analytics.wf_assignment_facts
WITH (security_barrier = true) AS
SELECT
    assignment.id,
    assignment.member_id,
    assignment.conversation_id,
    assignment.from_seller_id,
    assignment.to_seller_id,
    assignment.assigned_bitrix_user_id,
    assignment.assignment_reason,
    assignment.conversation_origin,
    assignment.created_at
FROM public.wf_conversation_assignments AS assignment;

CREATE OR REPLACE VIEW analytics.wf_transfer_facts
WITH (security_barrier = true) AS
SELECT
    transfer.id,
    transfer.member_id,
    transfer.conversation_id,
    transfer.previous_seller_id,
    transfer.new_seller_id,
    transfer.status,
    transfer.created_at
FROM public.wf_ownership_transfer_audit AS transfer;

CREATE OR REPLACE VIEW analytics.wf_response_facts
WITH (security_barrier = true) AS
WITH first_inbound AS (
    SELECT
        message.member_id,
        message.conversation_id,
        MIN(COALESCE(message.provider_timestamp, message.created_at)) AS first_inbound_at
    FROM public.wf_messages AS message
    WHERE message.direction = 'IN'
    GROUP BY message.member_id, message.conversation_id
)
SELECT
    inbound.member_id,
    inbound.conversation_id,
    inbound.first_inbound_at,
    MIN(COALESCE(outbound.sent_at, outbound.provider_timestamp, outbound.created_at)) AS first_human_response_at,
    EXTRACT(EPOCH FROM (
        MIN(COALESCE(outbound.sent_at, outbound.provider_timestamp, outbound.created_at))
        - inbound.first_inbound_at
    ))::bigint AS first_response_seconds
FROM first_inbound AS inbound
LEFT JOIN public.wf_messages AS outbound
  ON outbound.member_id = inbound.member_id
 AND outbound.conversation_id = inbound.conversation_id
 AND outbound.direction = 'OUT'
 AND outbound.sender_origin = 'WF_WIDGET'
 AND COALESCE(outbound.sent_at, outbound.provider_timestamp, outbound.created_at)
     >= inbound.first_inbound_at
GROUP BY inbound.member_id, inbound.conversation_id, inbound.first_inbound_at;

CREATE OR REPLACE VIEW analytics.wf_message_facts
WITH (security_barrier = true) AS
SELECT
    message.id AS message_id,
    message.member_id,
    message.conversation_id,
    message.direction,
    message.status,
    message.sender_origin,
    message.message_type,
    COALESCE(message.provider_timestamp, message.created_at) AS occurred_at
FROM public.wf_messages AS message;

REVOKE ALL ON SCHEMA analytics FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA analytics FROM PUBLIC;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wf_dashboard_ro') THEN
        GRANT USAGE ON SCHEMA analytics TO wf_dashboard_ro;
        GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO wf_dashboard_ro;
        ALTER DEFAULT PRIVILEGES IN SCHEMA analytics
            GRANT SELECT ON TABLES TO wf_dashboard_ro;
    END IF;
END
$$;

INSERT INTO analytics.schema_migrations (version, name)
VALUES (1, 'analytics_foundation')
ON CONFLICT (version) DO NOTHING;

COMMIT;
