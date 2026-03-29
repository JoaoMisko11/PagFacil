# Decisões Técnicas — PagaFácil

## D4 - 2026-03-29
- **Auto-gerar recorrente no markBillAsPaid:** Quando uma conta recorrente é marcada como paga, cria automaticamente a próxima com `dueDate + 1 mês`. Simples e sem overengineering.
- **Email reminder via Vercel Cron:** Rota `/api/cron/reminders` protegida com `CRON_SECRET`. Agrupa contas por usuário para evitar spam. Cron roda às 11h UTC (8h BRT).
- **Feedback model no Prisma:** Tabela simples com `type` (feature/bug/other), `message` e relação com User. Sem categorização complexa — o objetivo é coletar tudo.
- **Repo público:** Vercel Hobby tier não permite deploys via CLI em repos privados. Como não há informação sensível no código (secrets estão em env vars), tornamos público.

## D3 - 2026-03-28/29
- **Onboarding dentro do (dashboard) group:** O onboarding fica em `app/(dashboard)/onboarding/page.tsx` para reutilizar o layout e nav. O redirect para `/onboarding` é feito no `page.tsx` do dashboard (não no layout), evitando loop de redirect.
- **Viewport export separado:** Next.js 16 pede que `viewport` e `themeColor` sejam exportados separadamente de `metadata`. Corrigido para eliminar warnings.
- **Touch targets 44px+:** Inputs e botões em mobile usam `h-11` (44px) para atender guidelines de acessibilidade. No desktop volta ao tamanho padrão via `sm:h-9`.
- **Middleware leve (sem NextAuth):** O `export { auth as middleware }` importava NextAuth + Prisma Adapter no Edge Runtime, ultrapassando o limite de 1MB do Vercel free tier. Substituído por um check simples de cookie `authjs.session-token`. A validação real da sessão continua nos Server Components.
- **Deploy via Vercel CLI:** URL de produção: https://paga-facil-mvp.vercel.app. Deploy feito via `npx vercel deploy --prod` (sem Git integration por limitação de permissão).

## D2 - 2026-03-28
- **useActionState para forms:** Usando `useActionState` (React 19) em vez de `useFormState` para lidar com Server Actions nos formulários. Retorna estado de erro e pending state.
- **Soft delete:** Contas deletadas recebem `deletedAt` timestamp em vez de serem removidas do banco. Permite recuperação por 30 dias conforme PRD.
- **Valores monetários:** Input aceita formato brasileiro (1.234,56), converte para centavos (integer) no server action via Zod transform.
- **Datas com T12:00:00Z:** Ao salvar dueDate, usamos meio-dia UTC para evitar problemas de timezone que fariam a data pular um dia.
- **JWT session strategy:** Mudamos de database session para JWT porque o middleware do Next.js roda no Edge Runtime, que não suporta Prisma Client diretamente.

## D1 - 2026-03-28
- **Next.js 16 (não 15):** create-next-app@latest instalou Next.js 16.2.1.
- **Prisma engine classic:** Prisma v6 com prisma.config.ts lendo .env.local via dotenv.
- **NextAuth v5 beta (5.0.0-beta.30):** Adapter Prisma, sessão JWT 30 dias.
- **Resend:** Usando onboarding@resend.dev como remetente padrão (free tier).
- **shadcn/ui com Tailwind v4:** Compatível, inicializado sem problemas.
- **Middleware para auth:** Usando middleware.ts (deprecado no Next.js 16, mas funcional).
