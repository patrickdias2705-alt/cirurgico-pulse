import { AlertTriangle, Database, RefreshCw } from "lucide-react";

export function DashboardLoading() {
  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8" aria-label="Carregando indicadores">
      <div className="h-16 w-80 max-w-full animate-pulse rounded-xl bg-secondary/70" />
      <div className="h-24 animate-pulse rounded-xl bg-secondary/55" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-xl border border-border/50 bg-secondary/45"
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-xl border border-border/50 bg-secondary/45" />
        <div className="h-80 animate-pulse rounded-xl border border-border/50 bg-secondary/45" />
      </div>
    </div>
  );
}
export function DashboardError({ retry }: { retry: () => void }) {
  return (
    <div className="grid min-h-[55vh] place-items-center px-6">
      <div className="glass max-w-lg rounded-xl p-7 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-amber-400" />
        <h2 className="mt-4 font-display text-xl font-semibold">
          Dados temporariamente indisponíveis
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A autenticação, a sincronização ou a conexão analítica precisa ser restabelecida. Nenhum
          número simulado será exibido.
        </p>
        <button
          onClick={retry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold"
        >
          <RefreshCw className="h-4 w-4" /> Tentar novamente
        </button>
      </div>
    </div>
  );
}
export function DashboardEmpty() {
  return (
    <div className="glass rounded-xl p-10 text-center">
      <Database className="mx-auto h-8 w-8 text-muted-foreground" />
      <h3 className="mt-4 font-display text-lg font-semibold">Nenhum dado no período</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Ajuste os filtros ou confira o estado da sincronização Bitrix.
      </p>
    </div>
  );
}
