# Plano Futuro: Workspaces (Contas Compartilhadas)

> **Status:** Planejado — não priorizado para Fase 1
> **Data:** 2026-04-03
> **Motivação:** Permitir que mais de uma pessoa (ex: casal) acesse e gerencie as mesmas contas.

## Decisão de Design

- Modelo de **Workspace/Família**: Bills pertencem a um Workspace, não a um User diretamente
- Cada user ganha um workspace "Pessoal" automaticamente no signup
- Convite por email (magic link com token)
- Se o convidado já tem conta, mantém seu workspace pessoal + ganha acesso ao compartilhado
- Workspace selector na UI para alternar
- Contas existentes ficam no workspace pessoal, com opção manual de mover

## Schema (rascunho)

```prisma
enum WorkspaceRole {
  ADMIN
  MEMBER
}

model Workspace {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  members   WorkspaceMember[]
  bills     Bill[]
  invites   WorkspaceInvite[]
}

model WorkspaceMember {
  id          String        @id @default(cuid())
  userId      String
  workspaceId String
  role        WorkspaceRole @default(MEMBER)
  createdAt   DateTime      @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([userId, workspaceId])
  @@index([userId])
  @@index([workspaceId])
}

model WorkspaceInvite {
  id          String        @id @default(cuid())
  email       String
  workspaceId String
  token       String        @unique @default(cuid())
  role        WorkspaceRole @default(MEMBER)
  expiresAt   DateTime
  acceptedAt  DateTime?
  createdAt   DateTime      @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([email])
}
```

**Mudanças em modelos existentes:**
- `User`: adicionar `activeWorkspaceId String?` e relação `memberships WorkspaceMember[]`
- `Bill`: trocar `userId` por `workspaceId`, adicionar `paidBy String?`

## Estratégia de Migração (3 etapas)

1. **Migration 1 — aditiva:** cria tabelas novas, adiciona `workspaceId` (opcional) e `paidBy` no Bill
2. **Migration 2 — backfill:** script que cria workspace "Pessoal" para cada user existente, move bills, seta `activeWorkspaceId`
3. **Migration 3 — cleanup:** torna `workspaceId` NOT NULL, remove `userId` do Bill

## Fases de Implementação

### Fase 1 — Schema e Migração
- Novos modelos + migração em 3 etapas

### Fase 2 — Camada de Contexto
- `lib/workspace.ts` — helpers: `getActiveWorkspaceId`, `getUserWorkspaces`, `switchWorkspace`, `requireWorkspaceMembership`
- `lib/actions.ts` — trocar `userId` por `workspaceId` em todas as server actions
- `lib/workspace-actions.ts` — actions novas: `createWorkspace`, `inviteMember`, `acceptInvite`, `removeMember`, `switchWorkspace`, `moveBillToWorkspace`

### Fase 3 — Atualizar Pages e Queries
Todas as páginas que fazem `where: { userId }` mudam para `where: { workspaceId }`:
- Dashboard, Bills, Pagamentos, Lixeira, Edição, Onboarding
- Cron jobs (reminders e monthly-report) enviam para todos os membros do workspace

### Fase 4 — UI Nova
- **Workspace selector** no nav (dropdown para alternar)
- **Página de configurações** (`/workspace`) — nome, membros, convites
- **Fluxo de convite** (`/invite/accept`) — aceitar convite via token
- **Auto-criar workspace no signup** via evento `createUser` do NextAuth

## Ordem de Execução

| # | Etapa | Risco |
|---|-------|-------|
| 1 | Schema: novos modelos + campos opcionais | Zero |
| 2 | Script de backfill | Baixo |
| 3 | `lib/workspace.ts` helpers | Zero |
| 4 | Migration: `workspaceId` obrigatório | Médio |
| 5 | Auth: auto-criar workspace no signup | Baixo |
| 6 | Actions + Pages juntos (trocar userId → workspaceId) | **Alto** |
| 7 | Workspace selector no nav | Médio |
| 8 | Página de configurações + actions de workspace | Baixo |
| 9 | Fluxo de convite | Baixo |
| 10 | Atualizar cron jobs | Médio |
| 11 | Cleanup: remover userId do Bill | Baixo |

## Edge Cases

- **User sem workspace** → `getActiveWorkspaceId` cria um pessoal automaticamente
- **Convite para email sem conta** → invite fica pendente, aceita após signup
- **Deletar workspace** → mover bills para workspace pessoal do admin antes
- **JWT stale** → sempre buscar `activeWorkspaceId` do DB nas server actions
- **`paidBy`** → exibir "Paga por Fulano" quando workspace tem >1 membro

## Decisões Pendentes

1. Roles importam de início? Ou todos podem tudo e roles ficam pra depois?
2. Limite de membros por workspace? (ex: máx 5 no free tier)
3. O que acontece com bills ao deletar um workspace? Mover para pessoal ou deletar?
