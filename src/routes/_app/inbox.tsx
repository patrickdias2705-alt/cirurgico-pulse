import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Clock3,
  MessageSquare,
  UserRoundX,
} from "lucide-react";
import { AnalyticsPage } from "@/components/analytics/analytics-page";

export const Route = createFileRoute("/_app/inbox")({ component: OperationsPage });
function OperationsPage() {
  return (
    <AnalyticsPage
      title="Operação WhatsApp"
      subtitle="Indicadores do sidecar WF; este painel não lê conteúdo das mensagens."
    >
      {(data) => {
        const items = [
          { label: "Conversas", value: data.operations.openConversations, icon: MessageSquare },
          { label: "Inbound hoje", value: data.operations.inboundToday, icon: ArrowDownLeft },
          { label: "Outbound hoje", value: data.operations.outboundToday, icon: ArrowUpRight },
          { label: "Não lidas", value: data.operations.unread, icon: MessageSquare },
          { label: "Sem responsável", value: data.operations.unassigned, icon: UserRoundX },
          { label: "Revisão", value: data.operations.needsReview, icon: AlertTriangle },
          { label: "Transferências", value: data.operations.transfers, icon: ArrowRightLeft },
          {
            label: "Resposta média",
            value: data.operations.averageFirstResponseSeconds
              ? `${Math.round(data.operations.averageFirstResponseSeconds / 60)} min`
              : "—",
            icon: Clock3,
          },
        ];
        return (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {items.map(({ label, value, icon: Icon }) => (
              <article key={label} className="metric-card rounded-xl p-5">
                <Icon className="h-5 w-5 text-cyan" />
                <p className="mt-5 font-mono text-3xl font-semibold">{value}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
              </article>
            ))}
          </div>
        );
      }}
    </AnalyticsPage>
  );
}
