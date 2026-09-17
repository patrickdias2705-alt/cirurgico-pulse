# Arquitetura atual — baseline auditado

Data da auditoria: 2026-09-17.

## Stack

- TanStack Start `1.167.x` sobre Vite `7.3.x` e React `19.2`.
- TypeScript estrito, file-based routing do TanStack Router e SSR em Cloudflare Workers.
- Bun como package manager (`bun.lock` e `bunfig.toml`).
- Tailwind CSS 4, componentes shadcn/Radix e tokens próprios em `src/styles.css`.
- Recharts para gráficos, Zustand para estado local e TanStack Query já instalado.
- Deploy preparado exclusivamente para Cloudflare Workers (`wrangler.jsonc`).

## Estrutura e identidade preserváveis

- `AppLayout` concentra header, sidebar e área de conteúdo.
- `Sidebar` oferece sete rotas desktop e navegação inferior mobile.
- A identidade usa fundo azul quase preto, superfícies translúcidas, bordas azuis discretas,
  Syne nos títulos, DM Sans no conteúdo e JetBrains Mono nos números.
- Os componentes de UI são reutilizáveis e compatíveis com acessibilidade Radix.
- O dashboard atual já possui bons padrões de cards, gráficos responsivos e tabelas.

## Rotas encontradas

| Rota        | Estado anterior                                                        |
| ----------- | ---------------------------------------------------------------------- |
| `/`         | dashboard com vendas, metas e ranking 100% mockados no próprio arquivo |
| `/inbox`    | simulador de chat gravado apenas no Zustand                            |
| `/leads`    | Kanban mutável apenas no browser                                       |
| `/ads`      | campanhas e métricas Meta totalmente mockadas                          |
| `/contacts` | contatos do dataset local                                              |
| `/routing`  | regras fictícias mutáveis apenas em memória                            |
| `/settings` | integrações e tokens cenográficos; nenhuma ação persiste               |

## Dados e API anteriores

- `src/lib/mock-data.ts` gera contatos, conversas, campanhas e séries temporais fictícias.
- `src/routes/_app/index.tsx` mantém outro dataset mockado independente.
- `src/store/app-store.ts` inicia o Zustand com os mocks e simula escritas de CRM/inbox.
- Não existia API layer, conexão com banco, autenticação, RBAC, cache ou sync real.
- Não existiam variáveis de ambiente documentadas nem migrations próprias.

## Riscos do baseline

1. KPIs cenográficos poderiam ser confundidos com dados reais.
2. Rotas simulavam escrita em WhatsApp, pipeline e roteamento sem persistência.
3. A página de configurações mostrava tokens e estados de conexão fictícios.
4. O dashboard era público e não havia separação seller/supervisor/admin.
5. Não havia definição formal de KPI, timestamp ou semântica dos stages Bitrix.
6. A semântica real invertida de `WON` e `LOSE` não estava representada.

## Restrições observadas da plataforma WF

O schema operacional está na versão 007 e permanece fora do controle de migrations deste
repositório. As tabelas relevantes confirmadas são `wf_conversations`, `wf_messages`,
`wf_message_attributions`, `wf_conversation_assignments`, `wf_app_users` e
`wf_ownership_transfer_audit`. O dashboard só poderá consumi-las através de views analytics
explícitas e read-only. Nenhuma lógica de mensagens, mídia, ownership, round-robin, CRM ou n8n
será movida para este projeto.

## Decisão para a nova arquitetura

O TanStack Start será mantido como aplicação full-stack. Credenciais e SQL ficam exclusivamente
em rotas server-side. O frontend consumirá endpoints agregados `/api/analytics/*`. O Bitrix será
sincronizado para o schema `analytics` em lotes idempotentes por um fluxo n8n dedicado, sem ler o
banco interno do n8n. A autenticação será delegada ao backend WF existente, reaproveitando seus
perfis e sessões, com RBAC reaplicado nas queries analytics.
