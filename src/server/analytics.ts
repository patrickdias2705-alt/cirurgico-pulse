import { formatInTimeZone } from "date-fns-tz";

import { OPERATION_TIMEZONE, resolveDateRange } from "@/lib/analytics/filters";
import { conversionRate } from "@/lib/analytics/mappings";
import type {
  AnalyticsActor,
  AnalyticsFilters,
  DashboardPayload,
  DealRow,
  FilterOptions,
  FunnelPoint,
  OperationsMetrics,
  OverviewMetrics,
  SellerMetric,
  SourceMetric,
  SyncQuality,
  TimeseriesPoint,
} from "@/lib/analytics/types";

import { analyticsDb } from "./db";
import { serverEnv } from "./env";

const BUSINESS_BUCKETS = ["NEW_LEAD", "PORTFOLIO", "PROPOSAL", "WON", "DISQUALIFIED"] as const;
const BUCKET_LABELS: Record<(typeof BUSINESS_BUCKETS)[number], string> = {
  NEW_LEAD: "Novos leads",
  PORTFOLIO: "Carteira",
  PROPOSAL: "Propostas",
  WON: "Ganhos",
  DISQUALIFIED: "Desqualificados",
};

const number = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};
const nullableNumber = (value: unknown): number | null =>
  value === null || value === undefined ? null : number(value);
const iso = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : String(value ?? "");

interface CacheEntry {
  expiresAt: number;
  payload: DashboardPayload;
}
const dashboardCache = new Map<string, CacheEntry>();

function cacheKey(actor: AnalyticsActor, filters: AnalyticsFilters): string {
  return JSON.stringify([actor.memberId, actor.role, actor.sellerId, filters]);
}

export async function loadDashboard(
  actor: AnalyticsActor,
  filters: AnalyticsFilters,
): Promise<DashboardPayload> {
  const key = cacheKey(actor, filters);
  const cached = dashboardCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.payload;

  const [overview, funnel, sources, sellers, timeseries, operations, quality, filterOptions] =
    await Promise.all([
      loadOverview(actor, filters),
      loadFunnel(actor, filters),
      loadSources(actor, filters),
      loadSellers(actor, filters),
      loadTimeseries(actor, filters),
      loadOperations(actor, filters),
      loadQuality(actor, filters),
      loadFilterOptions(actor),
    ]);
  const payload = {
    actor,
    filters,
    overview,
    funnel,
    sources,
    sellers,
    timeseries,
    operations,
    quality,
    filterOptions,
  } satisfies DashboardPayload;
  dashboardCache.set(key, { expiresAt: Date.now() + 60_000, payload });
  if (dashboardCache.size > 250) dashboardCache.clear();
  return payload;
}

function range(filters: AnalyticsFilters): { from: Date; to: Date } {
  const resolved = resolveDateRange(filters.dateFrom, filters.dateTo);
  return { from: resolved.from, to: resolved.toExclusive };
}

async function loadOverview(
  actor: AnalyticsActor,
  filters: AnalyticsFilters,
): Promise<OverviewMetrics> {
  const sql = analyticsDb();
  const { from, to } = range(filters);
  const rows = await sql`
    WITH scoped AS (
      SELECT * FROM analytics.deal_facts
      WHERE member_id = ${actor.memberId}
        AND category_id = 0
        AND (${filters.sellerId}::integer IS NULL OR seller_id = ${filters.sellerId})
        AND (${filters.sourceId}::text IS NULL OR (${filters.sourceId} = '__NONE__' AND source_id IS NULL) OR source_id = ${filters.sourceId})
        AND (${filters.stageId}::text IS NULL OR stage_id = ${filters.stageId})
    ), period AS (
      SELECT * FROM scoped WHERE bitrix_created_at >= ${from} AND bitrix_created_at < ${to}
    ), operational AS (
      SELECT
        COUNT(*) FILTER (WHERE ownership_status = 'NEEDS_REVIEW') AS needs_review,
        COUNT(*) FILTER (WHERE ownership_status = 'UNASSIGNED') AS unassigned
      FROM analytics.wf_conversation_facts conversation
      LEFT JOIN analytics.deal_facts deal
        ON deal.member_id = conversation.member_id AND deal.bitrix_deal_id = conversation.bitrix_deal_id
      WHERE conversation.member_id = ${actor.memberId}
        AND (${filters.sellerId}::integer IS NULL OR conversation.seller_id = ${filters.sellerId})
        AND (${filters.sourceId}::text IS NULL
          OR (${filters.sourceId} = '__NONE__' AND COALESCE(deal.source_id, conversation.crm_source_id) IS NULL)
          OR COALESCE(deal.source_id, conversation.crm_source_id) = ${filters.sourceId})
        AND (${filters.stageId}::text IS NULL OR deal.stage_id = ${filters.stageId})
    )
    SELECT
      COUNT(*) FILTER (WHERE business_bucket = 'NEW_LEAD') AS new_leads,
      COUNT(*) FILTER (WHERE business_bucket = 'PORTFOLIO') AS portfolio,
      COUNT(*) FILTER (WHERE business_bucket = 'PROPOSAL') AS proposals,
      (SELECT COUNT(*) FROM scoped WHERE business_bucket = 'WON' AND closed_at >= ${from} AND closed_at < ${to}) AS won,
      COUNT(*) FILTER (WHERE business_bucket = 'DISQUALIFIED') AS disqualified,
      COUNT(*) FILTER (WHERE business_bucket <> 'AUTO_UNREGISTERED' OR business_bucket IS NULL) AS eligible_leads,
      (SELECT COUNT(*) FROM scoped WHERE is_open) AS open_deals,
      (SELECT COALESCE(SUM(opportunity), 0) FROM scoped WHERE is_open) AS pipeline_value,
      (SELECT COALESCE(SUM(opportunity), 0) FROM scoped WHERE business_bucket = 'WON' AND closed_at >= ${from} AND closed_at < ${to}) AS won_value,
      (SELECT needs_review FROM operational) AS needs_review,
      (SELECT unassigned FROM operational) AS unassigned
    FROM period
  `;
  const row = rows[0] ?? {};
  const newLeads = number(row.new_leads);
  const won = number(row.won);
  return {
    newLeads,
    portfolio: number(row.portfolio),
    proposals: number(row.proposals),
    won,
    disqualified: number(row.disqualified),
    openDeals: number(row.open_deals),
    pipelineValue: number(row.pipeline_value),
    wonValue: number(row.won_value),
    conversionRate: conversionRate(won, number(row.eligible_leads)),
    needsReview: number(row.needs_review),
    unassigned: number(row.unassigned),
  };
}

async function loadFunnel(
  actor: AnalyticsActor,
  filters: AnalyticsFilters,
): Promise<FunnelPoint[]> {
  const sql = analyticsDb();
  const { from, to } = range(filters);
  const rows = await sql`
    SELECT business_bucket, COUNT(*) AS count
    FROM analytics.deal_facts
    WHERE member_id = ${actor.memberId} AND category_id = 0
      AND bitrix_created_at >= ${from} AND bitrix_created_at < ${to}
      AND (${filters.sellerId}::integer IS NULL OR seller_id = ${filters.sellerId})
      AND (${filters.sourceId}::text IS NULL OR (${filters.sourceId} = '__NONE__' AND source_id IS NULL) OR source_id = ${filters.sourceId})
      AND (${filters.stageId}::text IS NULL OR stage_id = ${filters.stageId})
    GROUP BY business_bucket
  `;
  const counts = new Map(rows.map((row) => [String(row.business_bucket), number(row.count)]));
  const total = BUSINESS_BUCKETS.reduce((sum, bucket) => sum + (counts.get(bucket) ?? 0), 0);
  return BUSINESS_BUCKETS.map((bucket, index) => {
    const count = counts.get(bucket) ?? 0;
    const previous = index === 0 ? null : (counts.get(BUSINESS_BUCKETS[index - 1]) ?? 0);
    return {
      bucket,
      label: BUCKET_LABELS[bucket],
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      dropOff: previous && previous > 0 ? ((previous - count) / previous) * 100 : null,
    };
  });
}

async function loadSources(
  actor: AnalyticsActor,
  filters: AnalyticsFilters,
): Promise<SourceMetric[]> {
  const sql = analyticsDb();
  const { from, to } = range(filters);
  const rows = await sql`
    SELECT source_id, source_name,
      COUNT(*) AS leads,
      COUNT(*) FILTER (WHERE business_bucket = 'PROPOSAL') AS proposals,
      COUNT(*) FILTER (WHERE business_bucket = 'WON') AS won,
      COALESCE(SUM(opportunity) FILTER (WHERE is_open), 0) AS pipeline_value
    FROM analytics.deal_facts
    WHERE member_id = ${actor.memberId} AND category_id = 0
      AND bitrix_created_at >= ${from} AND bitrix_created_at < ${to}
      AND (${filters.sellerId}::integer IS NULL OR seller_id = ${filters.sellerId})
      AND (${filters.sourceId}::text IS NULL OR (${filters.sourceId} = '__NONE__' AND source_id IS NULL) OR source_id = ${filters.sourceId})
      AND (${filters.stageId}::text IS NULL OR stage_id = ${filters.stageId})
    GROUP BY source_id, source_name ORDER BY leads DESC, source_name
  `;
  return rows.map((row) => {
    const leads = number(row.leads);
    const won = number(row.won);
    return {
      sourceId: row.source_id === null ? null : String(row.source_id),
      sourceName: String(row.source_name),
      leads,
      proposals: number(row.proposals),
      won,
      pipelineValue: number(row.pipeline_value),
      conversionRate: conversionRate(won, leads),
    };
  });
}

async function loadSellers(
  actor: AnalyticsActor,
  filters: AnalyticsFilters,
): Promise<SellerMetric[]> {
  const sql = analyticsDb();
  const { from, to } = range(filters);
  const rows = await sql`
    WITH deals AS (
      SELECT seller_id, assigned_by_id, seller_name,
        COUNT(*) AS leads,
        COUNT(*) FILTER (WHERE business_bucket = 'PORTFOLIO') AS portfolio,
        COUNT(*) FILTER (WHERE business_bucket = 'PROPOSAL') AS proposals,
        COUNT(*) FILTER (WHERE business_bucket = 'WON') AS won,
        COUNT(*) FILTER (WHERE business_bucket = 'DISQUALIFIED') AS disqualified,
        COUNT(*) FILTER (WHERE is_open) AS open_deals,
        COALESCE(SUM(opportunity) FILTER (WHERE is_open), 0) AS pipeline_value,
        COALESCE(SUM(opportunity) FILTER (WHERE business_bucket = 'WON'), 0) AS won_value
      FROM analytics.deal_facts
      WHERE member_id = ${actor.memberId} AND category_id = 0
        AND bitrix_created_at >= ${from} AND bitrix_created_at < ${to}
        AND seller_id IS NOT NULL
        AND (${filters.sellerId}::integer IS NULL OR seller_id = ${filters.sellerId})
        AND (${filters.sourceId}::text IS NULL OR (${filters.sourceId} = '__NONE__' AND source_id IS NULL) OR source_id = ${filters.sourceId})
        AND (${filters.stageId}::text IS NULL OR stage_id = ${filters.stageId})
      GROUP BY seller_id, assigned_by_id, seller_name
    ), conversations AS (
      SELECT seller_id, COUNT(*) AS active_conversations
      FROM analytics.wf_conversation_facts
      WHERE member_id = ${actor.memberId} AND seller_id IS NOT NULL
        AND (${filters.sellerId}::integer IS NULL OR seller_id = ${filters.sellerId})
      GROUP BY seller_id
    ), responses AS (
      SELECT conversation.seller_id, AVG(response.first_response_seconds) AS average_response
      FROM analytics.wf_response_facts response
      JOIN analytics.wf_conversation_facts conversation
        ON conversation.member_id = response.member_id
       AND conversation.conversation_id = response.conversation_id
      WHERE response.member_id = ${actor.memberId}
        AND response.first_inbound_at >= ${from} AND response.first_inbound_at < ${to}
        AND (${filters.sellerId}::integer IS NULL OR conversation.seller_id = ${filters.sellerId})
      GROUP BY conversation.seller_id
    ), transfers AS (
      SELECT seller_id,
        SUM(transfers_in) AS transfers_in, SUM(transfers_out) AS transfers_out
      FROM (
        SELECT new_seller_id AS seller_id, COUNT(*) AS transfers_in, 0 AS transfers_out
        FROM analytics.wf_transfer_facts
        WHERE member_id = ${actor.memberId} AND status = 'SUCCESS'
          AND created_at >= ${from} AND created_at < ${to}
        GROUP BY new_seller_id
        UNION ALL
        SELECT previous_seller_id AS seller_id, 0, COUNT(*)
        FROM analytics.wf_transfer_facts
        WHERE member_id = ${actor.memberId} AND status = 'SUCCESS'
          AND created_at >= ${from} AND created_at < ${to}
        GROUP BY previous_seller_id
      ) transfer_union GROUP BY seller_id
    )
    SELECT deals.*, COALESCE(conversations.active_conversations, 0) AS active_conversations,
      responses.average_response, COALESCE(transfers.transfers_in, 0) AS transfers_in,
      COALESCE(transfers.transfers_out, 0) AS transfers_out
    FROM deals
    LEFT JOIN conversations USING (seller_id)
    LEFT JOIN responses USING (seller_id)
    LEFT JOIN transfers USING (seller_id)
    ORDER BY won_value DESC, won DESC, leads DESC
  `;
  return rows.map((row) => {
    const leads = number(row.leads);
    const won = number(row.won);
    return {
      sellerId: number(row.seller_id),
      bitrixUserId: number(row.assigned_by_id),
      sellerName: String(row.seller_name),
      leads,
      portfolio: number(row.portfolio),
      proposals: number(row.proposals),
      won,
      disqualified: number(row.disqualified),
      openDeals: number(row.open_deals),
      pipelineValue: number(row.pipeline_value),
      wonValue: number(row.won_value),
      conversionRate: conversionRate(won, leads),
      activeConversations: number(row.active_conversations),
      averageFirstResponseSeconds: nullableNumber(row.average_response),
      transfersIn: number(row.transfers_in),
      transfersOut: number(row.transfers_out),
    };
  });
}

async function loadTimeseries(
  actor: AnalyticsActor,
  filters: AnalyticsFilters,
): Promise<TimeseriesPoint[]> {
  const sql = analyticsDb();
  const { from, to } = range(filters);
  const rows = await sql`
    WITH days AS (
      SELECT generate_series(${from}::timestamptz, ${to}::timestamptz - interval '1 day', interval '1 day') AS day
    ), created_deals AS (
      SELECT date_trunc('day', bitrix_created_at AT TIME ZONE 'America/Sao_Paulo') AS day,
        COUNT(*) AS new_leads,
        COUNT(*) FILTER (WHERE business_bucket = 'PROPOSAL') AS proposals
      FROM analytics.deal_facts
      WHERE member_id = ${actor.memberId} AND category_id = 0
        AND bitrix_created_at >= ${from} AND bitrix_created_at < ${to}
        AND (${filters.sellerId}::integer IS NULL OR seller_id = ${filters.sellerId})
        AND (${filters.sourceId}::text IS NULL OR (${filters.sourceId} = '__NONE__' AND source_id IS NULL) OR source_id = ${filters.sourceId})
        AND (${filters.stageId}::text IS NULL OR stage_id = ${filters.stageId})
      GROUP BY 1
    ), closed_deals AS (
      SELECT date_trunc('day', closed_at AT TIME ZONE 'America/Sao_Paulo') AS day,
        COUNT(*) AS won, COALESCE(SUM(opportunity), 0) AS won_value
      FROM analytics.deal_facts
      WHERE member_id = ${actor.memberId} AND category_id = 0 AND business_bucket = 'WON'
        AND closed_at >= ${from} AND closed_at < ${to}
        AND (${filters.sellerId}::integer IS NULL OR seller_id = ${filters.sellerId})
        AND (${filters.sourceId}::text IS NULL OR (${filters.sourceId} = '__NONE__' AND source_id IS NULL) OR source_id = ${filters.sourceId})
        AND (${filters.stageId}::text IS NULL OR stage_id = ${filters.stageId})
      GROUP BY 1
    ), conversations AS (
      SELECT date_trunc('day', created_at AT TIME ZONE 'America/Sao_Paulo') AS day,
        COUNT(*) AS new_conversations
      FROM analytics.wf_conversation_facts conversation
      LEFT JOIN analytics.deal_facts deal
        ON deal.member_id = conversation.member_id AND deal.bitrix_deal_id = conversation.bitrix_deal_id
      WHERE conversation.member_id = ${actor.memberId}
        AND conversation.created_at >= ${from} AND conversation.created_at < ${to}
        AND (${filters.sellerId}::integer IS NULL OR conversation.seller_id = ${filters.sellerId})
        AND (${filters.sourceId}::text IS NULL
          OR (${filters.sourceId} = '__NONE__' AND COALESCE(deal.source_id, conversation.crm_source_id) IS NULL)
          OR COALESCE(deal.source_id, conversation.crm_source_id) = ${filters.sourceId})
        AND (${filters.stageId}::text IS NULL OR deal.stage_id = ${filters.stageId})
      GROUP BY 1
    )
    SELECT days.day, COALESCE(created_deals.new_leads, 0) AS new_leads,
      COALESCE(created_deals.proposals, 0) AS proposals, COALESCE(closed_deals.won, 0) AS won,
      COALESCE(closed_deals.won_value, 0) AS won_value,
      COALESCE(conversations.new_conversations, 0) AS new_conversations
    FROM days
    LEFT JOIN created_deals ON created_deals.day = date_trunc('day', days.day AT TIME ZONE 'America/Sao_Paulo')
    LEFT JOIN closed_deals ON closed_deals.day = date_trunc('day', days.day AT TIME ZONE 'America/Sao_Paulo')
    LEFT JOIN conversations ON conversations.day = date_trunc('day', days.day AT TIME ZONE 'America/Sao_Paulo')
    ORDER BY days.day
  `;
  return rows.map((row) => ({
    date: formatInTimeZone(row.day as Date, OPERATION_TIMEZONE, "yyyy-MM-dd"),
    newLeads: number(row.new_leads),
    proposals: number(row.proposals),
    won: number(row.won),
    wonValue: number(row.won_value),
    newConversations: number(row.new_conversations),
  }));
}

async function loadOperations(
  actor: AnalyticsActor,
  filters: AnalyticsFilters,
): Promise<OperationsMetrics> {
  const sql = analyticsDb();
  const { from, to } = range(filters);
  const today = formatInTimeZone(new Date(), OPERATION_TIMEZONE, "yyyy-MM-dd");
  const todayRange = resolveDateRange(today, today);
  const rows = await sql`
    WITH eligible_conversations AS (
      SELECT conversation.*
      FROM analytics.wf_conversation_facts conversation
      LEFT JOIN analytics.deal_facts deal
        ON deal.member_id = conversation.member_id
       AND deal.bitrix_deal_id = conversation.bitrix_deal_id
      WHERE conversation.member_id = ${actor.memberId}
        AND (${filters.sellerId}::integer IS NULL OR conversation.seller_id = ${filters.sellerId})
        AND (${filters.sourceId}::text IS NULL
          OR (${filters.sourceId} = '__NONE__' AND COALESCE(deal.source_id, conversation.crm_source_id) IS NULL)
          OR COALESCE(deal.source_id, conversation.crm_source_id) = ${filters.sourceId})
        AND (${filters.stageId}::text IS NULL OR deal.stage_id = ${filters.stageId})
    ), conversations AS (
      SELECT
        COUNT(*) AS open_conversations,
        COUNT(*) FILTER (WHERE created_at >= ${from} AND created_at < ${to}) AS new_contacts,
        COALESCE(SUM(unread_count), 0) AS unread,
        COUNT(*) FILTER (WHERE ownership_status = 'NEEDS_REVIEW') AS needs_review,
        COUNT(*) FILTER (WHERE ownership_status = 'UNASSIGNED') AS unassigned
      FROM eligible_conversations
    ), messages AS (
      SELECT COUNT(*) FILTER (WHERE direction = 'IN') AS inbound_today,
        COUNT(*) FILTER (WHERE direction = 'OUT') AS outbound_today
      FROM analytics.wf_message_facts message
      JOIN eligible_conversations conversation
        ON conversation.member_id = message.member_id
       AND conversation.conversation_id = message.conversation_id
      WHERE message.member_id = ${actor.memberId}
        AND message.occurred_at >= ${todayRange.from}
        AND message.occurred_at < ${todayRange.toExclusive}
    ), assignment AS (
      SELECT COUNT(*) FILTER (WHERE assignment_reason = 'AUTO_TRAFFIC_ROUND_ROBIN') AS rr,
        COUNT(*) FILTER (WHERE assignment_reason <> 'AUTO_TRAFFIC_ROUND_ROBIN') AS preserved
      FROM analytics.wf_assignment_facts assignment_row
      JOIN eligible_conversations conversation ON conversation.conversation_id = assignment_row.conversation_id
      WHERE assignment_row.member_id = ${actor.memberId} AND assignment_row.created_at >= ${from} AND assignment_row.created_at < ${to}
    ), transfer AS (
      SELECT COUNT(*) AS transfers FROM analytics.wf_transfer_facts transfer_row
      JOIN eligible_conversations conversation ON conversation.conversation_id = transfer_row.conversation_id
      WHERE transfer_row.member_id = ${actor.memberId} AND transfer_row.status = 'SUCCESS'
        AND transfer_row.created_at >= ${from} AND transfer_row.created_at < ${to}
    ), response AS (
      SELECT AVG(response.first_response_seconds) AS avg_response
      FROM analytics.wf_response_facts response
      JOIN eligible_conversations conversation
        ON conversation.member_id = response.member_id
       AND conversation.conversation_id = response.conversation_id
      WHERE response.member_id = ${actor.memberId}
        AND response.first_inbound_at >= ${from} AND response.first_inbound_at < ${to}
    )
    SELECT * FROM conversations, messages, assignment, transfer, response
  `;
  const row = rows[0] ?? {};
  const rrRows = await sql`
    SELECT assignment.to_seller_id AS seller_id,
      COALESCE(user_row.display_name, canonical.display_name, 'Seller ' || assignment.to_seller_id) AS seller_name,
      COUNT(*) AS leads
    FROM analytics.wf_assignment_facts assignment
    LEFT JOIN analytics.bitrix_users user_row
      ON user_row.member_id = assignment.member_id AND user_row.seller_id = assignment.to_seller_id
    LEFT JOIN analytics.bitrix_users canonical
      ON canonical.member_id = '*' AND canonical.seller_id = assignment.to_seller_id
    JOIN analytics.wf_conversation_facts conversation
      ON conversation.member_id = assignment.member_id AND conversation.conversation_id = assignment.conversation_id
    LEFT JOIN analytics.deal_facts deal
      ON deal.member_id = conversation.member_id AND deal.bitrix_deal_id = conversation.bitrix_deal_id
    WHERE assignment.member_id = ${actor.memberId}
      AND assignment.assignment_reason = 'AUTO_TRAFFIC_ROUND_ROBIN'
      AND assignment.created_at >= ${from} AND assignment.created_at < ${to}
      AND (${filters.sellerId}::integer IS NULL OR assignment.to_seller_id = ${filters.sellerId})
      AND (${filters.sourceId}::text IS NULL
        OR (${filters.sourceId} = '__NONE__' AND COALESCE(deal.source_id, conversation.crm_source_id) IS NULL)
        OR COALESCE(deal.source_id, conversation.crm_source_id) = ${filters.sourceId})
      AND (${filters.stageId}::text IS NULL OR deal.stage_id = ${filters.stageId})
    GROUP BY assignment.to_seller_id, user_row.display_name, canonical.display_name
    ORDER BY assignment.to_seller_id
  `;
  const rrTotal = rrRows.reduce((sum, item) => sum + number(item.leads), 0);
  const transferRows = await sql`
    SELECT previous_seller_id, new_seller_id, COUNT(*) AS count
    FROM analytics.wf_transfer_facts transfer_row
    JOIN analytics.wf_conversation_facts conversation
      ON conversation.member_id = transfer_row.member_id AND conversation.conversation_id = transfer_row.conversation_id
    LEFT JOIN analytics.deal_facts deal
      ON deal.member_id = conversation.member_id AND deal.bitrix_deal_id = conversation.bitrix_deal_id
    WHERE transfer_row.member_id = ${actor.memberId} AND transfer_row.status = 'SUCCESS'
      AND transfer_row.created_at >= ${from} AND transfer_row.created_at < ${to}
      AND (${filters.sellerId}::integer IS NULL OR transfer_row.previous_seller_id = ${filters.sellerId} OR transfer_row.new_seller_id = ${filters.sellerId})
      AND (${filters.sourceId}::text IS NULL
        OR (${filters.sourceId} = '__NONE__' AND COALESCE(deal.source_id, conversation.crm_source_id) IS NULL)
        OR COALESCE(deal.source_id, conversation.crm_source_id) = ${filters.sourceId})
      AND (${filters.stageId}::text IS NULL OR deal.stage_id = ${filters.stageId})
    GROUP BY transfer_row.previous_seller_id, transfer_row.new_seller_id
    ORDER BY count DESC
  `;
  return {
    openConversations: number(row.open_conversations),
    newContacts: number(row.new_contacts),
    unread: number(row.unread),
    needsReview: number(row.needs_review),
    unassigned: number(row.unassigned),
    transfers: number(row.transfers),
    inboundToday: number(row.inbound_today),
    outboundToday: number(row.outbound_today),
    averageFirstResponseSeconds: nullableNumber(row.avg_response),
    roundRobin: rrRows.map((item) => ({
      sellerId: number(item.seller_id),
      sellerName: String(item.seller_name),
      leads: number(item.leads),
      percentage: rrTotal ? (number(item.leads) / rrTotal) * 100 : 0,
    })),
    transferFlows: transferRows.map((item) => ({
      fromSellerId: nullableNumber(item.previous_seller_id),
      toSellerId: number(item.new_seller_id),
      count: number(item.count),
    })),
    preservedOwnership: number(row.preserved),
  };
}

async function loadQuality(actor: AnalyticsActor, filters: AnalyticsFilters): Promise<SyncQuality> {
  const sql = analyticsDb();
  const env = serverEnv();
  const rows = await sql`
    WITH sync AS (
      SELECT
        CASE
          WHEN COUNT(*) = 0 THEN 'NEVER'
          WHEN BOOL_OR(status = 'FAILED') THEN 'FAILED'
          WHEN BOOL_OR(status = 'RUNNING') THEN 'RUNNING'
          ELSE 'SUCCESS'
        END AS status,
        MAX(last_successful_sync_at) AS last_success,
        COALESCE(SUM(records_processed), 0) AS records_processed
      FROM analytics.sync_state WHERE member_id = ${actor.memberId}
    )
    SELECT sync.*,
      (SELECT COUNT(*) FROM analytics.deal_facts
       WHERE member_id = ${actor.memberId}
         AND (${filters.sellerId}::integer IS NULL OR seller_id = ${filters.sellerId})) AS deals_synced,
      (SELECT COUNT(*) FROM analytics.bitrix_contacts
       WHERE member_id = ${actor.memberId}
         AND (${actor.role !== "SELLER"} OR assigned_by_id = ${actor.bitrixUserId})) AS contacts_synced,
      (SELECT COUNT(*) FROM analytics.deal_facts
       WHERE member_id = ${actor.memberId} AND source_id IS NULL
         AND (${filters.sellerId}::integer IS NULL OR seller_id = ${filters.sellerId})) AS without_source,
      (SELECT COUNT(*) FROM analytics.deal_facts
       WHERE member_id = ${actor.memberId} AND assigned_by_id IS NULL
         AND ${actor.role !== "SELLER"}) AS without_owner,
      (SELECT COUNT(*) FROM analytics.wf_conversation_facts
       WHERE member_id = ${actor.memberId} AND ownership_status = 'NEEDS_REVIEW'
         AND (${filters.sellerId}::integer IS NULL OR seller_id = ${filters.sellerId})) AS needs_review
    FROM sync
  `;
  const row = rows[0] ?? {};
  const last = row.last_success ? new Date(String(row.last_success)) : null;
  const stale = !last || Date.now() - last.getTime() > env.syncStaleMinutes * 60_000;
  const rawStatus = String(row.status ?? "NEVER") as SyncQuality["status"];
  return {
    status: rawStatus === "SUCCESS" && stale ? "STALE" : rawStatus,
    lastSuccessfulSyncAt: last?.toISOString() ?? null,
    recordsProcessed: number(row.records_processed),
    dealsSynced: number(row.deals_synced),
    contactsSynced: number(row.contacts_synced),
    withoutSource: number(row.without_source),
    withoutOwner: number(row.without_owner),
    needsReview: number(row.needs_review),
    stale,
  };
}

async function loadFilterOptions(actor: AnalyticsActor): Promise<FilterOptions> {
  const sql = analyticsDb();
  const [sellerRows, sourceRows, stageRows] = await Promise.all([
    sql`SELECT DISTINCT ON (seller_id) seller_id, bitrix_user_id, display_name FROM analytics.bitrix_users
        WHERE member_id IN (${actor.memberId}, '*') AND seller_id IS NOT NULL AND active
        ORDER BY seller_id, CASE WHEN member_id = ${actor.memberId} THEN 0 ELSE 1 END`,
    sql`SELECT DISTINCT ON (source_id) source_id, friendly_name FROM analytics.bitrix_sources
        WHERE member_id IN (${actor.memberId}, '*') AND active
        ORDER BY source_id, CASE WHEN member_id = ${actor.memberId} THEN 0 ELSE 1 END`,
    sql`SELECT DISTINCT ON (stage_id) stage_id, name, business_bucket, sort FROM analytics.bitrix_stages
        WHERE member_id IN (${actor.memberId}, '*') AND category_id = 0
        ORDER BY stage_id, CASE WHEN member_id = ${actor.memberId} THEN 0 ELSE 1 END, sort`,
  ]);
  return {
    sellers: sellerRows
      .filter((row) => actor.role !== "SELLER" || number(row.seller_id) === actor.sellerId)
      .map((row) => ({
        sellerId: number(row.seller_id),
        bitrixUserId: number(row.bitrix_user_id),
        name: String(row.display_name),
      })),
    sources: [
      ...sourceRows.map((row) => ({ id: String(row.source_id), name: String(row.friendly_name) })),
      { id: "__NONE__", name: "Sem origem" },
    ],
    stages: stageRows.map((row) => ({
      id: String(row.stage_id),
      name: String(row.name),
      businessBucket: row.business_bucket ? String(row.business_bucket) : null,
    })),
  };
}

export interface DealsPage {
  items: DealRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function loadDeals(
  actor: AnalyticsActor,
  filters: AnalyticsFilters,
  page: number,
  pageSize: number,
): Promise<DealsPage> {
  const sql = analyticsDb();
  const { from, to } = range(filters);
  const safePage = Math.max(1, page);
  const safeSize = Math.min(100, Math.max(10, pageSize));
  const offset = (safePage - 1) * safeSize;
  const [rows, counts] = await Promise.all([
    sql`SELECT * FROM analytics.deal_facts
        WHERE member_id = ${actor.memberId} AND category_id = 0
          AND bitrix_created_at >= ${from} AND bitrix_created_at < ${to}
          AND (${filters.sellerId}::integer IS NULL OR seller_id = ${filters.sellerId})
          AND (${filters.sourceId}::text IS NULL OR (${filters.sourceId} = '__NONE__' AND source_id IS NULL) OR source_id = ${filters.sourceId})
          AND (${filters.stageId}::text IS NULL OR stage_id = ${filters.stageId})
        ORDER BY bitrix_updated_at DESC LIMIT ${safeSize} OFFSET ${offset}`,
    sql`SELECT COUNT(*) AS total FROM analytics.deal_facts
        WHERE member_id = ${actor.memberId} AND category_id = 0
          AND bitrix_created_at >= ${from} AND bitrix_created_at < ${to}
          AND (${filters.sellerId}::integer IS NULL OR seller_id = ${filters.sellerId})
          AND (${filters.sourceId}::text IS NULL OR (${filters.sourceId} = '__NONE__' AND source_id IS NULL) OR source_id = ${filters.sourceId})
          AND (${filters.stageId}::text IS NULL OR stage_id = ${filters.stageId})`,
  ]);
  return {
    page: safePage,
    pageSize: safeSize,
    total: number(counts[0]?.total),
    items: rows.map((row) => ({
      id: number(row.bitrix_deal_id),
      title: String(row.title),
      contactId: nullableNumber(row.bitrix_contact_id),
      sellerId: nullableNumber(row.seller_id),
      sellerName: String(row.seller_name),
      sourceId: row.source_id ? String(row.source_id) : null,
      sourceName: String(row.source_name),
      stageId: String(row.stage_id),
      stageName: String(row.stage_name),
      businessBucket: row.business_bucket ? String(row.business_bucket) : null,
      value: nullableNumber(row.opportunity),
      currency: String(row.currency),
      createdAt: iso(row.bitrix_created_at),
      updatedAt: iso(row.bitrix_updated_at),
      closedAt: row.closed_at ? iso(row.closed_at) : null,
      isOpen: Boolean(row.is_open),
      bitrixUrl: `https://${serverEnv().bitrixDomain}/crm/deal/details/${number(row.bitrix_deal_id)}/`,
    })),
  };
}
