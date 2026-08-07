# Meu Enxoval — Web

Frontend do projeto **Meu Enxoval**: planejamento de casamento e enxoval
com checklist compartilhado, orçamento e checkout com Mercado Pago.

## Stack

- React 19 + Vite 6
- React Router 8
- Supabase (banco + checklist compartilhado)
- Mercado Pago (checkout, via API)

## Como rodar

```bash
npm install
npm run dev
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Descrição |
| --- | --- |
| `VITE_API_URL` | URL da API (padrão `http://localhost:3000`) |
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública/anônima do Supabase |

## Comandos

```bash
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção (dist/)
npm run preview  # preview do build
npm run lint     # oxlint
```

## Estrutura

```
src/
├── components/   # Componentes de interface (Header, ChecklistPage, Cart...)
├── context/      # Contextos (carrinho de compras)
├── data/         # Dados padrão (checklists e configurações das páginas)
├── hooks/        # Hooks de domínio (useChecklist, useCart)
├── pages/        # Rotas (Dashboard, Enxoval, Casamento, Orçamento, Checkout...)
└── services/     # Acesso a dados (Supabase, API de checkout)
```

As páginas de Enxoval e Casamento compartilham o componente `ChecklistPage`,
configurado via `src/data/checklistConfigs.js`.

## API

O checkout depende da API em `meu-enxoval-api`. Veja o README da API
para configurar Supabase, Mercado Pago e e-mail.
