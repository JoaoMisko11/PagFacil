# PagaFácil — PRD Fase 1: 10 Clientes (MVP)

**Versão:** 1.0 · Março 2026
**Time:** João + Claude (2 pessoas)
**Prazo:** 10 dias
**Target:** 10 usuários
**Custo Infra:** R$0/mês
**Plataforma:** Web App (PWA)

---

## 01 — Problem Statement

### O Problema

**16.5 milhões de MEIs** e milhões de pessoas físicas no Brasil gerenciam suas contas a pagar com **planilhas, cadernos ou memória**. As soluções existentes são ou **simples demais** (Organizze, Mobills — sem AP real) ou **caras e complexas demais** (Conta Azul R$49,90+, Omie R$49+). Não existe um produto que ofereça gestão profissional de contas a pagar com a simplicidade de um app de finanças pessoais e preço zero.

**Impacto de não resolver:** MEIs perdem prazos de pagamento, pagam multas desnecessárias, não têm visibilidade do fluxo de caixa, e gastam horas por semana em tarefas manuais que poderiam ser automatizadas. 88% dos CNPJs brasileiros (23M de empresas no Simples Nacional) são afetados.

### Personas

**Ana (Primária) — MEI Solo, Freelancer, 32 anos**
- Faturamento R$5K/mês, 10-15 fornecedores. Usa WhatsApp para tudo.
- **Dor:** Perde prazos, gasta 3h/semana em planilha, não sabe quanto vai pagar na semana que vem.

**Mariana (Secundária) — Pessoa Física, 28 anos**
- Gerencia aluguel, assinaturas, contas fixas. Quer mais controle.
- **Dor:** Entrada manual tediosa, esquece contas, visão fragmentada entre apps de banco.

**Carlos (Terciário) — Dono de ME (restaurante), 45 anos**
- R$25K/mês, 30+ fornecedores. Acha Conta Azul caro.
- **Dor:** Reconciliação manual, fluxo de caixa cego, paga R$49,90/mês por features que não usa.

### Hipótese a Validar

Se oferecermos uma **web app gratuita** onde o usuário cadastra contas a pagar, vê um dashboard do que vence, e recebe lembretes, **pelo menos 7 de 10 usuários vão usar por 3 semanas seguidas** e declarar que **não voltam para a planilha**.

---

## 02 — Goals & Non-Goals

### Goals

| # | Goal | Métrica |
|---|------|---------|
| G1 | Validar que a proposta de valor "AP sem planilha" ressoa com MEIs e PFs | 7/10 usuários ativos por 3 semanas |
| G2 | Entregar um MVP funcional em 10 dias (web app responsiva) | App no ar, acessível por link, funcionando em mobile |
| G3 | Coletar feedback qualitativo suficiente para decidir o roadmap da Fase 2 | 10 entrevistas de 15min conduzidas |
| G4 | Aprender quais features os usuários pedem primeiro (scan boleto? Pix? relatório?) | Feature request log com pelo menos 20 entradas |
| G5 | Gerar waitlist orgânica a partir dos 10 primeiros | 30+ pessoas na waitlist via referral |

### Non-Goals (Fase 1)

- **Integração Pix real** — Requer BaaS (Celcoin), contrato, sandbox → Fase 3. Nesta fase: deep link para app do banco.
- **App nativo (iOS/Android)** — React Native/Expo leva 2+ semanas. Web app responsivo atende para 10 usuários.
- **Open Finance / conexão bancária** — Pluggy/Belvo requerem onboarding, custo e compliance → Fase 3.
- **OCR / scan de boleto** — Google Vision API + parser custom → Fase 2. Nesta fase: entrada manual.
- **Monetização** — Cobrar nessa fase mata a validação. Plano pago só na Fase 3 (1K clientes).
- **IA / categorização automática** — Precisa de dados para treinar. Categorias manuais nesta fase → dados → ML na Fase 4.

---

## 03 — User Stories

### Ana (MEI Solo)

**US-01 · P0** — Como MEI freelancer, quero **cadastrar uma conta a pagar** (valor, vencimento, fornecedor, categoria) para que eu **não precise manter uma planilha**.
- Campos: fornecedor (texto livre), valor (R$), vencimento (date picker), categoria (dropdown: fixo, variável, imposto, outro), observações (opcional)
- Salvar em <3 segundos
- Funcionar no celular (responsivo)

**US-02 · P0** — Como MEI, quero **ver todas as contas que vencem esta semana** para que eu **não perca nenhum prazo de pagamento**.
- Dashboard com 3 seções: Vencidas (vermelho), Hoje (amarelo), Próximos 7 dias (azul)
- Cada conta mostra: fornecedor, valor, vencimento, status (paga/pendente)
- Ordenação padrão: vencimento mais próximo primeiro

**US-03 · P0** — Como MEI, quero **marcar uma conta como paga** para que eu **saiba o que já foi resolvido e o que falta**.
- Botão "Marcar como paga" com 1 toque
- Registra data do pagamento (default: hoje)
- Conta some da lista "pendentes" e vai para "pagas"
- Possibilidade de desfazer (undo) por 10 segundos

**US-04 · P0** — Como MEI, quero **ver quanto vou pagar no total esta semana e este mês** para que eu **saiba se meu caixa aguenta**.
- Resumo numérico no topo do dashboard: Total pendente semana | Total pendente mês
- Valor atualiza em tempo real ao marcar como pago

**US-05 · P1** — Como MEI, quero **receber um lembrete por email 1 dia antes do vencimento** para que eu **não esqueça de pagar**.
- Email enviado D-1 às 8h da manhã
- Conteúdo: "Amanhã vence: [Fornecedor] — R$[valor]"
- Link direto para o dashboard

**US-06 · P0** — Como MEI, quero **editar ou deletar uma conta** que cadastrei errado para que eu **mantenha meus dados corretos**.
- Editar qualquer campo da conta
- Deletar com confirmação ("Tem certeza?")
- Histórico de contas deletadas acessível por 30 dias

### Mariana (Pessoa Física)

**US-07 · P1** — Como pessoa física, quero **cadastrar contas recorrentes** (aluguel, Netflix, internet) uma única vez para que **elas apareçam automaticamente todo mês**.
- Checkbox "Essa conta é recorrente" com período (mensal, semanal)
- Auto-cria a próxima ocorrência quando a atual é marcada como paga
- Mostrar badge "recorrente" na lista

**US-08 · P2** — Como pessoa física, quero **ver um calendário mensal** com minhas contas marcadas por dia para que eu **tenha uma visão visual de quando cada conta vence**.
- Visão calendário com dots coloridos nos dias com contas
- Clicar no dia mostra lista das contas
- Vermelho = vencida, verde = paga, azul = pendente

### Todas as Personas

**US-09 · P0** — Login com email + magic link (sem senha).

**US-10 · P0** — Onboarding em 3 passos (nome, email, primeira conta).

### Resumo

| # | Persona | User Story | Prioridade |
|---|---------|-----------|------------|
| US-01 | Ana | Cadastrar conta a pagar | P0 |
| US-02 | Ana | Ver contas que vencem esta semana | P0 |
| US-03 | Ana | Marcar conta como paga | P0 |
| US-04 | Ana | Ver total pendente (semana/mês) | P0 |
| US-05 | Ana | Receber lembrete por email D-1 | P1 |
| US-06 | Ana | Editar ou deletar conta | P0 |
| US-07 | Mariana | Cadastrar conta recorrente | P1 |
| US-08 | Mariana | Ver calendário mensal | P2 |
| US-09 | Todos | Login com magic link | P0 |
| US-10 | Todos | Onboarding em 3 passos | P0 |

---

## 04 — Requirements

### P0 — Must Have (sem isso não é MVP)

| ID | Requirement | Acceptance Criteria | Esforço |
|----|------------|---------------------|---------|
| R-01 | Autenticação de usuário | Magic link por email (sem senha). Sessão dura 30 dias. Logout funcional. | 4h |
| R-02 | CRUD de contas a pagar | Criar, ler, editar, deletar. Campos: fornecedor, valor, vencimento, categoria, status, obs. Validação de campos obrigatórios. | 6h |
| R-03 | Dashboard principal | 3 seções: vencidas, hoje, próximos 7 dias. Total pendente semana + mês. Contadores por status. Responsivo mobile. | 8h |
| R-04 | Marcar como paga | 1 clique. Registra data pagamento. Undo 10s. Atualiza totais em tempo real. | 3h |
| R-05 | Categorias de conta | Dropdown: Fixo, Variável, Imposto, Fornecedor, Assinatura, Outro. Filtro por categoria na listagem. | 2h |
| R-06 | Onboarding flow | 3 passos: nome → email (magic link) → cadastrar primeira conta. Welcome screen com tutorial rápido. | 4h |
| R-07 | Listagem com filtros | Filtrar por: status (paga/pendente/vencida), categoria, período. Busca por nome do fornecedor. | 4h |
| R-08 | Responsividade mobile | Funcionar em telas de 360px+. Touch-friendly (botões 44px+). PWA installable. | 4h |

**Total P0: ~35h de dev** → 4.5 dias a 8h/dia. Cabe nos 10 dias com folga para testes.

### P1 — Nice to Have (se der tempo nos 10 dias)

| ID | Requirement | Acceptance Criteria | Esforço |
|----|------------|---------------------|---------|
| R-09 | Email reminder D-1 | Cron job diário 8h. Email com fornecedor + valor + link. Resend ou Mailgun free tier. | 4h |
| R-10 | Contas recorrentes | Marcar como recorrente (mensal). Auto-gera próxima ao marcar paga. Badge visual. | 4h |
| R-11 | Feedback widget | Botão flutuante "Sugerir feature" que abre formulário simples. Salva no DB. | 2h |
| R-12 | Dark mode | Toggle light/dark. Respeita preferência do sistema. | 2h |

**Total P1: ~12h adicionais.** Email reminder e recorrentes são os mais impactantes.

### P2 — Future (Fase 2 em diante)

- Visão calendário mensal
- Scan de boleto (câmera → OCR)
- Pagamento Pix direto do app
- Conexão bancária via Open Finance
- Relatório mensal com gráficos
- Notificações via WhatsApp
- Categorização por IA

---

## 05 — Tech Stack (10 Day Build)

**Princípio:** Mínimo absoluto para entregar rápido. Zero over-engineering.

### Architecture: Monolith + Hosted DB

| Camada | Escolha | Justificativa |
|--------|---------|--------------|
| Framework | **Next.js 15** (App Router) | Full-stack: API routes (backend) + React (frontend) em um só projeto. Server Actions para mutations. Deploy instantâneo na Vercel. |
| Database | **Neon PostgreSQL** (free tier) | 0.5 GB storage, 1 branch. Serverless — escala a zero. Prisma ORM para type safety. Migration-first. |
| Auth | **NextAuth.js v5** + Resend | Magic link via email (Resend free: 100 emails/dia). Sem senha = sem fricção. Sessão JWT 30 dias. |
| UI | **Tailwind + shadcn/ui** | Componentes prontos, acessíveis, customizáveis. Sem tempo para design system custom nessa fase. |
| Deploy | **Vercel Free** | Push to main = deploy. Preview por PR. Edge functions. Custom domain. SSL automático. |

### Custo Mensal

| Serviço | Tier | Custo |
|---------|------|-------|
| Vercel | Hobby (free) | R$0 |
| Neon | Free (0.5GB) | R$0 |
| Resend | Free (100 emails/dia) | R$0 |
| GitHub | Free | R$0 |
| Domínio (.app) | 1 ano | ~R$70/ano |
| **Total** | | **R$0/mês** |

> **Princípio:** Nesta fase, todo centavo gasto em infra é dinheiro jogado fora. Free tiers de Vercel + Neon + Resend suportam tranquilamente 10-100 usuários. Só gasta quando o crescimento forçar.

### Estrutura do Projeto

```
pagafacil/
├── app/
│   ├── (auth)/ login/ page.tsx
│   ├── (dashboard)/
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── bills/ page.tsx       # Lista de contas
│   │   └── bills/new/ page.tsx   # Nova conta
│   ├── api/ auth/ [...nextauth]/
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
└── package.json
```

---

## 06 — Timeline (10 Dias)

### D1 — Setup & Fundação
- Criar repo GitHub, Next.js 15, Tailwind, shadcn/ui
- Configurar Neon PostgreSQL + Prisma schema (User, Bill, Category)
- Configurar NextAuth.js com magic link (Resend)
- Deploy na Vercel com custom domain
- **Entrega:** App rodando em pagafacil.app com login funcional

### D2 — CRUD de Contas
- Formulário de nova conta (Server Action para criar)
- Listagem de contas com filtros (status, categoria)
- Editar conta existente
- Deletar com confirmação
- **Entrega:** Fluxo completo: criar, ver, editar, deletar contas

### D3 — Dashboard Principal
- Seções: vencidas / hoje / próximos 7 dias
- Cards de resumo: total semana, total mês, qtd contas
- Botão "marcar como paga" com undo
- Ordenação por vencimento
- **Entrega:** Dashboard funcional — core do produto

### D4 — Mobile & Polish
- Responsividade completa (testar em 360px, 390px, 430px)
- PWA manifest + service worker (installable)
- Onboarding flow (3 steps)
- Empty states e loading skeletons
- **Entrega:** App instalável no celular via "Add to Home Screen"

### D5 — Email Reminders + Recorrentes
- Cron job (Vercel Cron) para enviar lembretes D-1
- Template de email bonito com Resend + React Email
- Checkbox "recorrente" + auto-gerar próxima conta
- Widget de feedback (botão flutuante)
- **Entrega:** Lembretes funcionando + recorrências

### D6 — Testes & QA
- Testar todos os fluxos em mobile (iOS Safari, Android Chrome)
- Testar edge cases (conta sem valor, datas passadas, muitas contas)
- Corrigir bugs encontrados
- Performance check (Lighthouse score > 90)
- **Entrega:** App estável e testado para early adopters

### D7 — Onboard 5 Usuários (Grupo A)
- Enviar convites para 5 contatos conhecidos
- Acompanhar onboarding por WhatsApp
- Anotar dúvidas, bugs, frustrações em tempo real
- Hotfix imediato se algo travar
- **Entrega:** 5 usuários usando o app

### D8 — Onboard +5 Usuários (Grupo B) + Fixes
- Recrutar 5 usuários adicionais (comunidades MEI, amigos de amigos)
- Corrigir top 3 issues do Grupo A
- Monitorar uso e engajamento
- **Entrega:** 10 usuários ativos

### D9 — Entrevistas + Analytics
- Entrevistar 5 usuários (15 min cada por WhatsApp)
- Compilar feature requests
- Analisar: quem usa, quanto usa, o que mais usa
- Setup landing page com waitlist (Vercel + form)
- **Entrega:** Dados qualitativos coletados

### D10 — Retrospectiva + Decisão Go/No-Go
- Compilar relatório: retenção, NPS, feature requests
- Decidir: escalar para Fase 2 (100 clientes) ou pivotar
- Priorizar roadmap Fase 2 baseado em dados reais
- Pedir para os 10 indicarem amigos → waitlist
- **Entrega:** Go/No-Go decision + roadmap Fase 2

---

## 07 — Success Metrics

### North Star
- **7/10 usuários ativos na semana 3**

### Leading Indicators (mudam em dias)
- **DAU/WAU:** >50% (pelo menos 5 dos 10 acessam por semana)
- **Contas criadas/user/semana:** >5 (usando ativamente)
- **% marcadas como pagas:** >60% (não só cadastra, resolve)
- **Tempo no app/sessão:** >3 minutos
- **Feature requests recebidos:** >20 (engajamento alto)

### Lagging Indicators (mudam em semanas)
- **Retenção semana 3:** 70%+ (7/10 ainda usando)
- **NPS:** ≥8 (medido por formulário na semana 2)
- **"Não volto para planilha":** 70%+ declaram nas entrevistas
- **Waitlist orgânica:** 30+ pessoas via referral dos 10
- **Churn reason:** Se alguém sair, por quê? (falta feature? bug? não precisa?)

### Critério Go/No-Go para Fase 2

| Sinal | Condição | Ação |
|-------|----------|------|
| 🟢 **GO** | 7/10 ativos na semana 3 + NPS ≥8 + 30 na waitlist + "não volto para planilha" | Escalar para 100 clientes |
| 🟡 **ITERATE** | 4-6/10 ativos. Feedback indica features faltando. | Investir mais 2 semanas em P1 features |
| 🔴 **PIVOT** | <4/10 ativos. Ninguém indica. | O problema não é forte o suficiente ou a solução está errada. Repensar. |

---

## 08 — Open Questions

| Owner | Pergunta | Contexto |
|-------|----------|----------|
| Business | Queremos focar em MEIs ou PFs para os 10 primeiros? | Mix pode diluir aprendizado. Sugestão: 7 MEIs + 3 PFs para comparar comportamentos. |
| Engineering | Usar Next.js App Router ou Pages Router? | App Router tem Server Components/Actions (mais moderno, mas quirks). Pages Router é mais estável. Recomendação: App Router — é o futuro do Next.js. |
| Product | Contas recorrentes devem ser automáticas ou "sugerir + confirmar com 1 clique"? | Auto-criar pode gerar contas indesejadas. "Sugerir + confirmar" pode ser melhor UX. |
| Data | Que analytics usar para trackear uso nos 10 primeiros? | Opções: Vercel Analytics (free, básico), PostHog (free tier, event tracking), ou custom events no DB. Recomendação: PostHog free — dá funnel e session replay. |
| Design | Qual a identidade visual? Cores, logo? | Para MVP: usar azul (#0D47A1) + verde (#00C853) do business plan. Logo simples em texto. Refinamento visual na Fase 2. |
| Business | Registrar domínio pagafacil.app agora ou usar subdomínio gratuito? | pagafacil.vercel.app é free e funciona. Custom domain dá mais credibilidade por ~R$70/ano. |
