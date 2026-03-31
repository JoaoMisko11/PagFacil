# Changelog — PagaFácil

## D12 - 2026-03-31 - Importação via Planilha + Cadastro em Lote
### Feito
- [x] Página `/bills/import` — upload de planilha Excel (.xlsx, .xls) ou CSV
- [x] Parse com SheetJS (xlsx) — mapeamento flexível de colunas (fornecedor, valor, vencimento, categoria, obs)
- [x] Preview em tabela com validação visual: linhas válidas (verde) e inválidas (vermelho) com mensagens de erro
- [x] Importação em lote via `createMany` (até 500 contas por arquivo)
- [x] Parse de valores em formato brasileiro (R$ 1.234,56 → centavos)
- [x] Parse de datas DD/MM/AAAA
- [x] Normalização flexível de categorias (aceita abreviações e variações)
- [x] Página `/bills/batch` — tabela editável para cadastro de várias contas de uma vez
- [x] Adicionar/remover linhas dinamicamente, validação inline por campo
- [x] Checkbox de recorrência por linha no cadastro em lote
- [x] Botões "Importar" e "+ Lote" na página de contas
- [x] Landing page atualizada com destaque da feature
- [x] Build passando sem erros

### Pendente
- [ ] Deploy na Vercel
- [ ] Modelo de planilha para download

### Bugs Conhecidos
- Nenhum novo

---

## D11 - 2026-03-31 - Bot Telegram: Comandos de Contas
### Feito
- [x] Comando `/contas` — lista contas pendentes/vencidas dos próximos 30 dias
- [x] Comando `/nova Fornecedor Valor DD/MM/AAAA Categoria` — cria conta direto pelo Telegram
- [x] Comando `/pagar` — lista contas numeradas, usuário responde com número para marcar como paga
- [x] Comando `/ajuda` — lista todos os comandos disponíveis
- [x] Lógica de recorrência no `/pagar` (cria próxima parcela igual ao web app)
- [x] Validação: comandos exigem conta vinculada, senão orienta o usuário
- [x] Estado temporário (Map) para fluxo `/pagar` com expiração de 5 min

### Pendente
- [ ] Deploy na Vercel
- [ ] Registrar comandos no BotFather (menu de comandos)
- [ ] Testar fluxo completo em produção

### Bugs Conhecidos
- Estado do `/pagar` é in-memory (não sobrevive restart do serverless) — aceitável para MVP

---

## D10 - 2026-03-30 - UX: Dashboard & Calendário
### Feito
- [x] Fix: "Pendente mês" → "Pendente 30 dias" (rolling window, evita semana > mês no fim do mês)
- [x] Totalizadores no calendário: total pendente e pago do mês visualizado, atualiza ao navegar

### Pendente
- [ ] Testar login Google em produção (redirect URI na Vercel)
- [ ] Deploy na Vercel com novas mudanças

### Bugs Conhecidos
- Nenhum novo

---

## D9 - 2026-03-30 - Auth: Google OAuth + Nodemailer (substitui Resend)
### Feito
- [x] Google OAuth provider adicionado ao NextAuth (login com 1 clique)
- [x] Resend substituído por Nodemailer + Gmail SMTP para magic links
- [x] Resend substituído por Nodemailer no cron de lembretes (`/api/cron/reminders`)
- [x] Login form atualizado: botão Google no topo + tabs Email/Telegram abaixo
- [x] Pacote `resend` removido do projeto
- [x] Env vars novas: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SMTP_USER`, `SMTP_PASSWORD`

### Pendente
- [ ] Testar login Google em produção (redirect URI na Vercel)
- [ ] Testar magic link via Gmail SMTP
- [ ] Configurar env vars na Vercel

### Bugs Conhecidos
- Nenhum novo

---

## D8 - 2026-03-30 - Calendário no Dashboard
### Feito
- [x] Componente `BillCalendar` — calendário mensal interativo no dashboard (US-08)
- [x] Dots coloridos nos dias com contas: vermelho (vencida), amarelo (hoje), azul (a vencer)
- [x] Clique no dia mostra contas daquele dia com fornecedor, categoria, valor e status
- [x] Legenda visual abaixo do calendário
- [x] Locale pt-BR via date-fns (já instalado)
- [x] CSS dos dots em globals.css
- [x] Build passando sem erros

### Pendente
- [ ] Testar fluxo completo em produção (login + reminder via Telegram)
- [ ] Regenerar token do bot (exposto durante setup)
- [ ] Testar dark mode em mobile (iOS Safari, Android Chrome)
- [ ] Lighthouse score > 90
- [ ] Preparar onboarding dos 10 usuários

### Bugs Conhecidos
- Next.js 16 deprecou `middleware.ts` em favor de `proxy` — funciona mas mostra warning
- Vercel Cron no free tier roda 1x/dia (suficiente para reminder D-1)
- Usuários Telegram-only recebem email placeholder (`telegram_<chatId>@pagafacil.local`)

---

## D7 - 2026-03-29 - Integração Telegram (Login + Lembretes)
### Feito
- [x] Telegram Bot (@pagafacil_bot) criado via BotFather
- [x] `lib/telegram.ts` — wrapper fetch para Telegram Bot API (zero deps)
- [x] Webhook `/api/telegram/webhook` — bot responde `/start` com Chat ID do usuário
- [x] Login via Telegram: Credentials provider OTP no NextAuth v5
- [x] Model `TelegramOtp` no Prisma + migration aplicada
- [x] Campos `telegramChatId` e `notifyVia` no User
- [x] Login UI com tabs Email/Telegram (shadcn Tabs)
- [x] Fluxo OTP: informa Chat ID → recebe código 6 dígitos no Telegram → digita no app
- [x] Página `/settings` para vincular Telegram e escolher canal de notificação
- [x] Link "Config" adicionado ao nav
- [x] Cron reminders atualizado: envia via Telegram ou email conforme preferência
- [x] `.env.example` atualizado com variáveis do Telegram
- [x] Webhook registrado na Vercel
- [x] Build passando sem erros

### Pendente
- [ ] Testar fluxo completo em produção (login + reminder via Telegram)
- [ ] Regenerar token do bot (exposto durante setup)
- [ ] Testar dark mode em mobile (iOS Safari, Android Chrome)
- [ ] Lighthouse score > 90
- [ ] Preparar onboarding dos 10 usuários

### Bugs Conhecidos
- Next.js 16 deprecou `middleware.ts` em favor de `proxy` — funciona mas mostra warning
- Vercel Cron no free tier roda 1x/dia (suficiente para reminder D-1)
- Usuários Telegram-only recebem email placeholder (`telegram_<chatId>@pagafacil.local`)

---

## D6 - 2026-03-29 - Landing Page & Recorrentes Avançadas
### Feito
- [x] Landing page na tela de login: hero com proposta de valor, 3 benefícios, login integrado, footer
- [x] Frequência variável para contas recorrentes: semanal, quinzenal, mensal, anual
- [x] Data de fim opcional para contas recorrentes
- [x] Migration aplicada (RecurringFrequency enum + endDate)
- [x] Contas existentes continuam funcionando como mensal (retrocompatível)

### Pendente
- [ ] Testar dark mode em mobile (iOS Safari, Android Chrome)
- [ ] Lighthouse score > 90
- [ ] Preparar onboarding dos 10 usuários

### Bugs Conhecidos
- Next.js 16 deprecou `middleware.ts` em favor de `proxy` — funciona mas mostra warning
- Vercel Cron no free tier roda 1x/dia (suficiente para reminder D-1)

---

## D5 - 2026-03-29 - QA, Bug Fixes & Dark Mode
### Feito
- [x] QA completo: análise de Server Actions, pages, components, API routes
- [x] Fix: setMonth overflow em contas recorrentes (Jan 31 → Fev 28)
- [x] Fix: markBillAsPaid envolto em $transaction para recorrentes
- [x] Fix: CRON_SECRET validation (rejeita quando env var não existe)
- [x] Fix: try-catch em todos os DB calls (actions.ts + cron route)
- [x] Fix: debounce memory leak no bill-filters (useEffect com cleanup)
- [x] Fix: progress bar do onboarding (ternário com mesmo valor)
- [x] Fix: supplier aceita só espaços (.trim() no Zod)
- [x] Fix: feedback type sem validação (whitelist feature/bug/other)
- [x] Fix: touch targets < 44px nos botões do bill-card (h-11 mobile)
- [x] Fix: dueDate aceita string inválida (refine no Zod)
- [x] Fix: categorias hardcoded em 2 lugares → lib/constants.ts
- [x] Schema: onDelete Cascade em Bill e Feedback
- [x] Schema: index composto (userId, deletedAt, dueDate)
- [x] CRON_SECRET adicionado ao .env.example
- [x] Dark mode: toggle light/dark/system no nav, sem FOUC
- [x] Nav: cores hardcoded → classes semânticas Tailwind (dark-compatible)
- [x] Deploy: https://paga-facil-mvp.vercel.app

### Pendente para D6-D7
- [ ] Preparar onboarding dos 10 usuários (convites, material)
- [ ] Testar dark mode em mobile (iOS Safari, Android Chrome)
- [ ] Lighthouse score > 90

### Bugs Conhecidos
- Next.js 16 deprecou `middleware.ts` em favor de `proxy` — funciona mas mostra warning
- Vercel Cron no free tier roda 1x/dia (suficiente para reminder D-1)
- .env.example está no .gitignore (CRON_SECRET só existe localmente)

---

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
