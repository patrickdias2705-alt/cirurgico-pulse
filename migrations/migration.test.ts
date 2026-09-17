import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "migrations/001_analytics_foundation.sql"),
  "utf8",
);

const operationalSchema007Fixture = `
  CREATE TABLE public.wf_conversations (
    id uuid PRIMARY KEY, member_id text NOT NULL, bitrix_deal_id bigint,
    bitrix_contact_id bigint, assigned_seller_id integer,
    assigned_bitrix_user_id bigint, crm_source_id text, conversation_origin text,
    ownership_status text, ownership_review_reason text, unread_count integer,
    created_at timestamptz, last_message_at timestamptz,
    last_customer_inbound_at timestamptz
  );
  CREATE TABLE public.wf_messages (
    id uuid PRIMARY KEY, member_id text NOT NULL, conversation_id uuid,
    direction text, status text, sender_origin text, message_type text,
    provider_timestamp timestamptz, sent_at timestamptz, created_at timestamptz
  );
  CREATE TABLE public.wf_conversation_assignments (
    id uuid PRIMARY KEY, member_id text NOT NULL, conversation_id uuid,
    from_seller_id integer, to_seller_id integer, assigned_bitrix_user_id bigint,
    assignment_reason text, conversation_origin text, created_at timestamptz
  );
  CREATE TABLE public.wf_ownership_transfer_audit (
    id uuid PRIMARY KEY, member_id text NOT NULL, conversation_id uuid,
    previous_seller_id integer, new_seller_id integer, status text,
    created_at timestamptz
  );
`;

describe("analytics migration", () => {
  it("fails safely when the operational schema 007 contract is absent", async () => {
    const database = new PGlite();
    await expect(database.exec(migration)).rejects.toThrow(
      "PULSE_ANALYTICS_REQUIRES_WF_SCHEMA_007",
    );
    await database.close();
  });

  it("applies on an isolated schema-007 fixture and preserves inverted stage semantics", async () => {
    const database = new PGlite();
    await database.exec(operationalSchema007Fixture);
    await database.exec(migration);
    const versions = await database.query<{ version: number }>(
      "SELECT version FROM analytics.schema_migrations",
    );
    const stages = await database.query<{ stage_id: string; business_bucket: string }>(
      "SELECT stage_id, business_bucket FROM analytics.bitrix_stages WHERE member_id = '*' AND stage_id IN ('WON', 'LOSE') ORDER BY stage_id",
    );
    expect(versions.rows).toEqual([{ version: 1 }]);
    expect(stages.rows).toEqual([
      { stage_id: "LOSE", business_bucket: "WON" },
      { stage_id: "WON", business_bucket: "DISQUALIFIED" },
    ]);
    await database.close();
  });
});
