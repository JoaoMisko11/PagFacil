# PagaFacil

Gestao de contas a pagar para MEIs e pessoas fisicas. Gratis, simples, sem planilha.

**Live:** https://paga-facil-mvp.vercel.app

## O que e

Web app (PWA) onde voce cadastra contas a pagar, ve um dashboard do que vence, e recebe lembretes por email. Feito para quem ainda usa planilha ou caderno para controlar pagamentos.

## Funcionalidades

- **Login sem senha** -- magic link por email
- **CRUD de contas** -- fornecedor, valor, vencimento, categoria, observacoes
- **Dashboard** -- secoes: vencidas, hoje, proximos 7 dias + totais semana/mes + calendario mensal
- **Filtros** -- status, categoria, busca por fornecedor
- **Contas recorrentes** -- ao marcar como paga, auto-gera a proxima (mensal)
- **Lembretes D-1** -- email automatico 1 dia antes do vencimento
- **Feedback widget** -- botao flutuante para sugestoes e bugs
- **PWA** -- installavel no celular
- **Mobile-first** -- funciona em telas de 360px+

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router, Server Actions, Server Components) |
| Database | Neon PostgreSQL + Prisma ORM |
| Auth | NextAuth v5 (magic link via Resend) |
| UI | Tailwind CSS v4 + shadcn/ui |
| Deploy | Vercel (free tier) |
| Linguagem | TypeScript (strict mode) |

## Rodando localmente

```bash
# Clone o repositorio
git clone https://github.com/JoaoMisko11/PagFacil.git
cd PagFacil

# Instale as dependencias
npm install

# Configure as variaveis de ambiente
cp .env.example .env.local
# Preencha DATABASE_URL, NEXTAUTH_SECRET, RESEND_API_KEY, etc.

# Rode as migrations
npx prisma migrate dev

# Inicie o dev server
npm run dev
```

O app roda em `http://localhost:3005`.

## Estrutura do projeto

```
app/
  (auth)/login/          # Pagina de login
  (dashboard)/           # Dashboard, contas, onboarding
  api/auth/              # NextAuth route handler
  api/cron/reminders/    # Cron job para lembretes D-1
components/              # Componentes React (bill-card, bill-form, etc.)
lib/                     # Auth, DB, server actions, formatadores
prisma/                  # Schema e migrations
public/                  # PWA assets (manifest, icons, service worker)
docs/                    # PRD, changelog, decisoes tecnicas
```

## Comandos uteis

```bash
npm run dev              # Dev server
npm run build            # Build de producao
npx prisma studio        # Editor visual do banco
npx prisma migrate dev   # Nova migration
npx vercel deploy --prod # Deploy para Vercel
```

## Status

MVP Fase 1 -- validacao com 10 usuarios em 10 dias. Veja o progresso em [docs/CHANGELOG.md](docs/CHANGELOG.md).

## Licenca

Projeto privado. Todos os direitos reservados.
