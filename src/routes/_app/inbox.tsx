import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { agents, contacts, sourceColor } from "@/lib/mock-data";
import { initials, timeAgo } from "@/lib/format";
import { Search, Phone, Paperclip, Smile, Send, ArrowRightLeft, FileText, Mic, Play, Image as ImageIcon, MoreVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/inbox")({
  component: Inbox,
});

const tabs = [
  { id: "all", label: "Todas" },
  { id: "new", label: "Novas" },
  { id: "active", label: "Ativas" },
  { id: "resolved", label: "Resolvidas" },
  { id: "unassigned", label: "Sem agente" },
] as const;

function Inbox() {
  const { conversations, selectedConversationId, selectConversation, sendMessage, setConversationStatus, transferConversation } = useAppStore();
  const [tab, setTab] = useState<typeof tabs[number]["id"]>("all");
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);

  const conv = conversations.find(c => c.id === selectedConversationId);
  const contact = conv && contacts.find(c => c.id === conv.contactId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv?.messages.length, selectedConversationId]);

  const filtered = useMemo(() => conversations.filter(c => {
    const contact = contacts.find(x => x.id === c.contactId);
    if (tab === "new" && c.status !== "new") return false;
    if (tab === "active" && c.status !== "active") return false;
    if (tab === "resolved" && c.status !== "resolved") return false;
    if (tab === "unassigned" && c.assignedAgentId) return false;
    if (search && !contact?.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [conversations, tab, search]);

  const onSend = () => {
    if (!text.trim() || !conv) return;
    sendMessage(conv.id, text.trim());
    setText("");
  };

  return (
    <div className="h-[calc(100vh-72px)] flex">
      {/* Conversation list */}
      <aside className="w-[320px] shrink-0 border-r border-border/60 flex flex-col">
        <div className="p-4 space-y-3 border-b border-border/60">
          <div className="flex items-center gap-2 bg-secondary/60 border border-border/60 rounded-md px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar conversa..." className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground/70" />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn("text-[11px] px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition",
                  tab === t.id ? "bg-cyan text-background" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60")}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(c => {
            const contact = contacts.find(x => x.id === c.contactId)!;
            const borderColor = c.status === "active" ? "#00D4FF" : c.status === "new" ? "#F5C842" : "#7d8a9c";
            const selected = c.id === selectedConversationId;
            return (
              <button key={c.id} onClick={() => selectConversation(c.id)}
                className={cn("w-full text-left px-4 py-3 border-l-2 hover:bg-secondary/40 transition-colors flex gap-3",
                  selected && "bg-secondary/60")}
                style={{ borderLeftColor: borderColor }}
              >
                <div className="relative shrink-0">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: `${sourceColor[contact.source]}25`, color: sourceColor[contact.source] }}>
                    {initials(contact.name)}
                  </div>
                  {c.status === "active" && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-sidebar" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium truncate">{contact.name}</p>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">{timeAgo(c.lastTime)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                    {c.unread > 0 && <span className="bg-cyan text-background text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">{c.unread}</span>}
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <p>Nenhuma conversa encontrada.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Chat window */}
      <section className="flex-1 flex flex-col min-w-0 bg-background/30">
        {conv && contact ? (
          <>
            <header className="h-[68px] border-b border-border/60 flex items-center justify-between px-5 bg-background/40 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: `${sourceColor[contact.source]}25`, color: sourceColor[contact.source] }}>
                  {initials(contact.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{contact.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{contact.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {conv.assignedAgentId && (
                  <span className="text-[11px] px-2 py-1 rounded-md bg-secondary/60 border border-border/60">
                    Agente: <span className="text-cyan font-medium">{agents.find(a => a.id === conv.assignedAgentId)?.name}</span>
                  </span>
                )}
                <select
                  value={conv.status}
                  onChange={e => setConversationStatus(conv.id, e.target.value as any)}
                  className="text-[11px] px-2 py-1 rounded-md bg-secondary/60 border border-border/60 font-medium outline-none"
                >
                  <option value="new">Nova</option>
                  <option value="active">Ativa</option>
                  <option value="resolved">Resolvida</option>
                </select>
                <button className="h-8 w-8 rounded-md hover:bg-secondary/60 flex items-center justify-center"><MoreVertical className="h-4 w-4" /></button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {conv.messages.map(m => (
                <div key={m.id} className={cn("flex", m.from === "agent" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-md",
                    m.from === "agent"
                      ? "bg-cyan/15 border border-cyan/40 rounded-br-sm"
                      : "glass rounded-bl-sm"
                  )}>
                    {m.type === "text" && <p className="leading-relaxed">{m.content}</p>}
                    {m.type === "image" && (
                      <div>
                        <img src={m.content} alt={m.meta?.filename} className="rounded-lg max-w-[280px] mb-1" />
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1"><ImageIcon className="h-3 w-3" />{m.meta?.filename}</p>
                      </div>
                    )}
                    {m.type === "document" && (
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="h-9 w-9 rounded-md bg-gold/20 flex items-center justify-center"><FileText className="h-4 w-4 text-gold" /></div>
                        <div>
                          <p className="text-sm font-medium">{m.meta?.filename}</p>
                          <p className="text-[11px] text-muted-foreground">{m.meta?.size}</p>
                        </div>
                      </div>
                    )}
                    {m.type === "audio" && (
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <button className="h-8 w-8 rounded-full bg-cyan/20 flex items-center justify-center"><Play className="h-3.5 w-3.5 text-cyan" /></button>
                        <div className="flex-1 h-1 bg-border rounded-full">
                          <div className="h-full w-1/3 bg-cyan rounded-full" />
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground"><Mic className="h-3 w-3 inline" /> {m.meta?.duration}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground/80 mt-1 text-right font-mono">
                      {m.time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border/60 p-3 bg-background/50">
              <div className="flex items-center gap-2">
                <button className="h-9 w-9 rounded-md hover:bg-secondary/60 flex items-center justify-center text-muted-foreground"><Smile className="h-4 w-4" /></button>
                <button className="h-9 w-9 rounded-md hover:bg-secondary/60 flex items-center justify-center text-muted-foreground"><Paperclip className="h-4 w-4" /></button>
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 bg-secondary/60 border border-border/60 rounded-md px-4 py-2.5 text-sm outline-none focus:border-cyan/60 transition-colors"
                />
                <button onClick={() => setTransferOpen(true)}
                  className="h-10 px-3 rounded-md flex items-center gap-2 text-xs font-semibold bg-gold/15 border border-gold/50 text-gold hover:bg-gold/25 hover:glow-gold transition-all">
                  <ArrowRightLeft className="h-4 w-4" /> Transferir
                </button>
                <button onClick={onSend} disabled={!text.trim()}
                  className="h-10 w-10 rounded-md bg-cyan text-background flex items-center justify-center hover:scale-105 hover:glow-cyan transition-all disabled:opacity-40 disabled:scale-100">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Selecione uma conversa
          </div>
        )}
      </section>

      {/* Contact details */}
      {contact && conv && (
        <aside className="hidden lg:flex w-[320px] shrink-0 border-l border-border/60 flex-col overflow-y-auto">
          <div className="p-6 text-center border-b border-border/60">
            <div className="h-20 w-20 mx-auto rounded-full flex items-center justify-center text-2xl font-display font-semibold" style={{ background: `${sourceColor[contact.source]}25`, color: sourceColor[contact.source] }}>
              {initials(contact.name)}
            </div>
            <p className="mt-3 font-display font-semibold">{contact.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{contact.phone}</p>
            <p className="text-xs text-muted-foreground">{contact.email}</p>
            <div className="mt-4 flex gap-2 justify-center">
              <button className="h-8 w-8 rounded-md bg-secondary/60 hover:bg-cyan/20 hover:text-cyan flex items-center justify-center transition-colors"><Phone className="h-4 w-4" /></button>
              <button className="h-8 px-3 rounded-md bg-cyan/15 text-cyan text-xs font-medium border border-cyan/40 hover:bg-cyan/25">Ver no Pipeline</button>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Origem</p>
              <span className="inline-block text-xs px-2 py-1 rounded-md" style={{ background: `${sourceColor[contact.source]}20`, color: sourceColor[contact.source] }}>
                {contact.source}{contact.campaign && ` — ${contact.campaign}`}
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map(t => (
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded-md bg-secondary/60 border border-border/60">{t}</span>
                ))}
                <button className="text-[11px] px-2 py-0.5 rounded-md border border-dashed border-border hover:border-cyan hover:text-cyan">+ tag</button>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Timeline</p>
              <div className="space-y-2 text-xs">
                <Activity time="2h" text="Mensagem recebida via WhatsApp" />
                <Activity time="1d" text="Lead criado via Facebook Ads" />
                <Activity time="3d" text="Adicionado ao funil" />
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Anotação</p>
              <textarea placeholder="Adicionar nota interna..." rows={3} className="w-full bg-secondary/60 border border-border/60 rounded-md p-2 text-xs outline-none focus:border-cyan/60 resize-none" />
            </div>
          </div>
        </aside>
      )}

      {transferOpen && conv && contact && (
        <TransferModal
          contactName={contact.name}
          contactPhone={contact.phone}
          currentAgentId={conv.assignedAgentId}
          onClose={() => setTransferOpen(false)}
          onConfirm={(agentId) => {
            transferConversation(conv.id, agentId);
            const a = agents.find(x => x.id === agentId);
            toast.success(`Conversa transferida para ${a?.name}`);
            setTransferOpen(false);
          }}
        />
      )}
    </div>
  );
}

function Activity({ time, text }: { time: string; text: string }) {
  return (
    <div className="flex gap-2">
      <div className="flex flex-col items-center pt-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan glow-cyan" />
        <span className="flex-1 w-px bg-border my-1" />
      </div>
      <div className="pb-2">
        <p>{text}</p>
        <p className="text-muted-foreground font-mono text-[10px]">{time} atrás</p>
      </div>
    </div>
  );
}

function TransferModal({ contactName, contactPhone, currentAgentId, onClose, onConfirm }: {
  contactName: string; contactPhone: string; currentAgentId?: string; onClose: () => void; onConfirm: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string>(agents.find(a => a.id !== currentAgentId)?.id ?? agents[0].id);
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md p-4" onClick={onClose}>
      <div className="glass rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-semibold">Transferir Conversa</h2>
            <p className="text-xs text-muted-foreground mt-1">{contactName} · <span className="font-mono">{contactPhone}</span></p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-md hover:bg-secondary/60 flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Selecionar Vendedor</p>
          <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
            {agents.map(a => (
              <label key={a.id} className={cn("flex items-center gap-3 p-2 rounded-md border cursor-pointer transition",
                selected === a.id ? "border-cyan bg-cyan/10" : "border-border/60 hover:bg-secondary/40")}>
                <input type="radio" name="agent" checked={selected === a.id} onChange={() => setSelected(a.id)} className="hidden" />
                <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: `${a.avatarColor}25`, color: a.avatarColor }}>{initials(a.name)}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground">{a.email}</p>
                </div>
                <span className={cn("h-2 w-2 rounded-full", a.status === "online" ? "bg-emerald-400" : a.status === "away" ? "bg-gold" : "bg-muted-foreground")} />
              </label>
            ))}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Mensagem (opcional)</p>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Contexto para o agente..." className="w-full bg-secondary/60 border border-border/60 rounded-md p-2 text-xs outline-none focus:border-cyan/60 resize-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 h-10 rounded-md border border-border/60 text-sm font-medium hover:bg-secondary/60">Cancelar</button>
            <button onClick={() => onConfirm(selected)} className="flex-1 h-10 rounded-md bg-gold text-background text-sm font-semibold hover:glow-gold transition-all">Transferir</button>
          </div>
        </div>
      </div>
    </div>
  );
}
