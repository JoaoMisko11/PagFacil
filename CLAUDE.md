# PagaFácil — Instruções para Claude Code

## O que é este projeto

PagaFácil é um MVP de contas a pagar para MEIs e pessoas físicas no Brasil. Web app gratuito onde o usuário cadastra contas, vê um dashboard do que vence, e recebe lembretes por email. Estamos na **Fase 1: validação com 10 usuários em 10 dias**.

## PRD

O PRD completo está em `docs/PRD_Fase1.md`. Leia esse arquivo antes de qualquer implementação — ele contém user stories, requirements, acceptance criteria e tech stack.

## Tech Stack (não mude sem perguntar)

- **Framework:** Next.js 15 (App Router, Server Actions, Server Components)
- **Database:** Neon PostgreSQL (free tier) + Prisma ORM
- **Auth:** NextAuth.js v5 com magic link via Resend
- **UI:** Tailwind CSS + shadcn/ui
- **Deploy:** Vercel (free tier)
- **Linguagem:** TypeScript (strict mode)

## Estrutura do Projeto

```
pagafacil/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── bills/page.tsx        # Lista de contas
│   │   └── bills/new/page.tsx    # Nova conta
│   ├── api/auth/[...nextauth]/
│   └── layout.tsx
├── components/
│   ├── bill-card.tsx
│   ├── bill-form.tsx
│   ├── dashboard-summary.tsx
│   └── ui/                       # shadcn components
├── lib/
│   ├── db.ts                     # Prisma client
│   ├── auth.ts                   # NextAuth config
│   └── actions.ts                # Server Actions
├── prisma/
│   └── schema.prisma
├── docs/
│   └── PRD_Fase1.md
└── package.json
```

## Convenções de Código

- Componentes em português para nomes de domínio (ex: `ContaCard`, `DashboardResumo`), mas código e variáveis em inglês
- Server Components por padrão. Só usa `"use client"` quando precisa de interatividade (onClick, useState, etc.)
- Server Actions para todas as mutations (criar, editar, deletar, marcar como paga)
- Validação com Zod nos Server Actions
- Prisma para todas as queries — nunca SQL raw
- Resend para emails transacionais (magic link, reminders)
- Todas as datas em UTC no banco, convertidas para America/Sao_Paulo na UI
- Valores monetários em centavos (integer) no banco, formatados como R$ na UI
- Mobile-first: toda UI deve funcionar em 360px+

## Comandos Úteis

```bash
npm run dev          # dev server
npx prisma studio    # visual DB editor
npx prisma migrate dev --name <nome>  # nova migration
npx prisma generate  # regenerar client após schema change
```

## Variáveis de Ambiente (.env.local)

```
DATABASE_URL=              # Neon connection string (pooled)
DIRECT_URL=                # Neon direct connection (migrations)
NEXTAUTH_SECRET=           # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
RESEND_API_KEY=            # API key do Resend
EMAIL_FROM=noreply@pagafacil.app
```

## Regras Importantes

1. **Não instale dependências sem perguntar** — queremos o mínimo absoluto
2. **Não crie abstrações prematuras** — código direto e simples, refatora depois
3. **Não use microserviços** — tudo é um monolith Next.js
4. **Não use Redux, Zustand ou state management externo** — React state + Server Components bastam
5. **Não crie testes unitários ainda** — nesta fase, testes manuais são suficientes
6. **Comite frequentemente** com mensagens descritivas em português
7. **Pergunte antes de decisões arquiteturais** que não estejam no PRD

## Schema Prisma (referência)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  bills         Bill[]
  accounts      Account[]
  sessions      Session[]
}

model Bill {
  id          String     @id @default(cuid())
  supplier    String
  amount      Int        // centavos
  dueDate     DateTime
  category    Category
  status      BillStatus @default(PENDING)
  notes       String?
  isRecurring Boolean    @default(false)
  paidAt      DateTime?
  deletedAt   DateTime?  // soft delete
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  userId      String
  user        User       @relation(fields: [userId], references: [id])

  @@index([userId, status])
  @@index([userId, dueDate])
}

enum Category {
  FIXO
  VARIAVEL
  IMPOSTO
  FORNECEDOR
  ASSINATURA
  OUTRO
}

enum BillStatus {
  PENDING
  PAID
  OVERDUE
}

// NextAuth models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

## Como Manter Contexto Entre Sessões

Este projeto roda em múltiplas sessões do Claude Code ao longo de 10 dias. Para evitar alucinação e retrabalho:

### Arquivos de Memória (leia SEMPRE no início de cada sessão)

1. **`CLAUDE.md`** (este arquivo) — instruções permanentes, tech stack, schema, convenções
2. **`docs/PRD_Fase1.md`** — source of truth do escopo, user stories, acceptance criteria
3. **`docs/DECISIONS.md`** — log de todas as decisões técnicas tomadas durante o projeto
4. **`docs/CHANGELOG.md`** — o que foi feito em cada dia/sessão, com status

### Regras Anti-Alucinação

1. **Antes de codar, leia os 4 arquivos acima.** Se não existirem ainda, pergunte.
2. **Antes de implementar algo, diga o que vai fazer e peça confirmação.** Não assuma.
3. **Se não tem certeza de algo, pergunte.** Nunca invente uma API, flag ou config.
4. **Consulte o PRD para acceptance criteria.** Cada requirement tem critérios específicos — siga-os.
5. **Não refaça o que já foi feito.** Consulte o CHANGELOG.md antes de começar.
6. **Após cada modificação no código, atualize CHANGELOG.md imediatamente** — não espere o fim da sessão. Registre o que foi feito assim que o código mudar.
7. **Ao tomar uma decisão técnica, registre em DECISIONS.md** com data e justificativa.
8. **Após cada evolução do software, atualize README.md** com as mudanças relevantes (features, setup, uso).
9. **Ao commitar, o CHANGELOG.md deve estar incluso no commit** — sempre atualize o changelog antes de criar o commit, para que ele reflita exatamente a versão commitada.
10. **Após cada modificação no software, atualize `docs/arquitetura.html`** — esse arquivo documenta a arquitetura e funcionalidades da solução. Mantenha-o sempre sincronizado com o estado atual do projeto (funcionalidades, estrutura de arquivos, tech stack, modelo de dados, fluxo do usuário).
11. **Após adicionar ou modificar funcionalidades, atualize a landing page (`app/(auth)/login/page.tsx`)** — a página de login serve como landing page e deve refletir a proposta de valor atual do produto. Ao adicionar features, atualize os textos e destaques para que novos visitantes vejam o que o PagaFácil oferece.

### Prompt de Início de Sessão

No começo de cada sessão, o João vai dizer algo como:
> "Estamos no D[X]. Leia os docs e me diga o plano antes de codar."

Sempre responda com:
1. Resumo do que já foi feito (do CHANGELOG)
2. O que está planejado para hoje (do PRD timeline)
3. Plano de execução passo a passo
4. Qualquer dúvida ou decisão pendente

### Template: docs/DECISIONS.md

```markdown
# Decisões Técnicas — PagaFácil

## D1 - [data]
- [decisão]: [justificativa]
```

### Template: docs/CHANGELOG.md

```markdown
# Changelog — PagaFácil

## D1 - [data] - Setup & Fundação
### Feito
- [x] item

### Pendente
- [ ] item

### Bugs Conhecidos
- nenhum
```

## Timeline (para contexto)

- **D1:** Setup (repo, Next.js, Tailwind, shadcn, Neon, Prisma, NextAuth, Vercel deploy)
- **D2:** CRUD de contas (formulário, listagem, editar, deletar)
- **D3:** Dashboard (vencidas/hoje/7dias, totais, marcar como paga)
- **D4:** Mobile + PWA + onboarding
- **D5:** Email reminders + recorrentes + feedback widget
- **D6:** Testes & QA
- **D7-D10:** Onboarding usuários + entrevistas + Go/No-Go
