import { create } from "zustand";
import { contacts as seedContacts, conversations as seedConvs, routingRules as seedRules, type Contact, type Conversation, type LeadStage, type RoutingRule, type Message } from "@/lib/mock-data";

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  contacts: Contact[];
  updateContactStage: (id: string, stage: LeadStage) => void;
  updateContactAssignee: (id: string, agentId: string) => void;

  conversations: Conversation[];
  selectedConversationId: string | null;
  selectConversation: (id: string) => void;
  sendMessage: (convId: string, content: string) => void;
  transferConversation: (convId: string, agentId: string) => void;
  setConversationStatus: (convId: string, status: Conversation["status"]) => void;

  rules: RoutingRule[];
  toggleRule: (id: string) => void;
  deleteRule: (id: string) => void;
  addRule: (r: RoutingRule) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  contacts: seedContacts,
  updateContactStage: (id, stage) => set((s) => ({
    contacts: s.contacts.map(c => c.id === id ? { ...c, stage, lastActivity: new Date() } : c),
  })),
  updateContactAssignee: (id, agentId) => set((s) => ({
    contacts: s.contacts.map(c => c.id === id ? { ...c, assignedTo: agentId } : c),
  })),

  conversations: seedConvs,
  selectedConversationId: seedConvs[0]?.id ?? null,
  selectConversation: (id) => set({ selectedConversationId: id }),
  sendMessage: (convId, content) => set((s) => ({
    conversations: s.conversations.map(c => {
      if (c.id !== convId) return c;
      const m: Message = { id: `m-${Date.now()}`, from: "agent", type: "text", content, time: new Date() };
      return { ...c, messages: [...c.messages, m], lastMessage: content, lastTime: new Date(), unread: 0 };
    }),
  })),
  transferConversation: (convId, agentId) => set((s) => ({
    conversations: s.conversations.map(c => c.id === convId ? { ...c, assignedAgentId: agentId, status: "active" } : c),
  })),
  setConversationStatus: (convId, status) => set((s) => ({
    conversations: s.conversations.map(c => c.id === convId ? { ...c, status } : c),
  })),

  rules: seedRules,
  toggleRule: (id) => set((s) => ({ rules: s.rules.map(r => r.id === id ? { ...r, active: !r.active } : r) })),
  deleteRule: (id) => set((s) => ({ rules: s.rules.filter(r => r.id !== id) })),
  addRule: (r) => set((s) => ({ rules: [...s.rules, r] })),
}));
