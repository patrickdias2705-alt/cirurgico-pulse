// Mock data for WF Cirúrgicos CRM. Brazilian Portuguese, BRL.

export type LeadSource = "Facebook Ads" | "Instagram Ads" | "WhatsApp Orgânico" | "Indicação" | "Direto";
export type LeadStage = "novo" | "contato" | "qualificado" | "proposta" | "fechado" | "perdido";
export type ConvStatus = "new" | "active" | "resolved";

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarColor: string;
  status: "online" | "away" | "offline";
  whatsapp: string;
}

export const agents: Agent[] = [
  { id: "a1", name: "Carlos Silva",     email: "carlos@wfcirurgicos.com.br",  phone: "+55 11 98765-4321", avatarColor: "#00D4FF", status: "online",  whatsapp: "+55 11 98765-4321" },
  { id: "a2", name: "Ana Beatriz",      email: "ana@wfcirurgicos.com.br",     phone: "+55 11 97654-3210", avatarColor: "#F5C842", status: "online",  whatsapp: "+55 11 97654-3210" },
  { id: "a3", name: "Rafael Mendes",    email: "rafael@wfcirurgicos.com.br",  phone: "+55 21 96543-2109", avatarColor: "#A78BFA", status: "away",    whatsapp: "+55 21 96543-2109" },
  { id: "a4", name: "Juliana Costa",    email: "juliana@wfcirurgicos.com.br", phone: "+55 31 95432-1098", avatarColor: "#34D399", status: "online",  whatsapp: "+55 31 95432-1098" },
  { id: "a5", name: "Felipe Ribeiro",   email: "felipe@wfcirurgicos.com.br",  phone: "+55 47 94321-0987", avatarColor: "#F87171", status: "offline", whatsapp: "+55 47 94321-0987" },
];

export interface Contact {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  source: LeadSource;
  campaign?: string;
  tags: string[];
  stage: LeadStage;
  assignedTo: string;
  value?: number;
  lastActivity: Date;
  createdAt: Date;
}

const now = Date.now();
const d = (h: number) => new Date(now - h * 3600 * 1000);

const firstNames = ["Lucas", "Mariana", "Pedro", "Camila", "Bruno", "Larissa", "Eduardo", "Patrícia", "Thiago", "Fernanda", "Gustavo", "Beatriz", "Rodrigo", "Aline", "Marcelo", "Renata", "Vinícius", "Carolina", "Diego", "Tatiana", "André", "Letícia", "Henrique", "Vanessa"];
const lastNames = ["Almeida", "Santos", "Pereira", "Oliveira", "Rodrigues", "Carvalho", "Martins", "Souza", "Lima", "Araújo", "Ferreira", "Barbosa", "Nogueira", "Cardoso", "Teixeira", "Rocha"];
const companies = ["Clínica OdontoPlus", "Hospital São Lucas", "Centro Cirúrgico Vita", "Instituto Ortopédico", "Clínica Sorrisos", "MedCenter", "Hospital Beneficência", "Clínica Implante Já", "Centro Médico Vida", "Hospital Santa Cruz"];
const sources: LeadSource[] = ["Facebook Ads", "Instagram Ads", "WhatsApp Orgânico", "Indicação", "Direto"];
const campaigns = ["Implantes Dentários SP", "Cirurgia Ortopédica RJ", "Equipamentos Hospitalares MG", "Bisturis Premium", "Kit Implante Total"];
const stages: LeadStage[] = ["novo", "contato", "qualificado", "proposta", "fechado", "perdido"];

function rand<T>(arr: T[], i: number) { return arr[i % arr.length]; }

export const contacts: Contact[] = Array.from({ length: 38 }).map((_, i) => {
  const fn = rand(firstNames, i * 3 + 1);
  const ln = rand(lastNames, i * 7 + 2);
  const stage = i < 8 ? "novo" : i < 16 ? "contato" : i < 22 ? "qualificado" : i < 28 ? "proposta" : i < 33 ? "fechado" : "perdido";
  const src = rand(sources, i);
  return {
    id: `c${i + 1}`,
    name: `${fn} ${ln}`,
    company: rand(companies, i + 2),
    phone: `+55 ${10 + (i % 80)} 9${(8000 + i * 13).toString().slice(0, 4)}-${(1000 + i * 7).toString().slice(0, 4)}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${rand(companies, i).toLowerCase().replace(/[^a-z]/g, "")}.com.br`,
    source: src,
    campaign: src.includes("Ads") ? rand(campaigns, i) : undefined,
    tags: i % 3 === 0 ? ["VIP", "Recompra"] : i % 2 === 0 ? ["Urgente"] : ["Frio"],
    stage: stage as LeadStage,
    assignedTo: rand(agents, i).id,
    value: 5000 + ((i * 1373) % 80000),
    lastActivity: d((i * 3) % 240),
    createdAt: d(((i * 7) % 720) + 24),
  };
});

export interface Message {
  id: string;
  from: "agent" | "contact";
  type: "text" | "image" | "document" | "audio";
  content: string;
  meta?: { duration?: string; filename?: string; size?: string };
  time: Date;
}

export interface Conversation {
  id: string;
  contactId: string;
  status: ConvStatus;
  assignedAgentId?: string;
  unread: number;
  messages: Message[];
  lastMessage: string;
  lastTime: Date;
}

const sampleConv = (contactId: string, status: ConvStatus, hoursAgo: number, unread: number, msgs: Omit<Message, "id" | "time">[]): Conversation => {
  const base = Date.now() - hoursAgo * 3600 * 1000;
  const messages: Message[] = msgs.map((m, i) => ({
    ...m,
    id: `m${contactId}-${i}`,
    time: new Date(base + i * 5 * 60 * 1000),
  }));
  const last = messages[messages.length - 1];
  return { id: `conv-${contactId}`, contactId, status, assignedAgentId: status !== "new" ? agents[Number(contactId.slice(1)) % agents.length].id : undefined, unread, messages, lastMessage: last.type === "text" ? last.content : last.type === "image" ? "📷 Foto" : last.type === "audio" ? "🎤 Áudio" : "📎 Documento", lastTime: last.time };
};

export const conversations: Conversation[] = [
  sampleConv("c1", "new", 0.3, 3, [
    { from: "contact", type: "text", content: "Olá, vi o anúncio sobre kits de implante. Vocês atendem no Rio?" },
    { from: "contact", type: "text", content: "Preciso de um orçamento urgente para a clínica." },
    { from: "contact", type: "text", content: "Aguardo retorno, obrigado!" },
  ]),
  sampleConv("c2", "active", 1.5, 0, [
    { from: "contact", type: "text", content: "Bom dia! Recebi a tabela, queria entender melhor o kit cirúrgico premium." },
    { from: "agent",   type: "text", content: "Bom dia Mariana! Posso te explicar agora. Que tipo de cirurgia vocês mais realizam?" },
    { from: "contact", type: "text", content: "Principalmente ortognática e implantes." },
    { from: "agent",   type: "image", content: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600", meta: { filename: "kit_implante.jpg" } },
    { from: "agent",   type: "text", content: "Esse é o kit completo. Inclui 47 instrumentos e estojo grau cirúrgico." },
    { from: "contact", type: "audio", content: "", meta: { duration: "0:38" } },
  ]),
  sampleConv("c3", "active", 3, 1, [
    { from: "contact", type: "text", content: "Vocês têm bisturi harmônico em estoque?" },
    { from: "agent",   type: "text", content: "Temos sim! Quantas unidades você precisa?" },
    { from: "contact", type: "text", content: "5 unidades, com nota fiscal e entrega para SP." },
  ]),
  sampleConv("c4", "resolved", 26, 0, [
    { from: "contact", type: "text", content: "Pedido recebido, parabéns pela embalagem!" },
    { from: "agent",   type: "text", content: "Obrigado Camila! Qualquer coisa estamos à disposição." },
  ]),
  sampleConv("c5", "new", 0.1, 1, [
    { from: "contact", type: "text", content: "Preciso de fórceps maxilares, podem cotar?" },
  ]),
  sampleConv("c6", "active", 5, 2, [
    { from: "contact", type: "text", content: "Atrasou a entrega do pedido #4827." },
    { from: "agent",   type: "text", content: "Vou verificar agora com a logística e te retorno." },
    { from: "contact", type: "document", content: "", meta: { filename: "nota_fiscal_4827.pdf", size: "182 KB" } },
  ]),
  sampleConv("c7", "active", 8, 0, [
    { from: "contact", type: "text", content: "Vi vocês no Instagram. Trabalham com eletrocautério?" },
    { from: "agent",   type: "text", content: "Trabalhamos com a linha completa Bovie e WEM. Posso te enviar o catálogo." },
  ]),
  sampleConv("c8", "resolved", 48, 0, [
    { from: "contact", type: "text", content: "Tudo certo, fechei com vocês. Valeu!" },
  ]),
];

export interface KpiPoint { date: string; value: number; fb: number; ig: number; wa: number; }
export const leadsOverTime: KpiPoint[] = Array.from({ length: 30 }).map((_, i) => {
  const date = new Date(Date.now() - (29 - i) * 86400 * 1000);
  const base = 18 + Math.round(Math.sin(i / 2.3) * 8 + (i / 3));
  return {
    date: `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
    value: base + ((i * 7) % 9),
    fb: Math.round(base * 0.4),
    ig: Math.round(base * 0.35),
    wa: Math.round(base * 0.25),
  };
});

export const leadOriginBreakdown = [
  { name: "Facebook Ads",       value: 312, color: "#00D4FF" },
  { name: "Instagram Ads",      value: 248, color: "#F5C842" },
  { name: "WhatsApp Orgânico",  value: 156, color: "#A78BFA" },
  { name: "Indicação",          value:  88, color: "#34D399" },
  { name: "Direto",             value:  44, color: "#F87171" },
];

export const funnel = [
  { stage: "Lead",       count: 848 },
  { stage: "Contatado",  count: 612 },
  { stage: "Qualificado",count: 384 },
  { stage: "Proposta",   count: 196 },
  { stage: "Fechado",    count:  92 },
];

export interface AdCampaign {
  id: string;
  name: string;
  platform: "Facebook" | "Instagram" | "Audience Network";
  status: "Ativa" | "Pausada";
  budget: number;
  spend: number;
  leads: number;
  impressions: number;
  clicks: number;
}

export const campaigns_meta: AdCampaign[] = [
  { id: "cmp1", name: "Implantes Dentários SP",       platform: "Facebook",  status: "Ativa",    budget: 12000, spend:  9847, leads: 184, impressions: 248000, clicks: 4820 },
  { id: "cmp2", name: "Cirurgia Ortopédica RJ",        platform: "Instagram", status: "Ativa",    budget:  8000, spend:  7220, leads: 142, impressions: 192000, clicks: 3611 },
  { id: "cmp3", name: "Equipamentos Hospitalares MG", platform: "Facebook",  status: "Ativa",    budget: 10000, spend:  8540, leads: 108, impressions: 175000, clicks: 2940 },
  { id: "cmp4", name: "Bisturis Premium",              platform: "Instagram", status: "Pausada",  budget:  5000, spend:  4980, leads:  76, impressions:  98000, clicks: 1820 },
  { id: "cmp5", name: "Kit Implante Total",            platform: "Facebook",  status: "Ativa",    budget:  6500, spend:  3120, leads:  52, impressions:  84000, clicks: 1410 },
  { id: "cmp6", name: "Eletrocautério Bovie",          platform: "Audience Network", status: "Ativa", budget: 3000, spend: 2180, leads: 28, impressions: 56000, clicks: 880 },
  { id: "cmp7", name: "Forceps Profissional BA",       platform: "Instagram", status: "Pausada",  budget:  4000, spend:  3890, leads:  41, impressions:  72000, clicks: 1320 },
];

export const spendVsLeads = leadsOverTime.map((p, i) => ({
  date: p.date,
  spend: 800 + Math.round(Math.sin(i / 3) * 200 + (i * 14)),
  leads: p.value,
}));

export interface RoutingRule {
  id: string;
  name: string;
  active: boolean;
  conditions: { field: "source" | "campaign"; op: "is" | "contains"; value: string }[];
  assignTo: string; // agent id
}

export const routingRules: RoutingRule[] = [
  { id: "r1", name: "Leads do Facebook → Carlos", active: true,  conditions: [{ field: "source", op: "is", value: "Facebook Ads" }], assignTo: "a1" },
  { id: "r2", name: "Leads do Instagram → Ana",    active: true,  conditions: [{ field: "source", op: "is", value: "Instagram Ads" }], assignTo: "a2" },
  { id: "r3", name: "Campanha Implantes → Juliana", active: true, conditions: [{ field: "campaign", op: "contains", value: "Implante" }], assignTo: "a4" },
  { id: "r4", name: "WhatsApp Orgânico → Rafael",  active: false, conditions: [{ field: "source", op: "is", value: "WhatsApp Orgânico" }], assignTo: "a3" },
];

export const stageMeta: Record<LeadStage, { label: string; color: string; bg: string }> = {
  novo:        { label: "Novo Lead",       color: "#00D4FF", bg: "rgba(0,212,255,0.10)" },
  contato:     { label: "Em Contato",      color: "#60A5FA", bg: "rgba(96,165,250,0.10)" },
  qualificado: { label: "Qualificado",     color: "#A78BFA", bg: "rgba(167,139,250,0.10)" },
  proposta:    { label: "Proposta Enviada",color: "#F5C842", bg: "rgba(245,200,66,0.10)" },
  fechado:     { label: "Fechado ✓",       color: "#34D399", bg: "rgba(52,211,153,0.10)" },
  perdido:     { label: "Perdido ✗",       color: "#9CA3AF", bg: "rgba(156,163,175,0.10)" },
};

export const sourceColor: Record<LeadSource, string> = {
  "Facebook Ads":      "#00D4FF",
  "Instagram Ads":     "#F5C842",
  "WhatsApp Orgânico": "#34D399",
  "Indicação":         "#A78BFA",
  "Direto":            "#9CA3AF",
};
