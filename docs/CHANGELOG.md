# Changelog — PagaFácil

## D19 - 2026-04-03 - Landing Page, Rotas e Documentação
### Feito
- [x] **Family Link** — compartilhamento de contas entre usuários via convite (`/family`, `/invite/family`)
- [x] Model `FamilyInvite` + campo `familyId` no User com migration aplicada
- [x] Componente `FamilySettings` — gerar link, listar membros, sair da família
- [x] Nova categoria **FUNCIONARIO** com ícone e cor própria
- [x] Validação Zod e webhook Telegram atualizados para incluir FUNCIONARIO
- [x] **Pré-geração de parcelas recorrentes** (90 dias à frente) em vez de gerar uma por vez
- [x] Tela de pagamentos reorganizada com **tabs** (Vencidas, Hoje, Semana, Futuras)
- [x] Ordenação na tela de contas com select compacto
- [x] Tela de contas simplificada: remove seções por categoria, usa toggle chips em vez de filtro de status
- [x] Ícone de categoria restaurado nos cards (inclusive modo compact)
- [x] Fix: calendário mostra dot verde quando todas as contas do dia estão pagas
- [x] Fix: gráfico de evolução usa `dueDate` em vez de `paidAt` para série "pago"
- [x] Fix: melhora visual do formulário de lote para contas recorrentes
- [x] Build: `prisma migrate deploy` no build da Vercel
- [x] CHANGELOG.md, README.md, arquitetura.html e landing page atualizados
- [x] Hook de pre-push criado para lembrar de atualizar docs
- [x] **Landing page na raiz** (`/`) — hero, features, FAQ, pricing, comparação, mobile-responsive
- [x] Dashboard movido de `/` para `/dashboard`
- [x] Middleware atualizado: `/` e `/landing.html` como rotas públicas
- [x] Todas as referências `redirect("/")` e `callbackUrl: "/"` atualizadas para `/dashboard`
- [x] Domínio **pagafacil.work** configurado — metadataBase atualizado
- [x] Componente `LandingPage` em React (components/landing-page.tsx)
- [x] Fix: URL do mockup do dashboard atualizada para pagafacil.work

### Pendente
- [ ] Deploy na Vercel com novo domínio

### Bugs Conhecidos
- Nenhum novo

---

## D18 - 2026-04-02 - Separação Dashboard / Pagamentos / Contas
### Feito
- [x] Fix: corrige pins do calendário aparecendo um dia antes (bug de timezone)
- [x] Nova rota `/pagamentos` — lista por urgência (vencidas, hoje, semana, futuras) + marcar como paga
- [x] Dashboard limpo — mantém resumo, gráfico, calendário, insights, streak. Sem lista de contas.
- [x] Navegação com 3 abas: **Dashboard**, **Pagamentos**, **Contas**
- [x] Novo componente `BillManageCard` — card de gestão sem ação "marcar como paga" (editar + deletar)
- [x] Página `/bills` reestruturada: contas agrupadas por categoria, recorrentes colapsadas em entrada única
- [x] Contas recorrentes mostram: frequência, nº de parcelas, total já pago, próximo vencimento
- [x] Arquitetura.html e CHANGELOG.md atualizados

### Conceito — 3 telas, 3 intenções
- **Dashboard** (/) = visão geral — como estou? resumo, gráficos, calendário
- **Pagamentos** (/pagamentos) = ação — o que preciso pagar agora? marcar como paga
- **Contas** (/bills) = gestão — quais contas eu tenho? CRUD, importar, organizar

### Pendente
- [ ] Deploy na Vercel

### Bugs Conhecidos
- Nenhum novo

---

## D17 - 2026-04-01 - Gráfico de barras no dashboard
### Feito
- [x] Substituído gráfico de linha SVG por gráfico de barras lado a lado (pago vs pendente)
- [x] Adicionado eixo Y com valores de referência
- [x] Adicionado tooltips interativos (hover/touch) com valores por mês
- [x] Destaque visual no mês ativo (demais ficam com opacidade reduzida)
- [x] Proporção melhor (h-28/h-36) e barras com altura mínima para valores pequenos
- [x] Resumo inferior atualiza ao passar o mouse nos meses
- [x] Arquitetura.html e CHANGELOG.md atualizados

### Pendente
- Nenhum

### Bugs Conhecidos
- Nenhum

---

## D16 - 2026-04-01 - UX Fase 4: Delight (7/7 itens)
### Feito
- [x] **DL-1** Confetti CSS puro ao zerar contas pendentes — 30 partículas animadas, evento customizado `pagafacil:all-paid`, auto-remove após 3s
- [x] **DL-2** Transições suaves entre páginas — fade+slide (200ms) via `usePathname` + `requestAnimationFrame`, sem dependências
- [x] **DL-3** Saudação contextual no dashboard — "Bom dia/Boa tarde/Boa noite" + mensagem por dia da semana (timezone São Paulo)
- [x] **DL-4** Streak de pontualidade — badge motivacional com 4 níveis (1+, 3+, 5+, 10+ contas pagas em dia no mês), ícones progressivos
- [x] **DL-5** Haptic feedback no PWA — `navigator.vibrate(50)` ao marcar como paga, com feature detection
- [x] **DL-6** Easter egg no empty state — ilustração celebratória animada quando todas as contas do mês estão pagas, com sparkles e bounce
- [x] **DL-7** Modo compacto vs confortável — toggle na nav (ícone LayoutList/LayoutGrid), React Context + localStorage, padding/font reduzidos nos cards
- [x] Arquitetura.html, DECISIONS.md e CHANGELOG.md atualizados
- [x] Build passando sem erros

### Pendente
- [ ] Deploy na Vercel
- [ ] Atualizar landing page com destaque da Fase 4

### Bugs Conhecidos
- Nenhum novo

---

## D15 - 2026-04-01 - UX Fase 3: Diferenciação (7/7 itens)
### Feito
- [x] **DF-1** Gráfico de tendência SVG no dashboard — linha pago/pendente dos últimos 6 meses, sem dependência externa
- [x] **DF-2** Smart insights — analisa padrões de contas recorrentes e exibe dicas ("X vence por volta do dia Y"), alerta de contas vencidas
- [x] **DF-3** Quick actions no calendário — botão "Criar conta" em qualquer dia, botão "Paga" inline nas contas pendentes
- [x] **DF-4** Checklist de onboarding persistente — 4 itens (lembretes, 3 contas, 1 paga, recorrente), progress bar, dismissível
- [x] **DF-5** Relatório mensal por email/Telegram — cron job no 1º dia do mês com resumo de contas pagas/pendentes/vencidas
- [x] **DF-6** Categorias com ícones e cores — cada categoria tem ícone e cor própria nos bill cards e calendário
- [x] **DF-7** Atalhos de teclado — `n` = nova conta, `/` = buscar contas
- [x] Arquitetura.html e DECISIONS.md atualizados

### Pendente
- [ ] Deploy na Vercel

### Bugs Conhecidos
- Nenhum novo

---

## D14 - 2026-04-01 - UX Fase 2: Foundation (10/10 itens)
### Feito
- [x] **FD-1** Optimistic UI ao marcar como paga — useOptimistic + useTransition, card muda instantaneamente e reverte se falhar
- [x] **FD-2** Suspense + streaming no Dashboard — 3 boundaries (summary, calendario, contas) com skeletons, queries deduplicadas via React.cache
- [x] **FD-3** Error boundaries com retry — error.tsx em /bills e /settings, removido non-null assertions (session!.user!.id)
- [x] **FD-4** Onboarding step 3 — configurar lembretes (email/Telegram) apos cadastrar primeira conta, com opcao "Pular por agora"
- [x] **FD-5** Pagina de Lixeira (/bills/trash) — lista contas deletadas nos ultimos 30 dias com botao "Restaurar", server action restoreBill
- [x] **FD-6** Hierarchy visual dos summary cards — icones, background colorido e borda forte nos cards de urgencia (Vencidas = vermelho, Vencem hoje = amber)
- [x] **FD-7** Search com loading indicator — spinner inline no input durante debounce + navegacao via useTransition
- [x] **FD-8** Pagina /login/verify melhorada — icone visual, dica de spam, countdown, botao "Voltar e tentar novamente"
- [x] **FD-9** Drag-and-drop real na importacao — onDragEnter/Leave/Over/Drop com visual feedback, auto-submit ao soltar arquivo
- [x] **FD-10** Tabela de importacao responsiva — cards empilhados no mobile (sm:hidden), tabela no desktop (hidden sm:block)
- [x] Arquitetura.html atualizado com novas features e rota /bills/trash

### Pendente
- [ ] Atualizar landing page com destaque das novas features
- [ ] Deploy na Vercel

### Bugs Conhecidos
- Nenhum novo

---

## D13 - 2026-04-01 - Notificações Multi-canal + UX Quick Wins
### Feito
- [x] Configuração de lembretes permite marcar email e Telegram simultaneamente (checkboxes em vez de radio buttons)
- [x] Server action aceita múltiplos canais e armazena como "email,telegram" no campo notifyVia
- [x] Cron job de lembretes D-1 envia por todos os canais selecionados
- [x] Validação: pelo menos um canal deve ser selecionado; Telegram exige Chat ID
- [x] **UX Audit completo** — docs/UX_AUDIT.md com 45 issues, benchmark competitivo, roadmap 4 fases, 7 design principles
- [x] **QW-1** loading.tsx com skeleton screens no dashboard e lista de contas
- [x] **QW-2** error.tsx branded com botão "Tentar novamente"
- [x] **QW-3** Removido userScalable: false (WCAG 1.4.4)
- [x] **QW-4** Substituído alert() por erro inline no login Telegram
- [x] **QW-5** Toast de sucesso/erro ao marcar como paga e ao deletar conta
- [x] **QW-6** Botões da página /bills com flex-wrap para mobile
- [x] **QW-7** Nav "Config" renomeado para "Lembretes"
- [x] **QW-8** Botão "Cancelar" adicionado no formulário de conta
- [x] **QW-9** aria-label no botão de remover linha do cadastro em lote
- [x] **QW-10** Texto de confiança/segurança na landing page
- [x] Arquitetura.html atualizado

### Pendente
- [ ] Atualizar landing page com destaque da feature multi-canal
- [ ] Deploy na Vercel

### Bugs Conhecidos
- Nenhum novo

---

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
- [x] Campos de frequência e data de fim para contas recorrentes no cadastro em lote
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
