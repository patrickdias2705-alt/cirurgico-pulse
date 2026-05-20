import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useAppStore } from "@/store/app-store";
import { agents, sourceColor, stageMeta, type LeadSource, type LeadStage } from "@/lib/mock-data";
import { ddmmyyyy, initials, timeAgo } from "@/lib/format";
import { Search, Download, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/contacts")({
  component: Contacts,
});

function Contacts() {
  const { contacts } = useAppStore();
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<LeadSource | "all">("all");
  const [agent, setAgent] = useState<string | "all">("all");
  const [stage, setStage] = useState<LeadStage | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => contacts.filter(c => {
    if (search && !(c.name + c.email + c.company).toLowerCase().includes(search.toLowerCase())) return false;
    if (source !== "all" && c.source !== source) return false;
    if (agent !== "all" && c.assignedTo !== agent) return false;
    if (stage !== "all" && c.stage !== stage) return false;
    return true;
  }), [contacts, search, source, agent, stage]);

  const detail = selected ? contacts.find(c => c.id === selected) : null;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold">Contatos</h2>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} de {contacts.length} contatos</p>
        </div>
        <div className="flex gap-2">
          <button className="h-9 px-3 rounded-md border border-border/60 text-xs font-medium flex items-center gap-2 hover:bg-secondary/60"><Upload className="h-3.5 w-3.5" /> Importar</button>
          <button className="h-9 px-3 rounded-md border border-border/60 text-xs font-medium flex items-center gap-2 hover:bg-secondary/60"><Download className="h-3.5 w-3.5" /> Exportar CSV</button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-3 flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 bg-secondary/60 border border-border/60 rounded-md px-3 py-1.5 flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="bg-transparent text-sm outline-none w-full" />
        </div>
        <Sel value={source} onChange={(v) => setSource(v as any)} options={[["all", "Todas as origens"], ["Facebook Ads", "Facebook Ads"], ["Instagram Ads", "Instagram Ads"], ["WhatsApp Orgânico", "WhatsApp"], ["Indicação", "Indicação"], ["Direto", "Direto"]]} />
        <Sel value={agent} onChange={(v) => setAgent(v as any)} options={[["all", "Todos os agentes"], ...agents.map(a => [a.id, a.name] as [string, string])]} />
        <Sel value={stage} onChange={(v) => setStage(v as any)} options={[["all", "Todos os estágios"], ...(Object.entries(stageMeta).map(([k, m]) => [k, m.label]) as [string, string][])]} />
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <th className="text-left font-medium px-4 py-3">Contato</th>
                <th className="text-left font-medium">Telefone</th>
                <th className="text-left font-medium">Email</th>
                <th className="text-left font-medium">Origem</th>
                <th className="text-left font-medium">Agente</th>
                <th className="text-left font-medium">Estágio</th>
                <th className="text-right font-medium px-4">Última atividade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map(c => {
                const a = agents.find(x => x.id === c.assignedTo);
                return (
                  <tr key={c.id} onClick={() => setSelected(c.id)} className="hover:bg-secondary/30 cursor-pointer transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-semibold" style={{ background: `${sourceColor[c.source]}25`, color: sourceColor[c.source] }}>{initials(c.name)}</div>
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-[11px] text-muted-foreground">{c.company}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{c.phone}</td>
                    <td className="text-xs text-muted-foreground">{c.email}</td>
                    <td><span className="text-[11px] px-2 py-0.5 rounded" style={{ background: `${sourceColor[c.source]}20`, color: sourceColor[c.source] }}>{c.source}</span></td>
                    <td className="text-xs">{a?.name}</td>
                    <td><span className="text-[11px] px-2 py-0.5 rounded" style={{ background: stageMeta[c.stage].bg, color: stageMeta[c.stage].color }}>{stageMeta[c.stage].label}</span></td>
                    <td className="text-right px-4 font-mono text-xs text-muted-foreground">{timeAgo(c.lastActivity)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-md" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md h-full bg-card border-l border-border overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border/60 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full flex items-center justify-center font-semibold" style={{ background: `${sourceColor[detail.source]}25`, color: sourceColor[detail.source] }}>{initials(detail.name)}</div>
                <div>
                  <p className="font-display text-lg font-semibold">{detail.name}</p>
                  <p className="text-xs text-muted-foreground">{detail.company}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="h-8 w-8 rounded-md hover:bg-secondary/60 flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-5 text-sm">
              <Info label="Telefone" value={<span className="font-mono">{detail.phone}</span>} />
              <Info label="Email" value={detail.email} />
              <Info label="Origem" value={<span className="text-[11px] px-2 py-0.5 rounded" style={{ background: `${sourceColor[detail.source]}20`, color: sourceColor[detail.source] }}>{detail.source}</span>} />
              {detail.campaign && <Info label="Campanha" value={detail.campaign} />}
              <Info label="Estágio" value={<span className="text-[11px] px-2 py-0.5 rounded" style={{ background: stageMeta[detail.stage].bg, color: stageMeta[detail.stage].color }}>{stageMeta[detail.stage].label}</span>} />
              <Info label="Agente" value={agents.find(a => a.id === detail.assignedTo)?.name} />
              <Info label="Criado em" value={<span className="font-mono">{ddmmyyyy(detail.createdAt)}</span>} />
              <Info label="Tags" value={
                <div className="flex flex-wrap gap-1.5">
                  {detail.tags.map(t => <span key={t} className="text-[11px] px-2 py-0.5 rounded-md bg-secondary/60 border border-border/60">{t}</span>)}
                </div>
              } />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="bg-secondary/60 border border-border/60 rounded-md px-3 py-1.5 text-xs font-medium outline-none">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <div>{value}</div>
    </div>
  );
}
