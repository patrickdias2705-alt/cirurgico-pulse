import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPage } from "@/components/analytics/analytics-page";
import { num } from "@/lib/format";

export const Route = createFileRoute("/_app/leads")({ component: LeadsPage });
function LeadsPage() {
  return (
    <AnalyticsPage
      title="Funil comercial"
      subtitle="Distribuição real dos negócios do FUNIL DE VENDAS; sem alterar etapas no Bitrix."
    >
      {(data) => (
        <div className="grid gap-3 lg:grid-cols-5">
          {data.funnel.map((stage, index) => (
            <article key={stage.bucket} className="glass rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 font-mono text-xs text-cyan">
                  {index + 1}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {stage.percentage.toFixed(1)}%
                </span>
              </div>
              <p className="mt-5 text-xs uppercase tracking-[.16em] text-muted-foreground">
                {stage.label}
              </p>
              <p className="mt-2 font-mono text-4xl font-semibold">{num(stage.count)}</p>
              {stage.dropOff !== null && (
                <p className={`mt-3 text-xs ${stage.dropOff > 0 ? "text-amber-400" : "text-moss"}`}>
                  {stage.dropOff > 0 ? "Queda" : "Avanço"}: {Math.abs(stage.dropOff).toFixed(1)}%
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </AnalyticsPage>
  );
}
