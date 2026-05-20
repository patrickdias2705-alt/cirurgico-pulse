import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { agents } from "@/lib/mock-data";
import { initials } from "@/lib/format";
import { Building2, Users, MessageCircle, BarChart3, Bell, Check, Copy, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import wfLogo from "@/assets/wf-logo.png";

export const Route = createFileRoute("/_app/settings")({
  component: Settings,
});

const tabs = [
  { id: "empresa",  label: "Empresa",       icon: Building2 },
  { id: "agentes",  label: "Agentes",       icon: Users },
  { id: "whatsapp", label: "WhatsApp API",  icon: MessageCircle },
  { id: "meta",     label: "Meta API",      icon: BarChart3 },
  { id: "notif",    label: "Notificações",  icon: Bell },
] as const;

function Settings() {
  const [tab, setTab] = useState<typeof tabs[number]["id"]>("empresa");

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="font-display text-3xl font-semibold">Configurações</h2>
        <p className="text-sm text-muted-foreground mt-1">Ajustes da operação e integrações</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="md:w-[220px] shrink-0 space-y-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                tab === t.id ? "bg-cyan/10 text-cyan" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60")}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </aside>

        <div className="flex-1 min-w-0 space-y-4">
          {tab === "empresa" && <EmpresaTab />}
          {tab === "agentes" && <AgentesTab />}
          {tab === "whatsapp" && <WhatsAppTab />}
          {tab === "meta" && <MetaTab />}
          {tab === "notif" && <NotifTab />}
        </div>
      </div>
    </div>
  );
}

function EmpresaTab() {
  return (
    <div className="glass rounded-xl p-6 space-y-5 max-w-xl">
      <h3 className="font-display font-semibold">Dados da Empresa</h3>
      <div>
        <p className="text-xs text-muted-foreground mb-2">Logo</p>
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-md border border-cyan/30 bg-background flex items-center justify-center overflow-hidden"><img src={wfLogo} alt="WF Cirúrgicos" className="h-14 w-14 object-contain" /></div>
          <button className="h-9 px-3 rounded-md border border-border/60 text-xs font-medium hover:bg-secondary/60">Alterar logo</button>
        </div>
      </div>
      <Field label="Nome da Empresa" value="WF Cirúrgicos" />
      <Field label="CNPJ" value="12.345.678/0001-90" />
      <Field label="Timezone" value="America/Sao_Paulo (BRT)" />
      <Field label="Moeda padrão" value="BRL (R$)" />
      <button className="h-10 px-4 rounded-md bg-cyan text-background text-sm font-semibold hover:glow-cyan transition-all" onClick={() => toast.success("Salvo!")}>Salvar alterações</button>
    </div>
  );
}

function AgentesTab() {
  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold">Vendedores</h3>
        <button className="h-9 px-3 rounded-md bg-gold text-background text-xs font-semibold flex items-center gap-2 hover:glow-gold"><Plus className="h-3.5 w-3.5" /> Adicionar</button>
      </div>
      <div className="space-y-2">
        {agents.map(a => (
          <div key={a.id} className="flex items-center gap-3 p-3 rounded-md bg-secondary/40 border border-border/60">
            <div className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: `${a.avatarColor}25`, color: a.avatarColor }}>{initials(a.name)}</div>
            <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.email}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">WhatsApp</p>
                <p className="font-mono text-xs">{a.whatsapp}</p>
              </div>
            </div>
            <span className={cn("h-2 w-2 rounded-full", a.status === "online" ? "bg-emerald-400" : a.status === "away" ? "bg-gold" : "bg-muted-foreground")} />
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked={a.status !== "offline"} className="sr-only peer" />
              <div className="w-9 h-5 bg-secondary rounded-full peer-checked:bg-cyan transition-colors relative">
                <span className="absolute top-0.5 left-0.5 h-4 w-4 bg-background rounded-full transition-transform peer-checked:translate-x-4" />
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhatsAppTab() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="glass rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display font-semibold">WhatsApp Business API</h3>
            <p className="text-xs text-muted-foreground mt-1">Conexão via Meta Cloud API v18.0</p>
          </div>
          <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 font-semibold flex items-center gap-1"><Check className="h-3 w-3" /> Conectado</span>
        </div>
        <div className="mt-5 space-y-3">
          <Field label="Número WhatsApp Business" value="+55 11 4000-1234" mono />
          <Field label="Phone Number ID" value="103948572019384" mono />
          <ReadOnly label="Webhook URL" value="https://api.wfcirurgicos.com.br/whatsapp/webhook" />
          <ReadOnly label="API Token" value="EAAGm0PX4ZCpsBAJ•••••••••••••••" />
        </div>
        <div className="flex gap-2 mt-5">
          <button className="h-9 px-3 rounded-md bg-cyan text-background text-xs font-semibold hover:glow-cyan">Testar conexão</button>
          <button className="h-9 px-3 rounded-md border border-border/60 text-xs hover:bg-secondary/60">Reautenticar</button>
        </div>
      </div>
    </div>
  );
}

function MetaTab() {
  return (
    <div className="glass rounded-xl p-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display font-semibold">Meta Marketing API</h3>
          <p className="text-xs text-muted-foreground mt-1">Sincronização de campanhas Facebook & Instagram</p>
        </div>
        <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 font-semibold flex items-center gap-1"><Check className="h-3 w-3" /> Conectado</span>
      </div>
      <div className="mt-5 space-y-3">
        <ReadOnly label="Contas de anúncios conectadas" value="WF Cirúrgicos Ads (act_28394019)" />
        <ReadOnly label="Última sincronização" value="hoje 14:32" />
        <div className="flex items-center justify-between p-3 rounded-md bg-secondary/40 border border-border/60">
          <div>
            <p className="text-sm font-medium">Sincronização automática</p>
            <p className="text-xs text-muted-foreground">A cada 15 minutos</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-9 h-5 bg-secondary rounded-full peer-checked:bg-cyan transition-colors relative">
              <span className="absolute top-0.5 left-0.5 h-4 w-4 bg-background rounded-full transition-transform peer-checked:translate-x-4" />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

function NotifTab() {
  const items = [
    { id: "lead",     label: "Novo lead",                   desc: "Quando um lead entrar pela primeira vez" },
    { id: "message",  label: "Nova mensagem WhatsApp",      desc: "Mensagem recebida de contato existente" },
    { id: "assigned", label: "Lead atribuído a você",       desc: "Quando uma regra atribui um lead" },
    { id: "lost",     label: "Lead perdido",                desc: "Lead movido para 'Perdido'" },
  ];
  return (
    <div className="glass rounded-xl p-6 max-w-2xl space-y-3">
      <h3 className="font-display font-semibold">Preferências de Notificação</h3>
      {items.map(i => (
        <div key={i.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/40 border border-border/60">
          <div>
            <p className="text-sm font-medium">{i.label}</p>
            <p className="text-xs text-muted-foreground">{i.desc}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-9 h-5 bg-secondary rounded-full peer-checked:bg-cyan transition-colors relative">
              <span className="absolute top-0.5 left-0.5 h-4 w-4 bg-background rounded-full transition-transform peer-checked:translate-x-4" />
            </div>
          </label>
        </div>
      ))}
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <input defaultValue={value} className={cn("w-full bg-secondary/60 border border-border/60 rounded-md px-3 py-2 text-sm outline-none focus:border-cyan/60", mono && "font-mono")} />
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2 bg-background/40 border border-border/60 rounded-md px-3 py-2">
        <span className="font-mono text-xs flex-1 truncate">{value}</span>
        <button onClick={() => { navigator.clipboard.writeText(value); toast.success("Copiado"); }} className="text-muted-foreground hover:text-cyan"><Copy className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}
