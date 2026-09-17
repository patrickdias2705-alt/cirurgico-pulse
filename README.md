# Cirúrgico Pulse

Dashboard comercial real da WF Cirúrgicos, construído sobre TanStack Start, React, Tailwind e Recharts. Consolida snapshots incrementais do Bitrix24 e indicadores de operação do WhatsApp WF sem permitir escrita nas tabelas operacionais.

## Desenvolvimento

```sh
bun install --frozen-lockfile
copy .env.example .env
bun run dev
```

Antes de começar, leia [arquitetura](docs/ARCHITECTURE.md), [fontes de dados](docs/DATA_SOURCES.md), [KPIs](docs/KPI_DEFINITIONS.md) e [operações](docs/OPERATIONS.md).

## Segurança

Credenciais ficam somente no servidor. A sessão é reutilizada do WhatsApp WF, e o backend força o escopo da carteira para sellers. Migrations são manuais; este projeto não altera Bitrix, n8n nem a operação do WhatsApp.
