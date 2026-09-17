import { z } from "zod";
import type { TransactionSql } from "postgres";

import { BITRIX_SOURCE_LABELS, businessBucket } from "@/lib/analytics/mappings";

import { analyticsSyncDb } from "./db";
import { serverEnv } from "./env";

const resourceSchema = z.enum(["DEALS", "CONTACTS", "USERS", "SOURCES", "CATEGORIES", "STAGES"]);
const recordSchema = z.record(z.unknown());
export const syncBatchSchema = z.object({
  member_id: z.string().min(1).max(255),
  resource: resourceSchema,
  records: z.array(recordSchema).max(1000),
  cursor: z.string().max(2000).nullable().optional(),
  final_batch: z.boolean().default(true),
});
export type SyncBatch = z.infer<typeof syncBatchSchema>;

const text = (record: Record<string, unknown>, key: string, fallback = ""): string =>
  record[key] === null || record[key] === undefined ? fallback : String(record[key]);
const nullableText = (record: Record<string, unknown>, key: string): string | null => {
  const value = text(record, key).trim();
  return value || null;
};
const integer = (record: Record<string, unknown>, key: string): number => {
  const value = Number(record[key]);
  if (!Number.isInteger(value)) throw new Error(`INVALID_${key.toUpperCase()}`);
  return value;
};
const nullableInteger = (record: Record<string, unknown>, key: string): number | null =>
  record[key] === null || record[key] === undefined || record[key] === ""
    ? null
    : integer(record, key);
const bool = (record: Record<string, unknown>, key: string, fallback = false): boolean => {
  const value = record[key];
  if (value === undefined || value === null) return fallback;
  return value === true || value === "Y" || value === "true" || value === 1;
};
const timestamp = (record: Record<string, unknown>, key: string, required = false): Date | null => {
  const value = nullableText(record, key);
  if (!value) {
    if (required) throw new Error(`MISSING_${key.toUpperCase()}`);
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`INVALID_${key.toUpperCase()}`);
  return parsed;
};

export function verifySyncSecret(value: string | null): boolean {
  const expected = serverEnv().analyticsSyncSecret;
  if (!value || value.length !== expected.length) return false;
  let result = 0;
  for (let index = 0; index < expected.length; index += 1) {
    result |= expected.charCodeAt(index) ^ value.charCodeAt(index);
  }
  return result === 0;
}

async function ingestRecord(
  sql: TransactionSql,
  batch: SyncBatch,
  record: Record<string, unknown>,
) {
  const memberId = batch.member_id;
  switch (batch.resource) {
    case "DEALS": {
      const id = integer(record, "id");
      const updatedAt = timestamp(record, "updated_at", true)!;
      await sql`
        INSERT INTO analytics.bitrix_deals (
          member_id, bitrix_deal_id, title, bitrix_contact_id, assigned_by_id,
          category_id, stage_id, source_id, opportunity, currency,
          bitrix_created_at, bitrix_updated_at, closed_at, is_open,
          raw_updated_timestamp, synced_at
        ) VALUES (
          ${memberId}, ${id}, ${text(record, "title", `Deal ${id}`)},
          ${nullableInteger(record, "contact_id")}, ${nullableInteger(record, "assigned_by_id")},
          ${integer(record, "category_id")}, ${text(record, "stage_id")},
          ${nullableText(record, "source_id")}, ${record.opportunity === null || record.opportunity === undefined || record.opportunity === "" ? null : Number(record.opportunity)},
          ${text(record, "currency", "BRL")}, ${timestamp(record, "created_at", true)},
          ${updatedAt}, ${timestamp(record, "closed_at")}, ${bool(record, "is_open", true)},
          ${updatedAt}, now()
        )
        ON CONFLICT (member_id, bitrix_deal_id) DO UPDATE SET
          title = EXCLUDED.title, bitrix_contact_id = EXCLUDED.bitrix_contact_id,
          assigned_by_id = EXCLUDED.assigned_by_id, category_id = EXCLUDED.category_id,
          stage_id = EXCLUDED.stage_id, source_id = EXCLUDED.source_id,
          opportunity = EXCLUDED.opportunity, currency = EXCLUDED.currency,
          bitrix_created_at = EXCLUDED.bitrix_created_at,
          bitrix_updated_at = EXCLUDED.bitrix_updated_at, closed_at = EXCLUDED.closed_at,
          is_open = EXCLUDED.is_open, raw_updated_timestamp = EXCLUDED.raw_updated_timestamp,
          synced_at = now()
        WHERE analytics.bitrix_deals.raw_updated_timestamp <= EXCLUDED.raw_updated_timestamp
      `;
      break;
    }
    case "CONTACTS": {
      await sql`
        INSERT INTO analytics.bitrix_contacts (
          member_id, bitrix_contact_id, name, phone_e164, assigned_by_id,
          source_id, bitrix_created_at, bitrix_updated_at, synced_at
        ) VALUES (
          ${memberId}, ${integer(record, "id")}, ${text(record, "name", "Contato")},
          ${nullableText(record, "phone_e164")}, ${nullableInteger(record, "assigned_by_id")},
          ${nullableText(record, "source_id")}, ${timestamp(record, "created_at")},
          ${timestamp(record, "updated_at")}, now()
        ) ON CONFLICT (member_id, bitrix_contact_id) DO UPDATE SET
          name = EXCLUDED.name, phone_e164 = EXCLUDED.phone_e164,
          assigned_by_id = EXCLUDED.assigned_by_id, source_id = EXCLUDED.source_id,
          bitrix_created_at = EXCLUDED.bitrix_created_at,
          bitrix_updated_at = EXCLUDED.bitrix_updated_at, synced_at = now()
        WHERE analytics.bitrix_contacts.bitrix_updated_at IS NULL
           OR analytics.bitrix_contacts.bitrix_updated_at <= EXCLUDED.bitrix_updated_at
      `;
      break;
    }
    case "USERS": {
      const bitrixId = integer(record, "id");
      const known: Record<number, { seller: number | null; role: string }> = {
        22: { seller: 1, role: "SELLER" },
        20: { seller: 2, role: "SELLER" },
        18: { seller: 3, role: "SELLER" },
        12: { seller: null, role: "SUPERVISOR" },
        1: { seller: null, role: "SUPERVISOR" },
        16: { seller: null, role: "ADMIN" },
      };
      const mapping = known[bitrixId] ?? { seller: null, role: "OTHER" };
      const name = text(record, "name");
      const lastName = text(record, "last_name");
      await sql`
        INSERT INTO analytics.bitrix_users (
          member_id, bitrix_user_id, name, last_name, display_name,
          active, seller_id, role, synced_at
        ) VALUES (
          ${memberId}, ${bitrixId}, ${name}, ${lastName},
          ${text(record, "display_name", `${name} ${lastName}`.trim())},
          ${bool(record, "active", true)}, ${mapping.seller}, ${mapping.role}, now()
        ) ON CONFLICT (member_id, bitrix_user_id) DO UPDATE SET
          name = EXCLUDED.name, last_name = EXCLUDED.last_name,
          display_name = EXCLUDED.display_name, active = EXCLUDED.active,
          seller_id = EXCLUDED.seller_id, role = EXCLUDED.role, synced_at = now()
      `;
      break;
    }
    case "SOURCES": {
      const id = text(record, "id");
      await sql`
        INSERT INTO analytics.bitrix_sources (
          member_id, source_id, name, friendly_name, sort, active, synced_at
        ) VALUES (
          ${memberId}, ${id}, ${text(record, "name", id)},
          ${BITRIX_SOURCE_LABELS[id] ?? text(record, "name", id)},
          ${nullableInteger(record, "sort")}, ${bool(record, "active", true)}, now()
        ) ON CONFLICT (member_id, source_id) DO UPDATE SET
          name = EXCLUDED.name, friendly_name = EXCLUDED.friendly_name,
          sort = EXCLUDED.sort, active = EXCLUDED.active, synced_at = now()
      `;
      break;
    }
    case "CATEGORIES": {
      await sql`
        INSERT INTO analytics.bitrix_categories (
          member_id, category_id, name, is_default, sort, synced_at
        ) VALUES (
          ${memberId}, ${integer(record, "id")}, ${text(record, "name", "Categoria")},
          ${bool(record, "is_default")}, ${nullableInteger(record, "sort")}, now()
        ) ON CONFLICT (member_id, category_id) DO UPDATE SET
          name = EXCLUDED.name, is_default = EXCLUDED.is_default,
          sort = EXCLUDED.sort, synced_at = now()
      `;
      break;
    }
    case "STAGES": {
      const stageId = text(record, "id");
      const categoryId = integer(record, "category_id");
      await sql`
        INSERT INTO analytics.bitrix_categories (member_id, category_id, name, is_default, synced_at)
        VALUES (${memberId}, ${categoryId}, ${text(record, "category_name", `Categoria ${categoryId}`)}, ${categoryId === 0}, now())
        ON CONFLICT (member_id, category_id) DO NOTHING
      `;
      await sql`
        INSERT INTO analytics.bitrix_stages (
          member_id, category_id, stage_id, name, sort, semantic, business_bucket, synced_at
        ) VALUES (
          ${memberId}, ${categoryId}, ${stageId}, ${text(record, "name", stageId)},
          ${nullableInteger(record, "sort")}, ${nullableText(record, "semantic")},
          ${categoryId === 0 ? businessBucket(stageId) : null}, now()
        ) ON CONFLICT (member_id, category_id, stage_id) DO UPDATE SET
          name = EXCLUDED.name, sort = EXCLUDED.sort, semantic = EXCLUDED.semantic,
          business_bucket = EXCLUDED.business_bucket, synced_at = now()
      `;
      break;
    }
  }
}

export async function ingestSyncBatch(
  batch: SyncBatch,
): Promise<{ processed: number; committedCursor: boolean }> {
  const sql = analyticsSyncDb();
  await sql`
    INSERT INTO analytics.sync_state (member_id, resource, status, pending_cursor, last_started_at, updated_at)
    VALUES (${batch.member_id}, ${batch.resource}, 'RUNNING', ${batch.cursor ?? null}, now(), now())
    ON CONFLICT (member_id, resource) DO UPDATE SET
      status = 'RUNNING', pending_cursor = EXCLUDED.pending_cursor,
      last_started_at = now(), last_error_code = NULL, updated_at = now()
  `;
  try {
    await sql.begin(async (transaction) => {
      for (const record of batch.records) await ingestRecord(transaction, batch, record);
      await transaction`
        UPDATE analytics.sync_state SET
          status = ${batch.final_batch ? "SUCCESS" : "RUNNING"},
          last_cursor = CASE WHEN ${batch.final_batch} THEN ${batch.cursor ?? null} ELSE last_cursor END,
          pending_cursor = CASE WHEN ${batch.final_batch} THEN NULL ELSE ${batch.cursor ?? null} END,
          last_successful_sync_at = CASE WHEN ${batch.final_batch} THEN now() ELSE last_successful_sync_at END,
          records_processed = records_processed + ${batch.records.length}, updated_at = now()
        WHERE member_id = ${batch.member_id} AND resource = ${batch.resource}
      `;
    });
    return { processed: batch.records.length, committedCursor: batch.final_batch };
  } catch (error) {
    await sql`
      UPDATE analytics.sync_state SET status = 'FAILED', last_error_code = 'SYNC_BATCH_REJECTED', updated_at = now()
      WHERE member_id = ${batch.member_id} AND resource = ${batch.resource}
    `;
    throw error;
  }
}
