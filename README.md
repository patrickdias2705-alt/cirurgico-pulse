# Surgical Command Center

Build a complete, production-grade CRM & Communications Dashboard for "WF Cirúrgicos", a surgical equipment company. This is a premium B2B sales platform. The client is extremely demanding about visuals — this must be one of the most beautiful dashboards ever built on Lovable.

---

## 🎨 DESIGN DIRECTION

Aesthetic: "Medical Luxury" — think surgical precision meets high-end finance dashboard. Dark navy/obsidian base (#0A0E1A) with electric cyan (#00D4FF) and gold (#F5C842) accents. Clean, sharp, clinical. Like Bloomberg Terminal met Apple Health met a luxury Swiss watch interface.

Typography: Use "Syne" (display/headers) + "DM Sans" (body). Import from Google Fonts. Large, confident type. Numbers in "JetBrains Mono" for all metrics.

Visual details:
- Glassmorphism cards with subtle border glow (cyan on hover)
- Animated gradient mesh background (slow, subtle movement)
- Micro-animations on every number (count-up on load)
- Chart lines with glowing stroke effect
- Sidebar with frosted glass, icons from Lucide React
- Custom scrollbars styled to match theme
- Skeleton loaders on all async content
- Toast notifications (bottom-right, dark glass style)

---

## 🏗️ APP STRUCTURE

### Sidebar Navigation (collapsible, icon + label):
- 🏠 Dashboard (Overview)
- 💬 WhatsApp Inbox
- 📋 Leads & Pipeline
- 📊 Meta Ads Analytics
- 👥 Contacts
- 🔀 Routing Rules
- ⚙️ Settings

---

## 📱 PAGE 1 — DASHBOARD (Overview)

Top row KPI cards (animated count-up, glassmorphism):
- Total Leads (today / this month toggle)
- Leads from Meta Ads (with % of total badge)
- Active WhatsApp Conversations
- Conversion Rate (leads → clients)
- Revenue Pipeline (R$ formatted, Brazilian locale)

Main charts row:
1. **Lead Origin Breakdown** — Donut chart (Recharts). Segments: Facebook Ads, Instagram Ads, WhatsApp Organic, Referral, Direct. Each segment has a glowing color. Legend on the right with exact numbers and %.
2. **Leads Over Time** — Area chart with gradient fill (cyan → transparent). 30-day view. Tooltip shows leads per day + breakdown by source.
3. **Conversion Funnel** — Horizontal bar funnel: Lead → Contacted → Qualified → Proposal → Closed. Bars animate on load.

Bottom row:
- **Recent Conversations** — last 5 WhatsApp conversations with avatar, name, last message preview, timestamp, status badge (new / active / resolved)
- **Top Performing Ads** — table: Ad Name, Platform, Spend, Leads, CPL (Cost per Lead), CTR. Sortable columns.

---

## 💬 PAGE 2 — WHATSAPP INBOX

Layout: 3-column (contact list | chat window | contact details)

**Left column — Conversation List:**
- Search bar at top
- Filter tabs: All | New | Active | Resolved | Unassigned
- Each row: avatar with online indicator, name, last message snippet, time, unread badge
- Color-coded left border by status (cyan = active, gold = new, gray = resolved)
- Click to open conversation

**Center column — Chat Window:**
- Header: contact avatar, name, phone, assigned agent badge, status dropdown (New/Active/Resolved)
- Message bubbles: right-aligned (agent, cyan), left-aligned (contact, dark glass)
- Support for: text messages, image thumbnails, document icons, audio player (styled)
- Timestamps on each message
- Bottom bar:
  - Text input with placeholder "Digite uma mensagem..."
  - Emoji picker button
  - Attach file button
  - Send button (cyan, animated on hover)
  - **"Transferir para Vendedor"** button (gold, prominent) — opens a modal

**Transfer Modal (when "Transferir para Vendedor" is clicked):**
- Title: "Transferir Conversa"
- Shows current contact name + number
- Dropdown: select destination salesperson (list of agents with avatar, name, status indicator)
- Optional message to agent
- Confirm button → triggers transfer → shows toast "Conversa transferida para [Nome]"

**Right column — Contact Details:**
- Avatar (large), name, phone, email
- Lead source badge (e.g., "Facebook Ads — Campanha Implantes")
- Tags (editable)
- Timeline of interactions (calls, messages, notes)
- **"Ver no Pipeline"** button
- Add note field

---

## 📊 PAGE 3 — META ADS ANALYTICS

Header: Date range picker (last 7d / 30d / 90d / custom). "Conectar com Meta" button if not connected (opens OAuth flow modal).

KPI row:
- Total Spend (R$)
- Total Leads
- CPL — Cost per Lead
- CTR
- ROAS (if revenue data available)
- Impressions

Main charts:
1. **Spend vs Leads Over Time** — Dual axis line chart. Left Y = Spend (R$), Right Y = Leads. Two lines, different colors, shared X axis (dates).
2. **Leads by Campaign** — Horizontal bar chart. Each campaign is a bar. Sorted by leads desc. Hover shows CPL.
3. **Leads by Platform** — Pie/donut: Facebook vs Instagram vs Audience Network.
4. **Top Ads Creative Performance** — Card grid. Each card shows: ad thumbnail placeholder, ad name, platform icon, leads, spend, CPL badge.

Campaign table at bottom:
- Campaign Name | Status (Active/Paused badge) | Budget | Spend | Leads | CPL | CTR | Actions (View, Pause)
- Sortable, searchable, paginated

---

## 📋 PAGE 4 — LEADS & PIPELINE

Kanban board view (drag-and-drop with @dnd-kit/core):

Columns (each is a stage):
1. **Novo Lead** (cyan)
2. **Em Contato** (blue)
3. **Qualificado** (purple)
4. **Proposta Enviada** (gold)
5. **Fechado ✓** (green)
6. **Perdido ✗** (red/muted)

Each lead card:
- Contact name + company
- Lead source badge (small colored tag: "FB Ads" / "Instagram" / "WhatsApp" / "Indicação")
- Assigned salesperson avatar
- Last activity timestamp
- Value (R$) if available
- Quick actions on hover: WhatsApp icon (opens inbox), edit icon

Add lead button (top right, gold "+")

Toggle between Kanban view and Table view (list with sortable columns).

---

## 👥 PAGE 5 — CONTACTS

Full contacts table:
- Avatar, Name, Phone, Email, Source, Assigned Agent, Stage, Last Contact, Actions
- Global search
- Filters: by source, by agent, by stage, by date range
- Export CSV button
- Import CSV button
- Row click → opens side drawer with full contact profile

---

## 🔀 PAGE 6 — ROUTING RULES

Visual rule builder (no-code style):

Each rule is a card:
- Rule name
- **IF** condition: [Lead Source] [is] [Facebook Ads / Instagram / WhatsApp Organic / etc.]
- **AND** condition (optional): [Campaign contains] [keyword]
- **THEN**: Assign to → [Salesperson dropdown with avatar]
- Active/Inactive toggle
- Edit / Delete buttons

"+ Nova Regra" button opens a modal with the same IF/THEN builder.

Show a live preview: "Leads de Facebook Ads → Carlos Silva | Leads de Instagram → Ana Beatriz"

---

## ⚙️ PAGE 7 — SETTINGS

Tabs:
1. **Empresa** — Logo upload, company name (WF Cirúrgicos), timezone (America/Sao_Paulo)
2. **Agentes** — List of salespeople: avatar, name, email, phone number (for routing), status toggle, WhatsApp number linked
3. **WhatsApp API** — Connection status card, phone number display, webhook URL display (read-only), QR code area or API token field, test connection button
4. **Meta API** — OAuth connect button, connected ad accounts list, auto-sync toggle, last sync timestamp
5. **Notificações** — Toggle: new lead notification, new WhatsApp message, lead assigned

---

## 🔌 INTEGRATIONS (mock data + real structure)

**WhatsApp Business API:**
- Use mock data for all conversations, contacts, and messages
- Structure state and API calls as if using official WhatsApp Cloud API (Meta)
- Webhook handler structure in comments
- All phone numbers in Brazilian format (+55 XX XXXXX-XXXX)

**Meta Ads API:**
- Mock campaigns, ad sets, ads with realistic Brazilian surgical/medical market data
- Campaigns named things like "Implantes Dentários SP", "Cirurgia Ortopédica RJ", etc.
- Structure API calls as if using Meta Marketing API v18.0

**Data:**
- All mock data in Portuguese (Brazilian)
- Currency in BRL (R$)
- Dates in dd/mm/yyyy format
- All names Brazilian

---

## ⚙️ TECHNICAL STACK

- React + TypeScript
- Tailwind CSS (extended theme with custom colors)
- Recharts for all charts
- @dnd-kit/core for kanban drag-and-drop
- Lucide React icons
- React Router for navigation
- Zustand for state management
- date-fns for date formatting (pt-BR locale)
- Framer Motion for page transitions and micro-animations

---

## 🎯 CRITICAL DESIGN RULES

1. EVERY number on screen must have a count-up animation on first load
2. Every chart must have animated entrance (bars grow up, lines draw in)
3. Hover states on ALL interactive elements (subtle glow, scale 1.02)
4. No white backgrounds anywhere — this is a dark dashboard
5. Sidebar active item has a glowing left border in cyan
6. All modals use backdrop blur + dark glass style
7. Empty states must be beautiful (illustrated icon + helpful text)
8. Loading skeletons must match the exact shape of the content they replace
9. Mobile responsive — sidebar collapses to bottom nav on mobile
10. The WF Cirúrgicos logo area in the sidebar: show "WF" in a custom badge (gold text, dark background, sharp corners) + "Cirúrgicos" in Syne font

Make this the most visually impressive dashboard a surgical equipment company has ever seen.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cirurgico-pulse.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d684826d-7eb7-473f-a2d9-d6462ba601dc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
