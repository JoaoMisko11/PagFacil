# PagaFacil

Gestao de contas a pagar para MEIs e pessoas fisicas. Gratis, simples, sem planilha.

**Live:** https://pagafacil.work

## O que e

Web app (PWA) onde voce cadastra contas a pagar, ve um dashboard inteligente e recebe lembretes por email e Telegram. Feito para quem ainda usa planilha ou caderno para controlar pagamentos.

## Funcionalidades

- **Login multi-canal** — Google OAuth (1 clique), magic link por email ou OTP via Telegram
- **CRUD de contas** — fornecedor, valor, vencimento, categoria (Fixo, Variavel, Imposto, Fornecedor, Assinatura, Funcionario, Outro), observacoes
- **Dashboard inteligente** — resumo financeiro, grafico de barras (pago vs pendente, 6 meses), calendario mensal interativo, insights e streak de pontualidade
- **3 telas, 3 intencoes** — Dashboard (visao geral), Pagamentos (acao), Contas (gestao)
- **Pagamentos** — contas por urgencia (vencidas, hoje, semana, futuras) com tabs, marcar como paga com 1 clique
- **Contas recorrentes** — frequencia semanal/quinzenal/mensal/anual, data de fim opcional, pre-geracao de parcelas (90 dias)
- **Importacao por planilha** — upload de Excel (.xlsx, .xls) ou CSV com preview e validacao visual
- **Cadastro em lote** — tabela editavel para criar varias contas de uma vez
- **Family Link** — compartilhe contas com outra pessoa via link de convite
- **Lembretes D-1** — notificacao automatica 1 dia antes (8h BRT) por email, Telegram e/ou push notification (PWA)
- **Enviar lembrete agora** — botao nas configuracoes para disparar resumo de contas pendentes na hora
- **Bot Telegram** — @pagafacil_bot com /contas, /nova, /pagar, /ajuda
- **Dark mode** — toggle light/dark/system sem flash
- **Lixeira** — contas deletadas ficam recuperaveis por 30 dias
- **PWA com push** — instalavel no celular, push notifications nativas, mobile-first (360px+)
- **UX avancada** — optimistic UI, skeleton loading em todas as paginas, spinners nos botoes de acao, confetti, transicoes, modo compacto, atalhos de teclado, menu hamburguer responsivo no mobile

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router, Server Actions, Server Components) |
| Database | Neon PostgreSQL + Prisma ORM |
| Auth | NextAuth v5 (Google OAuth, Email/Nodemailer, Telegram OTP) |
| UI | Tailwind CSS v4 + shadcn/ui |
| Email | Nodemailer + Gmail SMTP |
| Bot | Telegram Bot API (fetch nativo, zero deps) |
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
# Preencha: DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, NEXTAUTH_URL,
# GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SMTP_USER, SMTP_PASSWORD,
# TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, CRON_SECRET
# NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY

# Rode as migrations
npx prisma migrate dev

# Inicie o dev server
npm run dev
```

O app roda em `http://localhost:3005`.

## Estrutura do projeto

```
app/
  page.tsx                   # Landing page (raiz do dominio)
  (auth)/login/              # Login form (limpo, sem descritivo de features)
  (auth)/login/verify/       # Verificacao magic link
  (dashboard)/
    dashboard/page.tsx       # Dashboard (resumo, graficos, calendario)
    pagamentos/page.tsx      # Pagamentos (por urgencia, marcar paga)
    bills/page.tsx           # Contas (gestao, CRUD)
    bills/new/               # Nova conta
    bills/[id]/edit/         # Editar conta
    bills/import/            # Importar planilha
    bills/batch/             # Cadastro em lote
    bills/trash/             # Lixeira (30 dias)
    family/page.tsx          # Family Link (compartilhar contas)
    onboarding/              # Fluxo primeiro acesso
    settings/                # Configuracoes (Telegram, lembretes)
  api/
    auth/[...nextauth]/      # NextAuth route handlers
    cron/reminders/          # Cron job D-1 lembretes (auth via CRON_SECRET)
    cron/monthly-report/     # Relatorio mensal (auth via CRON_SECRET)
    telegram/webhook/        # Bot Telegram webhook
  invite/family/             # Aceitar convite Family Link
components/                  # Componentes React
lib/                         # Auth, DB, server actions, formatadores
prisma/                      # Schema e migrations
public/                      # PWA assets (manifest, icons, service worker)
docs/                        # PRD, changelog, decisoes, arquitetura
```

## Comandos uteis

```bash
npm run dev              # Dev server
npm run build            # Build de producao
npx prisma studio        # Editor visual do banco
npx prisma migrate dev   # Nova migration
npx vercel deploy --prod # Deploy para Vercel
```

## Seguranca

- Webhook Telegram autenticado via `secret_token`
- OTP com rate limit (max 5 tentativas por codigo, max 3 codigos ativos)
- Tokens de convite familia criptograficamente seguros (`crypto.randomBytes`)
- Sanitizacao HTML em mensagens Telegram
- Cron endpoints protegidos por Bearer token + header Vercel
- Importacao de planilha re-validada server-side
- CSRF protection via `allowedOrigins`
- Veja `docs/specs/CODE_REVIEW_AND_EVOLUTION_GUIDE.md` para o review completo

## Status

MVP Fase 1 — validacao com 10 usuarios em 10 dias. Veja o progresso em [docs/CHANGELOG.md](docs/CHANGELOG.md).

## Licenca

Projeto privado. Todos os direitos reservados.
