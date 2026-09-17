export type AppRole = "SELLER" | "SUPERVISOR" | "ADMIN";

export interface AnalyticsActor {
  memberId: string;
  displayName: string;
  role: AppRole;
  sellerId: number | null;
  bitrixUserId: number | null;
}

export interface AnalyticsFilters {
  dateFrom: string;
  dateTo: string;
  sellerId: number | null;
  sourceId: string | null;
  stageId: string | null;
}

export interface OverviewMetrics {
  newLeads: number;
  portfolio: number;
  proposals: number;
  won: number;
  disqualified: number;
  openDeals: number;
  pipelineValue: number;
  wonValue: number;
  conversionRate: number;
  needsReview: number;
  unassigned: number;
}

export interface FunnelPoint {
  bucket: "NEW_LEAD" | "PORTFOLIO" | "PROPOSAL" | "WON" | "DISQUALIFIED";
  label: string;
  count: number;
  percentage: number;
  dropOff: number | null;
}

export interface SourceMetric {
  sourceId: string | null;
  sourceName: string;
  leads: number;
  proposals: number;
  won: number;
  pipelineValue: number;
  conversionRate: number;
}

export interface SellerMetric {
  sellerId: number;
  bitrixUserId: number;
  sellerName: string;
  leads: number;
  portfolio: number;
  proposals: number;
  won: number;
  disqualified: number;
  openDeals: number;
  pipelineValue: number;
  wonValue: number;
  conversionRate: number;
  activeConversations: number;
  averageFirstResponseSeconds: number | null;
  transfersIn: number;
  transfersOut: number;
}

export interface TimeseriesPoint {
  date: string;
  newLeads: number;
  proposals: number;
  won: number;
  wonValue: number;
  newConversations: number;
}

export interface OperationsMetrics {
  openConversations: number;
  newContacts: number;
  unread: number;
  needsReview: number;
  unassigned: number;
  transfers: number;
  inboundToday: number;
  outboundToday: number;
  averageFirstResponseSeconds: number | null;
  roundRobin: Array<{ sellerId: number; sellerName: string; leads: number; percentage: number }>;
  transferFlows: Array<{ fromSellerId: number | null; toSellerId: number; count: number }>;
  preservedOwnership: number;
}

export interface DealRow {
  id: number;
  title: string;
  contactId: number | null;
  sellerId: number | null;
  sellerName: string;
  sourceId: string | null;
  sourceName: string;
  stageId: string;
  stageName: string;
  businessBucket: string | null;
  value: number | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  isOpen: boolean;
  bitrixUrl: string | null;
}

export interface FilterOptions {
  sellers: Array<{ sellerId: number; bitrixUserId: number; name: string }>;
  sources: Array<{ id: string; name: string }>;
  stages: Array<{ id: string; name: string; businessBucket: string | null }>;
}

export interface SyncQuality {
  status: "NEVER" | "RUNNING" | "SUCCESS" | "FAILED" | "STALE";
  lastSuccessfulSyncAt: string | null;
  recordsProcessed: number;
  dealsSynced: number;
  contactsSynced: number;
  withoutSource: number;
  withoutOwner: number;
  needsReview: number;
  stale: boolean;
}

export interface DashboardPayload {
  actor: AnalyticsActor;
  filters: AnalyticsFilters;
  overview: OverviewMetrics;
  funnel: FunnelPoint[];
  sources: SourceMetric[];
  sellers: SellerMetric[];
  timeseries: TimeseriesPoint[];
  operations: OperationsMetrics;
  quality: SyncQuality;
  filterOptions: FilterOptions;
}
