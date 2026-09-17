import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPage, DataTable } from "@/components/analytics/analytics-page";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_app/routing")({ component: PerformancePage });
function PerformancePage() {
  return (
    <AnalyticsPage
      title="Performance comercial"
      subtitle="Resultados, atendimento e movimentações por responsável dentro do escopo autorizado."
    >
      {(data) => (
        <div className="space-y-4">
          <DataTable
            headers={[
              "Responsável",
              "Leads",
              "Propostas",
              "Ganhos",
              "Conversão",
              "Valor ganho",
              "Conversas",
              "Transferências",
            ]}
            rows={data.sellers.map((seller) => [
              seller.sellerName,
              seller.leads,
              seller.proposals,
              seller.won,
              `${seller.conversionRate.toFixed(1)}%`,
              brl(seller.wonValue),
              seller.activeConversations,
              `${seller.transfersIn} / ${seller.transfersOut}`,
            ])}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="glass rounded-xl p-5">
              <h3 className="font-display font-semibold">Saúde do round-robin</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Somente AUTO_TRAFFIC_ROUND_ROBIN no período.
              </p>
              <div className="mt-5 space-y-4">
                {data.operations.roundRobin.map((item) => (
                  <div key={item.sellerId}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{item.sellerName}</span>
                      <span className="font-mono">
                        {item.leads} · {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
                {data.operations.roundRobin.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Sem distribuição automática no período.
                  </p>
                )}
                <p className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  Ownership preservado/outros motivos:{" "}
                  <strong className="font-mono text-foreground">
                    {data.operations.preservedOwnership}
                  </strong>
                </p>
              </div>
            </article>
            <article className="glass rounded-xl p-5">
              <h3 className="font-display font-semibold">Fluxos de transferência</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Transferências concluídas; dashboard somente leitura.
              </p>
              <div className="mt-5 space-y-2">
                {data.operations.transferFlows.map((flow, index) => (
                  <div
                    key={`${flow.fromSellerId}-${flow.toSellerId}-${index}`}
                    className="flex justify-between rounded-lg bg-secondary/45 px-3 py-2 text-sm"
                  >
                    <span>
                      Seller {flow.fromSellerId ?? "sem owner"} → Seller {flow.toSellerId}
                    </span>
                    <span className="font-mono text-cyan">{flow.count}</span>
                  </div>
                ))}
                {data.operations.transferFlows.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sem transferências no período.</p>
                )}
              </div>
            </article>
          </div>
        </div>
      )}
    </AnalyticsPage>
  );
}
