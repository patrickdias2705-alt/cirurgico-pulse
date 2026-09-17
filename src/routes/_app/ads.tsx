import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPage, DataTable } from "@/components/analytics/analytics-page";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_app/ads")({ component: SourcesPage });
function SourcesPage() {
  return (
    <AnalyticsPage
      title="Origens comerciais"
      subtitle="Leitura por SOURCE_ID real do Bitrix; não representa gasto, impressão ou atribuição de plataforma de anúncios."
    >
      {(data) => (
        <DataTable
          headers={["Origem", "Leads", "Propostas", "Ganhos", "Conversão", "Pipeline"]}
          rows={data.sources.map((source) => [
            source.sourceName,
            source.leads,
            source.proposals,
            source.won,
            `${source.conversionRate.toFixed(1)}%`,
            brl(source.pipelineValue),
          ])}
        />
      )}
    </AnalyticsPage>
  );
}
