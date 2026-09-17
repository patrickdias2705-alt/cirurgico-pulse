import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { AnalyticsPage, DataTable } from "@/components/analytics/analytics-page";
import { DashboardError, DashboardLoading } from "@/components/analytics/dashboard-states";
import { useDealsData } from "@/lib/analytics/client";
import type { AnalyticsFilters } from "@/lib/analytics/types";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_app/contacts")({ component: DealsPage });
function DealResults({ filters }: { filters: AnalyticsFilters }) {
  const [page] = useState(1);
  const query = useDealsData(filters, page);
  if (query.isPending) return <DashboardLoading />;
  if (query.isError || !query.data) return <DashboardError retry={() => void query.refetch()} />;
  return (
    <DataTable
      headers={["Negócio", "Responsável", "Origem", "Etapa", "Valor", "Atualizado", "Bitrix"]}
      rows={query.data.items.map((deal) => [
        deal.title,
        deal.sellerName,
        deal.sourceName,
        deal.stageName,
        deal.value === null ? "—" : brl(deal.value),
        new Date(deal.updatedAt).toLocaleDateString("pt-BR"),
        deal.bitrixUrl ? (
          <a
            href={deal.bitrixUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-cyan"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="sr-only">Abrir negócio</span>
          </a>
        ) : (
          "—"
        ),
      ])}
    />
  );
}
function DealsPage() {
  return (
    <AnalyticsPage
      title="Negócios"
      subtitle="Drill-down paginado e somente leitura dos negócios sincronizados do Bitrix."
    >
      {(_data, filters) => <DealResults filters={filters} />}
    </AnalyticsPage>
  );
}
