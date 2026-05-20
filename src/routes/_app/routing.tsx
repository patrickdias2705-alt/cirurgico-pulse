import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/store/app-store";
import { agents } from "@/lib/mock-data";
import { initials } from "@/lib/format";
import { Plus, Trash2, Pencil, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/routing")({
  component: Routing,
});

function Routing() {
  const { rules, toggleRule, deleteRule, addRule } = useAppStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold">Regras de Roteamento</h2>
          <p className="text-sm text-muted-foreground mt-1">Distribua leads automaticamente entre vendedores</p>
        </div>
        <button onClick={() => setOpen(true)} className="h-9 px-3 rounded-md bg-gold text-background text-xs font-semibold flex items-center gap-2 hover:glow-gold transition-all">
          <Plus className="h-4 w-4" /> Nova Regra
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rules.map(rule => {
          const agent = agents.find(a => a.id === rule.assignTo);
          return (
            <div key={rule.id} className={cn("glass glass-hover rounded-xl p-5", !rule.active && "opacity-60")}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-display font-semibold">{rule.name}</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={rule.active} onChange={() => toggleRule(rule.id)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-secondary rounded-full peer-checked:bg-cyan transition-colors relative">
                    <span className="absolute top-0.5 left-0.5 h-4 w-4 bg-background rounded-full transition-transform peer-checked:translate-x-4" />
                  </div>
                </label>
              </div>
              <div className="space-y-2 text-xs">
                {rule.conditions.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan bg-cyan/10 px-1.5 py-0.5 rounded">{i === 0 ? "SE" : "E"}</span>
                    <span className="text-muted-foreground">{c.field === "source" ? "Origem" : "Campanha"}</span>
                    <span className="text-muted-foreground">{c.op === "is" ? "é" : "contém"}</span>
                    <span className="font-medium">{c.value}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gold bg-gold/10 px-1.5 py-0.5 rounded">ENTÃO</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  {agent && (
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-semibold" style={{ background: `${agent.avatarColor}25`, color: agent.avatarColor }}>{initials(agent.name)}</div>
                      <span className="font-medium">{agent.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1 mt-4 pt-3 border-t border-border/60">
                <button className="flex-1 h-8 rounded-md hover:bg-secondary/60 text-xs flex items-center justify-center gap-1.5"><Pencil className="h-3 w-3" /> Editar</button>
                <button onClick={() => { deleteRule(rule.id); toast.success("Regra removida"); }} className="flex-1 h-8 rounded-md hover:bg-destructive/15 hover:text-destructive text-xs flex items-center justify-center gap-1.5"><Trash2 className="h-3 w-3" /> Excluir</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass rounded-xl p-5">
        <h3 className="font-display font-semibold mb-3">Distribuição Ativa</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {rules.filter(r => r.active).map(r => {
            const a = agents.find(x => x.id === r.assignTo);
            return (
              <div key={r.id} className="flex items-center gap-2 p-2 rounded-md bg-secondary/40">
                <span className="text-xs">{r.conditions[0].value}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-cyan">{a?.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {open && <RuleModal onClose={() => setOpen(false)} onSave={(r) => { addRule(r); toast.success("Regra criada"); setOpen(false); }} />}
    </div>
  );
}

function RuleModal({ onClose, onSave }: { onClose: () => void; onSave: (r: any) => void }) {
  const [name, setName] = useState("");
  const [source, setSource] = useState("Facebook Ads");
  const [agent, setAgent] = useState(agents[0].id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md p-4" onClick={onClose}>
      <div className="glass rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">Nova Regra</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-md hover:bg-secondary/60 flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Nome da regra</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Leads de Facebook → Carlos" className="w-full bg-secondary/60 border border-border/60 rounded-md px-3 py-2 outline-none focus:border-cyan/60" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan bg-cyan/10 px-1.5 py-0.5 rounded">SE</span>
            <span className="text-xs">Origem é</span>
            <select value={source} onChange={e => setSource(e.target.value)} className="bg-secondary/60 border border-border/60 rounded-md px-2 py-1 text-xs">
              <option>Facebook Ads</option><option>Instagram Ads</option><option>WhatsApp Orgânico</option><option>Indicação</option><option>Direto</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-wider text-gold bg-gold/10 px-1.5 py-0.5 rounded">ENTÃO</span>
            <span className="text-xs">Atribuir para</span>
            <select value={agent} onChange={e => setAgent(e.target.value)} className="bg-secondary/60 border border-border/60 rounded-md px-2 py-1 text-xs">
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-3">
            <button onClick={onClose} className="flex-1 h-10 rounded-md border border-border/60 text-sm hover:bg-secondary/60">Cancelar</button>
            <button
              onClick={() => onSave({ id: `r-${Date.now()}`, name: name || `${source} → ${agents.find(a => a.id === agent)?.name}`, active: true, conditions: [{ field: "source", op: "is", value: source }], assignTo: agent })}
              className="flex-1 h-10 rounded-md bg-cyan text-background text-sm font-semibold hover:glow-cyan transition-all"
            >Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
