import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Database, ShieldCheck, TriangleAlert } from "lucide-react";
import { AnalyticsPage } from "@/components/analytics/analytics-page";

export const Route = createFileRoute("/_app/settings")({ component: QualityPage });
function QualityPage() {
  return (
    <AnalyticsPage
      title="Qualidade dos dados"
      subtitle="Diagnóstico sem tokens, segredos ou credenciais; nenhuma configuração é alterada nesta tela."
    >
      {(data) => (
        <div className="grid gap-4 lg:grid-cols-3">
          <article className="glass rounded-xl p-5 lg:col-span-2">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-cyan" />
              <div>
                <h3 className="font-display font-semibold">Sincronização Bitrix</h3>
                <p className="text-xs text-muted-foreground">
                  Último ciclo consolidado e volume disponível
                </p>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["Status", data.quality.status],
                ["Negócios", data.quality.dealsSynced],
                ["Contatos", data.quality.contactsSynced],
                ["Processados", data.quality.recordsProcessed],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="mt-1 font-mono text-xl font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </article>
          <article className="glass rounded-xl p-5">
            <ShieldCheck className="h-5 w-5 text-moss" />
            <h3 className="mt-4 font-display font-semibold">Leitura protegida</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              A API aplica o member_id e a carteira da sessão no servidor. O browser não recebe
              credenciais de banco.
            </p>
          </article>
          {[
            ["Sem origem", data.quality.withoutSource],
            ["Sem owner Bitrix", data.quality.withoutOwner],
            ["Ownership em revisão", data.quality.needsReview],
          ].map(([label, value]) => (
            <article key={label} className="metric-card rounded-xl p-5">
              {Number(value) ? (
                <TriangleAlert className="h-5 w-5 text-amber-400" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-moss" />
              )}
              <p className="mt-4 font-mono text-3xl font-semibold">{value}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            </article>
          ))}
        </div>
      )}
    </AnalyticsPage>
  );
}
