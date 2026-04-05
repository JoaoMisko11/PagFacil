# UX Audit & World-Class Experience Plan — PagaFacil

**Data:** 2026-04-01
**Produto:** PagaFacil — gestao de contas a pagar para MEIs e PFs
**Usuarios primarios:** MEIs e pessoas fisicas brasileiras, baixa-media sofisticacao tecnica, objetivo: sair da planilha e nao esquecer de pagar contas
**Fluxos revisados:** Login, Onboarding, Dashboard, CRUD de contas, Calendario, Importacao/Lote, Configuracoes, Lembretes

---

## STEP 1: UX AUDIT

### 1. Arquitetura de Informacao

| # | Issue | Severidade | Arquivo |
|---|-------|------------|---------|
| IA-1 | **Nav "Config" e ambiguo** — o unico conteudo e configuracao de notificacao/Telegram. O label deveria ser "Notificacoes" ou "Lembretes" para deixar claro o que o usuario vai encontrar. | 🟡 Important | `components/dashboard-nav.tsx:51` |
| IA-2 | **Nao ha como acessar /bills/batch e /bills/import pelo mobile facilmente** — os botoes "+ Lote" e "Importar" ficam inline com "+ Nova Conta" no topo da pagina /bills, mas em telas pequenas (360px) os 3 botoes ficam apertados e os labels truncam. | 🟡 Important | `app/(dashboard)/bills/page.tsx:47-56` |
| IA-3 | **Sem breadcrumbs ou indicacao de profundidade** — ao navegar para /bills/new, /bills/batch, /bills/import, /bills/[id]/edit nao ha como voltar exceto pelo botao do browser ou pelo nav fixo. O usuario perde nocao de onde esta. | 🟡 Important | Todas as sub-paginas de /bills |
| IA-4 | **Settings nao mostra o email do usuario** — para usuarios com login via email, nao ha indicacao visual de qual email esta cadastrado nem como alterar. | 🟢 Enhancement | `app/(dashboard)/settings/page.tsx` |
| IA-5 | **Falta pagina de historico/contas pagas** — o filtro "Pagas" existe, mas nao ha uma view dedicada com totais pagos por periodo, o que seria util para controle financeiro. | 🟢 Enhancement | N/A |

### 2. Design de Interacao

| # | Issue | Severidade | Arquivo |
|---|-------|------------|---------|
| IX-1 | **`alert()` nativo no erro de login Telegram** — `alert("Codigo invalido ou expirado")` e uma experiencia terrivel, especialmente no mobile. Deveria ser inline error ou toast. | 🔴 Critical | `components/login-form.tsx:57` |
| IX-2 | **Nenhum feedback apos marcar como paga** — o `handleTogglePaid()` nao exibe toast/feedback. O card simplesmente muda de opacidade, o que pode ser imperceptivel. O usuario nao sabe se a acao funcionou. | 🔴 Critical | `components/bill-card.tsx:56-62` |
| IX-3 | **Sem confirmacao ao marcar como paga** — diferente do "deletar" (que tem Dialog), marcar como paga nao pede confirmacao. Se o usuario tocar sem querer, precisa apertar "Desfazer" — mas nao ha indicacao obvia de que isso e possivel. | 🟡 Important | `components/bill-card.tsx:101-108` |
| IX-4 | **Drag-and-drop de planilha nao funciona** — o texto diz "Arraste sua planilha" mas nao ha `onDragOver`/`onDrop` handlers. E so um `<input type="file">` com texto enganoso. | 🟡 Important | `components/import-bills.tsx:52-56` |
| IX-5 | **Busca nao tem indicacao de loading** — a busca por fornecedor tem debounce de 300ms e faz server-side navigation, mas nao mostra spinner/skeleton. O usuario digita e espera sem feedback. | 🟡 Important | `components/bill-filters.tsx:40-46` |
| IX-6 | **Formulario de nova conta nao tem botao "Cancelar"** — o BillForm so tem "Salvar conta". Para voltar, o usuario precisa usar o browser back ou a nav. | 🟡 Important | `components/bill-form.tsx:184-188` |
| IX-7 | **Onboarding step 2 (primeira conta) e obrigatorio** — se o usuario quer so explorar o app antes de cadastrar, nao pode pular. Nao ha "Pular" ou "Depois". | 🟡 Important | `components/onboarding-steps.tsx:69-168` |
| IX-8 | **Nenhum undo/snackbar pattern** — ao deletar uma conta (soft delete), nao ha snackbar com "Desfazer" (padrao Material/Nubank). So o dialog antes. | 🟢 Enhancement | `components/bill-card.tsx:64-67` |
| IX-9 | **Calendario: click em dia sem conta nao faz nada util** — mostra "Nenhuma conta neste dia" mas poderia oferecer um link rapido para criar conta naquele dia. | 🟢 Enhancement | `components/bill-calendar.tsx:147-149` |

### 3. Hierarquia Visual & Clareza

| # | Issue | Severidade | Arquivo |
|---|-------|------------|---------|
| VH-1 | **Dashboard summary cards sao identicos visualmente** — "Pendente semana", "Pendente 30 dias", "Vencidas", "Vencem hoje" tem o mesmo peso visual. As cards de urgencia (vencidas, hoje) deveriam ter destaque forte (background colorido, icone). | 🟡 Important | `app/(dashboard)/page.tsx:95-140` |
| VH-2 | **Valor monetario no card de conta e pequeno demais no mobile** — `text-base` em mobile para o valor mais importante da conta. Deveria ser maior que o nome do fornecedor. | 🟡 Important | `components/bill-card.tsx:95-97` |
| VH-3 | **Botoes de acao do bill-card confundem** — "Paga", "Editar", "Deletar" sao todos `variant="ghost"` com emojis. Nao ha hierarquia. O CTA principal (marcar como paga) deveria ter mais destaque. | 🟡 Important | `components/bill-card.tsx:100-123` |
| VH-4 | **Landing page usa HTML entities para emojis** (`&#128203;`, `&#128197;`) — renderizam como emojis genericos do OS. Inconsistente e sem personalidade. Icons SVG (Lucide) seriam mais profissionais e consistentes cross-platform. | 🟢 Enhancement | `app/(auth)/login/page.tsx:28-51` |
| VH-5 | **Logo e apenas a letra "P" num quadrado** — funcional mas generico. Nao transmite identidade/confianca como logos de fintechs de referencia. | 🟢 Enhancement | `components/dashboard-nav.tsx:24-26` |

### 4. Tratamento de Erros & Edge Cases

| # | Issue | Severidade | Arquivo |
|---|-------|------------|---------|
| EH-1 | **Nenhum error.tsx em nenhuma rota** — se um Server Component crashar (ex: Neon fora do ar), o usuario ve a pagina de erro generica do Next.js, sem branding nem orientacao. | 🔴 Critical | N/A — arquivos ausentes |
| EH-2 | **Nenhum loading.tsx em nenhuma rota** — navegacoes server-side (dashboard, bills list) nao mostram loading state. Em conexoes lentas ou com DB lento, a pagina simplesmente congela. | 🔴 Critical | N/A — arquivos ausentes |
| EH-3 | **`session!.user!.id` com non-null assertion** — se a sessao for invalida apesar do middleware, vai crashar com erro de runtime nao tratado. | 🟡 Important | `app/(dashboard)/page.tsx:13`, `app/(dashboard)/bills/page.tsx:18` |
| EH-4 | **BillCard handleTogglePaid/handleDelete sem try-catch** — se a server action falhar (rede, DB), nao ha tratamento. O usuario nao recebe feedback de erro. | 🟡 Important | `components/bill-card.tsx:56-67` |
| EH-5 | **Pagina de verificacao de email estatica** — nao tem timer, nao linka para reenvio, nao mostra qual email foi enviado. | 🟡 Important | `app/(auth)/login/verify/page.tsx` |
| EH-6 | **Import: erro generico "Erro ao importar"** — nao detalha o que falhou (permissao? limite? DB?). | 🟢 Enhancement | `components/import-bills.tsx:35` |

### 5. Acessibilidade

| # | Issue | Severidade | Arquivo |
|---|-------|------------|---------|
| A11Y-1 | **`userScalable: false` no viewport** — impede zoom em mobile, violacao WCAG 1.4.4. Usuarios com baixa visao nao conseguem ampliar. | 🔴 Critical | `app/layout.tsx:36` |
| A11Y-2 | **Checkboxes nativos sem estilizacao acessivel** — `<input type="checkbox">` sem label visivel associado em batch-bill-form (coluna "Recorrente") e settings-form. Leitores de tela nao entendem o contexto. | 🟡 Important | `components/batch-bill-form.tsx:179-183`, `components/settings-form.tsx` |
| A11Y-3 | **Botao de remover linha no batch form usa `&times;`** — sem aria-label, leitor de tela le "times" ou nada. | 🟡 Important | `components/batch-bill-form.tsx:190-198` |
| A11Y-4 | **Cores de status sem indicador alem da cor** — "Vencida" (vermelho), "Pendente" (outline), "Paga" (verde) sao diferenciados apenas por cor. Precisa de icone ou padrao alem da cor (WCAG 1.4.1). | 🟡 Important | `components/bill-card.tsx:40-44` |
| A11Y-5 | **Focus management no onboarding** — ao avancar do step 1 para step 2, o foco nao move para o novo formulario. | 🟢 Enhancement | `components/onboarding-steps.tsx` |
| A11Y-6 | **Calendario nao e navegavel por teclado de forma significativa** — os dots de contas nao sao interativos via teclado, so via click. | 🟢 Enhancement | `components/bill-calendar.tsx` |

### 6. Percepcao de Performance

| # | Issue | Severidade | Arquivo |
|---|-------|------------|---------|
| PP-1 | **Zero skeleton screens apesar de ter o componente** — `components/ui/skeleton.tsx` existe mas nao e usado em nenhum lugar. Server Components renderizam blank ate o dado estar pronto. | 🔴 Critical | Todas as paginas server-rendered |
| PP-2 | **Dashboard faz 2 queries separadas (pendingBills + allBills)** — sem streaming/Suspense, ambas bloqueiam a renderizacao. O usuario espera tudo carregar para ver qualquer coisa. | 🟡 Important | `app/(dashboard)/page.tsx:28-53` |
| PP-3 | **Importacao de planilha grande bloqueia a UI** — parse com SheetJS acontece na server action, mas nao ha progress indicator. Para planilhas de 500 linhas, pode demorar segundos. | 🟡 Important | `components/import-bills.tsx:102-103` |
| PP-4 | **Sem optimistic UI ao marcar como paga** — `markBillAsPaid` faz round-trip completo ao server. O card deveria mudar instantaneamente e reverter se falhar. | 🟡 Important | `components/bill-card.tsx:56-62` |

### 7. Responsividade Mobile

| # | Issue | Severidade | Arquivo |
|---|-------|------------|---------|
| MR-1 | **Tabela de preview de importacao nao e usavel em mobile** — tabela horizontal com 7 colunas em 360px. Sem scroll indicator, texto trunca. | 🟡 Important | `components/import-bills.tsx:126-167` |
| MR-2 | **Botoes da pagina /bills apertados em mobile** — "Lote", "Importar" e "+ Nova Conta" em flex row sem wrap. | 🟡 Important | `app/(dashboard)/bills/page.tsx:46-56` |
| MR-3 | **Dialog de delete pode ficar cortado** — `mx-4 max-w-[calc(100vw-2rem)]` e defensivo mas o DialogFooter com 2 botoes lado a lado pode ficar apertado em 320px. | 🟢 Enhancement | `components/bill-card.tsx:125` |
| MR-4 | **Batch form em mobile e funcional mas denso** — cada linha vira um card com 6 campos empilhados. Em 5+ linhas, fica muito scroll. | 🟢 Enhancement | `components/batch-bill-form.tsx:110-231` |

### 8. Copy & Microcopy

| # | Issue | Severidade | Arquivo |
|---|-------|------------|---------|
| CP-1 | **"Essa acao pode ser desfeita em ate 30 dias"** — no dialog de delete. Excelente copy, transmite seguranca. Mas nao ha mecanismo visivel para o usuario desfazer (nao ha tela de "lixeira"). | 🟡 Important | `components/bill-card.tsx:130-131` |
| CP-2 | **Acentuacao inconsistente** — footer usa "PagaFacil" (sem acento), titulo usa "PagaFacil" (sem acento em HTML entity). O nome real e "PagaFacil" com acento. | 🟢 Enhancement | `app/(auth)/login/page.tsx:66` |
| CP-3 | **"Feito para MEIs e pessoas fisicas que querem sair da planilha"** — bom copy mas usa "fisicas" sem acento. | 🟢 Enhancement | `app/(auth)/login/page.tsx:59` |
| CP-4 | **Botao "? " no feedback widget** — o icone e um "?" generico. Nao e claro se e ajuda, feedback, ou suporte. Poderia ser um icone de megafone ou chat. | 🟢 Enhancement | `components/feedback-widget.tsx:38` |
| CP-5 | **"Enviar link de acesso"** — bom copy para magic link. Mas "link magico" no subtitle pode confundir usuarios nao-tech. Sugestao: "Voce recebera um link para entrar — sem precisar decorar senha." | 🟢 Enhancement | `components/login-form.tsx:129-131` |

### 9. Sinais de Confianca & Seguranca

| # | Issue | Severidade | Arquivo |
|---|-------|------------|---------|
| TS-1 | **Nenhum indicador de que os dados sao seguros** — nao ha texto sobre criptografia, privacidade, ou que os dados nao sao compartilhados. Para um app financeiro, isso e critico para conversao. | 🟡 Important | `app/(auth)/login/page.tsx` |
| TS-2 | **Footer minimalista demais** — "100% gratuito, sem cartao de credito" e bom, mas falta link para politica de privacidade e termos de uso. | 🟡 Important | `app/(auth)/login/page.tsx:65-67` |
| TS-3 | **Sem HTTPS badge/lock indicator** na landing (confianca implicita no browser, mas um texto "Seus dados protegidos com criptografia" ajudaria). | 🟢 Enhancement | `app/(auth)/login/page.tsx` |

### 10. Onboarding & Empty States

| # | Issue | Severidade | Arquivo |
|---|-------|------------|---------|
| OB-1 | **Empty state do dashboard nao guia o usuario** — "Tudo em dia!" com "+ Nova Conta" e bom, mas nao sugere os diferentes metodos de cadastro (unitario, lote, importacao). | 🟡 Important | `app/(dashboard)/page.tsx:187-200` |
| OB-2 | **Onboarding nao menciona lembretes/Telegram** — o usuario descobre essas features so se explorar o "Config". Deveria ter um step 3 ou um banner pos-onboarding. | 🟡 Important | `components/onboarding-steps.tsx` |
| OB-3 | **Sem tour/tooltips pos-onboarding** — apos cadastrar a primeira conta, o usuario cai no dashboard sem orientacao sobre calendario, filtros, ou configuracoes. | 🟢 Enhancement | N/A |
| OB-4 | **Import page empty state e informativo** — mostra formato esperado da planilha, o que e muito bom. | ✅ Positivo | `components/import-bills.tsx:75-100` |

---

## STEP 2: BENCHMARK COMPETITIVO

### PagaFacil vs. Referencia (Nubank, Mercury, Brex, Stripe Dashboard)

| Dimensao | PagaFacil Hoje | Best-in-Class | Gap |
|----------|---------------|---------------|-----|
| **Loading states** | Zero — paginas congelam | Nubank: shimmer skeletons em tudo; Stripe: skeleton + streaming | 🔴 Grande |
| **Error recovery** | alert() e paginas em branco | Mercury: inline errors contextuais + retry; Nubank: tela de erro branded com "tentar novamente" | 🔴 Grande |
| **Optimistic UI** | Nenhum — round-trip para tudo | Nubank: toggle instantaneo em favoritos/pagamentos; Stripe: optimistic table updates | 🟡 Medio |
| **Empty states** | Texto basico + 1 CTA | Stripe: ilustracao + multiplos CTAs + docs links; Mercury: animacao sutil + guided first action | 🟡 Medio |
| **Onboarding** | 2 steps (nome + 1a conta) | Nubank: progressive disclosure ao longo de dias; Brex: checklist persistente ate completar 5 acoes | 🟡 Medio |
| **Micro-interacoes** | Nenhuma (sem animacoes) | Nubank: haptic feedback + animacoes suaves; Mercury: transicoes entre estados | 🟡 Medio |
| **Data visualization** | Calendario com dots + 4 summary cards | Stripe: graficos de tendencia; Mercury: cashflow timeline; Nubank: graficos interativos | 🟡 Medio |
| **Acessibilidade** | Basica (labels, aria em 3 elementos) | Stripe: WCAG AA completo, keyboard nav, screen reader tested | 🟡 Medio |
| **Copy & Microcopy** | Bom — linguagem simples em PT-BR | Nubank: copy premiado, micro-momentos de humor; Mercury: copy conciso e confiante | 🟢 Pequeno |
| **Trust signals** | "100% gratuito, sem cartao" | Nubank: certificacoes, garantias, seguro; Mercury: FDIC badges, SOC2 | 🟡 Medio |
| **Multi-channel** | Email + Telegram (recem-implementado ambos) | Nubank: push + email + SMS; Brex: push + Slack + email | 🟢 Pequeno |
| **Mobile experience** | Responsivo, mobile-first, PWA | Nubank: app nativo, biometria; Stripe: responsive dashboard bem polido | 🟢 Pequeno |

### Maiores gaps vs. concorrencia:
1. **Performance perception** — zero loading/skeleton states e a maior lacuna vs. qualquer fintech seria
2. **Error handling** — nenhum error boundary branded
3. **Optimistic UI** — interacoes se sentem lentas sem feedback instantaneo
4. **Data insights** — falta visualizacao de tendencias/historico

---

## STEP 3: PLANO WORLD-CLASS EXPERIENCE

### FASE 1 — Quick Wins (1-2 sprints, alto impacto)

| # | O que mudar | Por que importa | Impacto | Esforco |
|---|------------|-----------------|---------|---------|
| QW-1 | **Adicionar loading.tsx em (dashboard)/ e bills/** com skeleton screens | Elimina a sensacao de "app travou". Maior impacto percebido com menor esforco. | 🔴 Alto | 2-3h |
| QW-2 | **Adicionar error.tsx em (dashboard)/ com branding** | Evita pagina branca no erro. Mostra "Algo deu errado" com botao "Tentar novamente". | 🔴 Alto | 1-2h |
| QW-3 | **Remover `userScalable: false`** do viewport | Conformidade WCAG basica. Uma linha. | 🔴 Alto | 5min |
| QW-4 | **Substituir `alert()` por erro inline** no login Telegram | Elimina UX nativa feia. | 🔴 Alto | 30min |
| QW-5 | **Toast de sucesso ao marcar conta como paga** | "Conta marcada como paga!" com "Desfazer" no toast. Feedback imediato para a acao mais frequente. | 🔴 Alto | 1h |
| QW-6 | **Wrap botoes da /bills em mobile** | `flex-wrap gap-2` para os 3 botoes nao truncarem em 360px. | 🟡 Medio | 15min |
| QW-7 | **Renomear "Config" para "Lembretes"** na nav | Clareza de onde o usuario vai encontrar a configuracao. | 🟡 Medio | 5min |
| QW-8 | **Adicionar botao "Cancelar" / "Voltar" no BillForm** | Link de volta para /bills. Evita usuario preso. | 🟡 Medio | 15min |
| QW-9 | **Adicionar aria-label no botao de remover linha** do batch form | Acessibilidade basica para screen readers. | 🟡 Medio | 5min |
| QW-10 | **Texto de confianca na landing page** | Adicionar "Seus dados protegidos. Nao compartilhamos com terceiros." abaixo do login. | 🟡 Medio | 15min |

**Total estimado Fase 1: ~1-2 dias de dev**

---

### FASE 2 — Foundation (1-2 meses, melhorias estruturais)

| # | O que mudar | Por que importa | Impacto | Esforco |
|---|------------|-----------------|---------|---------|
| FD-1 | **Optimistic UI ao marcar como paga** | Card muda instantaneamente, reverte se server action falhar. Interacao se sente 10x mais rapida. | 🔴 Alto | 4-6h |
| FD-2 | **Suspense boundaries + streaming no Dashboard** | Mostrar summary cards primeiro, calendario depois, contas por ultimo. Progressive rendering. | 🔴 Alto | 6-8h |
| FD-3 | **Error boundaries com retry em todas as server actions** | try-catch em handleTogglePaid, handleDelete etc. Toast de erro com "Tentar novamente". | 🔴 Alto | 3-4h |
| FD-4 | **Onboarding step 3: configurar lembretes** | Apos cadastrar 1a conta, mostrar "Quer receber lembrete 1 dia antes? Configure Email ou Telegram." Aumenta adocao de reminders. | 🟡 Medio | 4-6h |
| FD-5 | **Pagina de "Lixeira" / contas deletadas** | Cumprir a promessa do copy "pode ser desfeita em 30 dias". Acessivel via Settings ou filtro. | 🟡 Medio | 4-6h |
| FD-6 | **Melhorar hierarchy visual dos summary cards** | Cards de "Vencidas" e "Vencem hoje" com background colorido, icone, e animacao sutil quando count > 0. | 🟡 Medio | 3-4h |
| FD-7 | **Search com loading indicator** | Spinner inline no input durante debounce + server navigation. | 🟡 Medio | 1-2h |
| FD-8 | **Melhorar pagina /login/verify** | Mostrar qual email foi enviado, countdown para reenvio, link para reenviar, indicacao de checar spam. | 🟡 Medio | 2-3h |
| FD-9 | **Drag-and-drop real na importacao** | Se o texto promete "arraste", implementar o drop zone com visual feedback. Ou remover o texto. | 🟡 Medio | 2-3h |
| FD-10 | **Tabela de importacao responsiva** | Em mobile, transformar tabela em cards empilhados (padrao Stripe). | 🟡 Medio | 3-4h |

**Total estimado Fase 2: ~35-45h de dev**

---

### FASE 3 — Diferenciacao (2-4 meses, alem do padrao)

| # | O que mudar | Por que importa | Impacto | Esforco |
|---|------------|-----------------|---------|---------|
| DF-1 | **Dashboard com grafico de tendencia** | Linha de "total pago" e "total pendente" nos ultimos 3-6 meses. Da visao de saude financeira ao longo do tempo. Diferencial vs. planilha. | 🔴 Alto | 8-12h |
| DF-2 | **Smart reminders: "Voce costuma pagar X no dia Y"** | Baseado em historico de contas recorrentes, sugerir autopreenchimento ou alertar padrao de atraso. | 🟡 Medio | 12-16h |
| DF-3 | **Quick actions no calendario** | Clicar num dia vazio → "Criar conta para este dia" pre-preenchido. Clicar em conta do dia → popup com "Marcar como paga" sem sair do calendario. | 🟡 Medio | 6-8h |
| DF-4 | **Checklist de onboarding persistente** | Estilo Brex: "3 de 5 completos" — configurar lembretes, cadastrar 3 contas, marcar 1 como paga, convidar (futuro). Fica no dashboard ate completar. | 🟡 Medio | 8-10h |
| DF-5 | **Relatorio mensal por email** | "Seu resumo de marco: 12 contas pagas, R$ 3.450 total, 0 atrasos". Aumenta retencao e engajamento. | 🟡 Medio | 6-8h |
| DF-6 | **Categorias com icones e cores** | Cada categoria (Fixo, Imposto, Assinatura...) com icone e cor propria. Torna a lista visualmente escaneavel. | 🟢 Baixo | 3-4h |
| DF-7 | **Atalhos de teclado** | `n` = nova conta, `p` = marcar como paga (selecionada), `/` = buscar. Power user feature. | 🟢 Baixo | 4-6h |

**Total estimado Fase 3: ~50-65h de dev**

---

### FASE 4 — Delight (ongoing, micro-interacoes & personalizacao)

| # | O que mudar | Por que importa | Impacto |
|---|------------|-----------------|---------|
| DL-1 | **Animacao de "confetti" ao zerar contas pendentes** | Momento de celebracao quando o usuario paga a ultima conta. Cria emotional connection (padrao Nubank). | 🟢 Delight |
| DL-2 | **Transicoes suaves entre paginas** | Fade/slide nas transicoes server-side. Sensacao de app nativo. | 🟢 Delight |
| DL-3 | **Saudacao contextual no dashboard** | "Bom dia, Ana!" / "Boa noite!" baseado na hora. "Sexta-feira, ultimas contas da semana!" baseado no dia. | 🟢 Delight |
| DL-4 | **Streak de pontualidade** | "5 contas pagas em dia esse mes! Continue assim!" Badge motivacional. Gamificacao leve. | 🟢 Delight |
| DL-5 | **Haptic feedback no PWA** | `navigator.vibrate()` sutil ao marcar como paga. Sensacao tatil. | 🟢 Delight |
| DL-6 | **Easter egg no empty state** | Se o usuario paga todas as contas do mes, mostrar ilustracao celebrativa diferente a cada mes. | 🟢 Delight |
| DL-7 | **Modo compacto vs. confortavel** | Toggle para lista densa (mais contas visiveis) vs. cards com mais espaco. Power users querem densidade. | 🟢 Delight |

---

## STEP 4: PRINCIPIOS DE DESIGN

### 7 Principios para guiar decisoes de UX no PagaFacil

#### 1. **Feedback Imediato, Sempre**
> Toda acao do usuario deve ter resposta visual em menos de 100ms. Loading? Skeleton. Salvou? Toast. Erro? Mensagem inline. Nunca silencie.

*Aplica-se a:* toggles de status, submissoes de formulario, navegacao, importacao.

#### 2. **Confianca Antes de Conversao**
> Para um app financeiro, a sensacao de seguranca vem antes da feature. Cada tela deve responder implicitamente: "meus dados estao seguros aqui?"

*Aplica-se a:* landing page, onboarding, tratamento de dados, comunicacao de erros.

#### 3. **Mobile e o Ambiente Principal**
> A maioria dos MEIs vai acessar pelo celular entre um cliente e outro. Cada feature deve ser desenhada primeiro para 360px com polegar. Desktop e bonus.

*Aplica-se a:* touch targets (min 44px ja implementado), formularios, tabelas, navegacao.

#### 4. **Guie, Nao Presuma**
> O usuario nao vai explorar menus. Mostre o proximo passo natural: apos cadastrar, mostre o lembrete. Apos marcar como paga, sugira a proxima vencida. Progressive disclosure > menus escondidos.

*Aplica-se a:* onboarding, empty states, pos-acao flows, descoberta de features.

#### 5. **Erro e Parte do Fluxo**
> Erros nao sao excecoes — sao caminhos esperados. Trate-os com a mesma qualidade do happy path. Mensagens de erro devem dizer: o que aconteceu, por que, e o que fazer agora.

*Aplica-se a:* validacao de formularios, falhas de rede, estados inesperados, server errors.

#### 6. **Menos Cliques, Mais Contexto**
> O usuario deve poder completar a acao mais frequente (marcar como paga) com o minimo de fricao possivel. Cada clique adicional e uma oportunidade de abandono.

*Aplica-se a:* acoes primarias, navegacao, filtros, atalhos.

#### 7. **Celebre o Progresso**
> Pagar contas e uma tarefa chata. O app pode tornar isso recompensador. Celebre marcos: todas pagas, sequencia em dia, primeira conta cadastrada. Transforme obrigacao em conquista.

*Aplica-se a:* empty states positivos, notificacoes de streak, micro-animacoes.

---

## RESUMO DE PRIORIDADES

### Top 10 acoes de maior impacto (ordenadas por ROI):

1. ~~QW-3~~ Remover `userScalable: false` (5min, WCAG critico)
2. **QW-1** Adicionar loading.tsx com skeletons (2-3h, elimina "app travou")
3. **QW-2** Adicionar error.tsx branded (1-2h, elimina pagina branca)
4. **QW-4** Substituir alert() por erro inline (30min, elimina UX nativa)
5. **QW-5** Toast ao marcar como paga (1h, feedback da acao mais frequente)
6. **FD-1** Optimistic UI no toggle paga (4-6h, app se sente instantaneo)
7. **FD-2** Suspense + streaming no dashboard (6-8h, progressive rendering)
8. **FD-4** Onboarding step 3: lembretes (4-6h, aumenta adocao)
9. **DF-1** Grafico de tendencia no dashboard (8-12h, diferencial vs. planilha)
10. **FD-3** Error boundaries com retry (3-4h, resiliencia)

---

*Documento gerado em 2026-04-01. Revisao recomendada apos cada fase de implementacao.*
