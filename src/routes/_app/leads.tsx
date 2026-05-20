import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DndContext, useDraggable, useDroppable, DragOverlay, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useAppStore } from "@/store/app-store";
import { agents, sourceColor, stageMeta, type Contact, type LeadStage } from "@/lib/mock-data";
import { brl, timeAgo, initials } from "@/lib/format";
import { MessageCircle, Pencil, Plus, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/leads")({
  component: Leads,
});

const stagesOrder: LeadStage[] = ["novo", "contato", "qualificado", "proposta", "fechado", "perdido"];

function Leads() {
  const { contacts, updateContactStage } = useAppStore();
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over) return;
    const stage = e.over.id as LeadStage;
    updateContactStage(String(e.active.id), stage);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold">Leads & Pipeline</h2>
          <p className="text-sm text-muted-foreground mt-1">{contacts.length} leads no funil</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 glass rounded-lg p-1">
            <button onClick={() => setView("kanban")} className={cn("px-2.5 py-1.5 rounded-md", view === "kanban" ? "bg-cyan text-background" : "text-muted-foreground")}><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setView("table")}  className={cn("px-2.5 py-1.5 rounded-md", view === "table" ? "bg-cyan text-background" : "text-muted-foreground")}><List className="h-4 w-4" /></button>
          </div>
          <button className="h-9 px-3 rounded-md bg-gold text-background text-xs font-semibold flex items-center gap-2 hover:glow-gold transition-all">
            <Plus className="h-4 w-4" /> Novo Lead
          </button>
        </div>
      </div>

      {view === "kanban" ? (
        <DndContext sensors={sensors} onDragStart={(e) => setActiveId(String(e.active.id))} onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
            {stagesOrder.map(stage => (
              <Column key={stage} stage={stage} contacts={contacts.filter(c => c.stage === stage)} />
            ))}
          </div>
          <DragOverlay>
            {activeId && (() => {
              const c = contacts.find(x => x.id === activeId);
              return c ? <LeadCard contact={c} dragging /> : null;
            })()}
          </DragOverlay>
        </DndContext>
      ) : (
        <TableView contacts={contacts} />
      )}
    </div>
  );
}

function Column({ stage, contacts }: { stage: LeadStage; contacts: Contact[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const meta = stageMeta[stage];
  return (
    <div ref={setNodeRef} className={cn("w-[300px] shrink-0 glass rounded-xl p-3 transition-all", isOver && "ring-1 ring-cyan/60")}>
      <div className="flex items-center justify-between px-1 pb-3 mb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
          <span className="text-sm font-semibold" style={{ color: meta.color }}>{meta.label}</span>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground bg-secondary/60 rounded px-1.5">{contacts.length}</span>
      </div>
      <div className="space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
        {contacts.map(c => <DraggableCard key={c.id} contact={c} />)}
        {contacts.length === 0 && <p className="text-xs text-muted-foreground/70 text-center py-6">Vazio</p>}
      </div>
    </div>
  );
}

function DraggableCard({ contact }: { contact: Contact }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: contact.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={cn(isDragging && "opacity-30")}>
      <LeadCard contact={contact} />
    </div>
  );
}

function LeadCard({ contact, dragging }: { contact: Contact; dragging?: boolean }) {
  const agent = agents.find(a => a.id === contact.assignedTo);
  return (
    <div className={cn(
      "group p-3 rounded-lg bg-card/80 border border-border/60 cursor-grab active:cursor-grabbing hover:border-cyan/50 hover:bg-card transition-all",
      dragging && "border-cyan glow-cyan rotate-1"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{contact.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{contact.company}</p>
        </div>
        {agent && (
          <div title={agent.name} className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0" style={{ background: `${agent.avatarColor}25`, color: agent.avatarColor }}>
            {initials(agent.name)}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${sourceColor[contact.source]}20`, color: sourceColor[contact.source] }}>
          {contact.source.replace(" Ads", "").replace("WhatsApp Orgânico", "WhatsApp")}
        </span>
        {contact.value && <span className="text-[11px] font-mono text-gold ml-auto">{brl(contact.value)}</span>}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground font-mono">{timeAgo(contact.lastActivity)} atrás</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="h-6 w-6 rounded hover:bg-cyan/20 hover:text-cyan flex items-center justify-center"><MessageCircle className="h-3 w-3" /></button>
          <button className="h-6 w-6 rounded hover:bg-secondary/60 flex items-center justify-center"><Pencil className="h-3 w-3" /></button>
        </div>
      </div>
    </div>
  );
}

function TableView({ contacts }: { contacts: Contact[] }) {
  return (
    <div className="glass rounded-xl p-5 overflow-x-auto">
      <table className="w-full text-sm min-w-[800px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
            <th className="text-left font-medium py-2.5">Contato</th>
            <th className="text-left font-medium">Empresa</th>
            <th className="text-left font-medium">Origem</th>
            <th className="text-left font-medium">Estágio</th>
            <th className="text-left font-medium">Agente</th>
            <th className="text-right font-medium">Valor</th>
            <th className="text-right font-medium">Última atividade</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {contacts.map(c => {
            const a = agents.find(x => x.id === c.assignedTo);
            return (
              <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                <td className="py-2.5 font-medium">{c.name}</td>
                <td className="text-muted-foreground">{c.company}</td>
                <td><span className="text-[11px] px-2 py-0.5 rounded" style={{ background: `${sourceColor[c.source]}20`, color: sourceColor[c.source] }}>{c.source}</span></td>
                <td><span className="text-[11px] px-2 py-0.5 rounded" style={{ background: stageMeta[c.stage].bg, color: stageMeta[c.stage].color }}>{stageMeta[c.stage].label}</span></td>
                <td className="text-xs">{a?.name}</td>
                <td className="text-right font-mono text-gold">{c.value ? brl(c.value) : "—"}</td>
                <td className="text-right font-mono text-xs text-muted-foreground">{timeAgo(c.lastActivity)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
