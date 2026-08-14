# Meu Enxoval — Web

Frontend do projeto **Meu Enxoval**: planejamento de casamento e enxoval
com lista de presentes (reserva com nome), áreas privadas do casal,
orçamento e checkout com Mercado Pago.

## Stack

- React 19 + Vite 6
- React Router 8
- Supabase (banco, autenticação + RLS)
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

## Setup do banco (obrigatório na primeira vez)

O arquivo `supabase/schema.sql` cria as tabelas, funções e políticas
de segurança (Row Level Security). Execute no SQL Editor do Supabase:

1. Acesse o painel do Supabase → projeto → **SQL Editor**
2. Cole o conteúdo de `supabase/schema.sql` e clique em **Run**
3. Cada membro do casal cria a própria conta na página **Área do casal**
   (`/admin`) — os dois primeiros cadastros viram administradores
   automaticamente (máx. 2). O cadastro passa pela API
   (`POST /api/auth/register`), que cria o usuário com e-mail
   confirmado e o registra na tabela `admin_emails`

Com o RLS ativo:
- **Público**: pode ler a lista e reservar presentes (via funções seguras)
- **Casal**: pode marcar/adicionar/remover itens, ver orçamento e
  cancelar reservas
- **Orçamento e Casamento**: 100% privados (rota `/orcamento` e
  `/casamento` exigem login do casal)

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
├── context/      # Contextos (carrinho, autenticação do casal)
├── data/         # Dados padrão (checklists e configurações das páginas)
├── hooks/        # Hooks de domínio (useChecklist, useGiftReservations, useCart)
├── pages/        # Rotas (Dashboard, Enxoval, Casamento, Orçamento, Admin...)
└── services/     # Acesso a dados (Supabase, reservas, API de checkout)
```

As páginas de Enxoval e Casamento compartilham o componente `ChecklistPage`,
configurado via `src/data/checklistConfigs.js`.

## API

O checkout depende da API em `meu-enxoval-api`. Veja o README da API
para configurar Supabase, Mercado Pago e e-mail.
