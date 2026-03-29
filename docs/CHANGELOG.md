# Changelog — PagaFácil

## D4 - 2026-03-29 - Recorrentes, Reminders & Feedback
### Feito
- [x] Contas recorrentes: ao marcar como paga, auto-cria a próxima (mês seguinte)
- [x] Email reminder D-1: API route `/api/cron/reminders` com Vercel Cron (8h BRT)
- [x] Feedback widget: botão flutuante com formulário (feature/bug/outro), salva no DB
- [x] Model Feedback no Prisma + migration aplicada
- [x] vercel.json com cron schedule
- [x] Deploy: https://paga-facil-mvp.vercel.app
- [x] Repo tornado público (necessário para Vercel Hobby tier)

### Pendente para D5-D6
- [ ] QA e testes manuais
- [ ] Fixes de bugs encontrados
- [ ] Preparar onboarding dos 10 usuários

### Bugs Conhecidos
- Next.js 16 deprecou `middleware.ts` em favor de `proxy` — funciona mas mostra warning
- Vercel Cron no free tier roda 1x/dia (suficiente para reminder D-1)

---

## D3 - 2026-03-28 - Dashboard + Mobile + PWA + Onboarding
### Feito
- [x] Onboarding flow (2 passos: nome → primeira conta) com redirect automático para usuários novos
- [x] Componente OnboardingSteps com useActionState
- [x] Polimento mobile: touch targets 44px+ (inputs h-11, botões h-11, filtros)
- [x] Dashboard: card "Vencem hoje" com destaque amber quando > 0
- [x] Dashboard: estado vazio melhorado com ícone e CTA
- [x] Dashboard: mensagem para contas futuras (> 7 dias)
- [x] Fix: viewport/themeColor movidos para export separado (Next.js best practice)
- [x] PWA já funcional (manifest.json, service worker, ícones — feito no D1/D2)
- [x] Build passando sem warnings
- [x] Deploy na Vercel: https://paga-facil-mvp.vercel.app
- [x] Middleware leve (cookie check) para caber no Edge Function limit 1MB

### Pendente para D4
- [ ] Email reminders D-1 (R-09, P1)
- [ ] Contas recorrentes: auto-gerar próxima ao marcar paga (R-10, P1)
- [ ] Feedback widget (R-11, P1)

### Bugs Conhecidos
- Next.js 16 deprecou `middleware.ts` em favor de `proxy` — funciona mas mostra warning no build

---

## D2 - 2026-03-28 - CRUD de Contas
### Feito
- [x] Server Actions com validação Zod (createBill, updateBill, deleteBill, markBillAsPaid, markBillAsPending)
- [x] Formulário de nova conta (fornecedor, valor, vencimento, categoria, obs, recorrente)
- [x] Página /bills/new — criar nova conta
- [x] Página /bills — listagem com filtros (status, categoria, busca por fornecedor)
- [x] Página /bills/[id]/edit — editar conta existente
- [x] Deleção com confirmação via Dialog (soft delete)
- [x] Dashboard atualizado com seções: vencidas, hoje, próximos 7 dias
- [x] Cards de resumo: total pendente semana + mês
- [x] Marcar como paga / desfazer com 1 clique
- [x] Navegação com links Dashboard / Contas no nav
- [x] Utilitários de formatação (moeda, data, categoria)
- [x] Build passando sem erros

### Pendente para D3
- [ ] Melhorar dashboard (contadores, ordenação)
- [ ] Mobile responsividade
- [ ] PWA + onboarding

### Bugs Conhecidos
- Next.js 16 deprecou `middleware.ts` em favor de `proxy` — funciona mas mostra warning no build

---

## D1 - 2026-03-28 - Setup & Fundação
### Feito
- [x] CLAUDE.md, PRD, DECISIONS.md, CHANGELOG.md
- [x] Next.js 16, TypeScript, Tailwind v4, shadcn/ui
- [x] Prisma + Neon PostgreSQL (sa-east-1) — migration aplicada
- [x] NextAuth v5 com magic link via Resend
- [x] Middleware de autenticação, páginas de login
- [x] Layout do dashboard, .env.example
