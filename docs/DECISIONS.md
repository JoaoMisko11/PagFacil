# Decisões Técnicas — PagaFácil

## D27 - 2026-04-28 — Open Finance via Pluggy
- **Pluggy (não Belvo, não certificação direta):** Pluggy é aggregator brasileiro com sandbox gratuito, REST API simples e cobertura ampla de bancos PT-BR. Belvo tem foco LATAM mais distribuído. Certificação OPF direta com BCB exige meses e equipe de compliance — fora de escopo para MVP.
- **Pluggy Connect via CDN, não npm:** Usamos `<script src="cdn.pluggy.ai/web-connect/v2/...">` para evitar adicionar dependência. Carregado lazy via `next/script`.
- **Cache do apiKey em memória (não Redis):** Pluggy apiKey tem TTL de 2h. Cache module-level com expiry de 110min. Em serverless, cada cold start re-autentica — barato (~50ms) e simples. Se o volume crescer, migrar para storage compartilhado.
- **`pluggyAccountId/pluggyTransactionId @unique` para idempotência:** Sync chama `upsert` — pode ser executado múltiplas vezes pelo webhook + cron sem duplicar.
- **Apenas CHECKING/SAVINGS/CREDIT:** Investimentos, empréstimos e outros tipos retornados pela Pluggy são ignorados. Para o caso de uso (detecção de pagamentos), saldo de investimento não é relevante.
- **Histórico inicial: 30 dias na conexão, 7 dias no cron:** Suficiente para cruzar com bills pendentes/recém-pagas. Mais que isso aumenta DB sem benefício direto.
- **`matchedBillId @unique` no schema:** Uma bill pode ter no máximo uma transação match. Simplifica modelagem (1:1) — caso real de pagamentos parciais é raro neste contexto.
- **Score threshold 80 (auto) / 50 (sugere):** Calibrado para ser conservador no auto-match. Valor exato + data próxima + supplier no description = ~85+ tipicamente. Difícil dar falso positivo ≥80 porque exige overlap nas três dimensões.
- **Sync + match na mesma operação:** Após inserir transações novas, rodamos `matchTransactionsForUser` no mesmo fluxo. Reduz latência percebida — usuário conecta, dá refresh, já vê os matches.
- **Webhook + cron como redundância:** Pluggy webhook é primário (real-time). Cron diário às 9h UTC é fallback caso o webhook falhe. Idempotência do upsert garante que rodar 2x não duplica nada.
- **URL do webhook como secret de fato:** Pluggy gera webhook URL única se configurado. Validamos `PLUGGY_WEBHOOK_SECRET` opcionalmente — se ausente, aceita (modo dev). Em produção, configurar.
- **Lógica de marcar pago duplicada em bank-sync e bank-actions:** A geração de parcelas recorrentes ao auto-marcar/confirmar match repete o que `markBillAsPaid` faz. Aceitável duplicar — extrair pra `lib/bill-helpers.ts` é refactor sem benefício imediato.

## D24 - 2026-04-07
- **PostHog para analytics (não Vercel Analytics):** Vercel Analytics é mais simples (zero config) mas limitado — 2.500 custom events/mês no free tier, sem funis, sem retenção, sem tracking por usuário. PostHog tem 1M eventos/mês grátis, funis, cohorts, session replay, feature flags. Mais complexo, mas o João quer aprender a ferramenta. Para 10 usuários na validação o free tier é mais que suficiente. Se a complexidade virar problema, simplificar para Vercel Analytics é trivial (trocar provider).

## D21 - 2026-04-04
- **Web Push via `web-push` (não Firebase/OneSignal):** Lib padrão W3C Push API, zero vendor lock-in, ~50KB. Firebase exige SDK pesado e conta Google Cloud. OneSignal é SaaS com limites no free tier. `web-push` é a implementação direta do protocolo.
- **PushSubscription como modelo separado (não campo no User):** Um usuário pode ter múltiplas subscriptions (celular + desktop + tablets). Modelo separado com `endpoint` unique permite gerenciar cada device independentemente.
- **`notifyVia` gerenciado automaticamente pelo toggle (não pelo form):** Ao ativar push, o `savePushSubscription` adiciona "push" ao `notifyVia`. Ao desativar, `removePushSubscription` remove. Evita inconsistência entre ter subscriptions no DB mas "push" não estar no `notifyVia`.
- **Auto-cleanup de subscriptions expiradas (410/404):** Quando o browser revoga a subscription, o push endpoint retorna 410 Gone. O cron deleta essas subscriptions automaticamente para não acumular lixo.
- **VAPID keys (não GCM):** VAPID é o padrão moderno, funciona em todos os browsers que suportam Push API. GCM é legado Google-only.

## D20 - 2026-04-04
- **Webhook secret_token (não IP whitelist):** Telegram envia o header `X-Telegram-Bot-Api-Secret-Token` em cada request quando configurado no `setWebhook`. Mais confiável que IP whitelist (IPs do Telegram mudam). Verificação condicional — funciona sem secret em dev.
- **OTP max attempts no model (não rate limit por IP):** Rate limit por IP é frágil em serverless (sem estado entre invocações). O campo `attempts` no DB é durável e funciona independente da instância. Limite de 5 tentativas × 3 OTPs = 15 tentativas a cada 10min, tornando brute-force de 6 dígitos impraticável.
- **Remoção do `allowDangerousEmailAccountLinking`:** O flag era um atalho conveniente mas inseguro. Com 2 usuários o risco era baixo, mas como o repo é público, melhor fechar antes de escalar. Tratamento do erro na UI é simples e não bloqueia o fluxo.
- **`crypto.randomBytes(32)` para invite tokens (não UUID):** UUIDs v4 são aleatórios mas têm 122 bits de entropia. `randomBytes(32)` tem 256 bits — overkill para o caso mas sem custo extra.
- **Cron: `x-vercel-cron` check condicional (`process.env.VERCEL`):** Permite testar crons localmente com `curl -H "Authorization: Bearer ..."` sem precisar do header Vercel, mas bloqueia chamadas externas em produção.
- **Re-validação server-side no `importBills`:** O client envia rows pré-validadas para mostrar preview, mas o server não pode confiar no flag `valid`. Re-validar é redundante mas fecha um vetor de data injection.

## D16 - 2026-04-01
- **Confetti CSS puro (sem canvas-confetti):** 30 `<span>` com `@keyframes` em vez de lib Canvas. Zero dependências, ~60 linhas. Suficiente para efeito celebratório — não é um jogo, é um momento de delight.
- **Saudação via Intl.DateTimeFormat (sem date-fns):** `toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })` resolve timezone no server sem dependência extra. Roda a cada request (página é dinâmica de qualquer forma).
- **Streak calculado client-side filter:** Prisma não suporta comparação campo-a-campo (`paidAt <= dueDate`). Para MVP com poucos bills/mês, fetch + filter em JS é pragmático e evita raw SQL.
- **DisplayMode via React Context + localStorage:** Mesmo padrão do ThemeToggle existente. Sem DB/cookie — preferência puramente visual, aceitável perder entre dispositivos.
- **Evento customizado para confetti:** `window.dispatchEvent(new Event("pagafacil:all-paid"))` evita prop drilling entre BillCard e ConfettiCelebration. Listener no layout, desacoplado.
- **Page transitions via usePathname + rAF:** Funciona para navegações client-side (Link). Hard refresh renderiza direto sem transição — aceitável. Evita dependência de framer-motion (~30KB).

## D15 - 2026-04-01
- **Gráfico SVG puro (sem recharts/chart.js):** Para manter zero dependências extras (~200KB economizados). Line chart simples com 6 pontos não justifica lib. SVG é server-renderable e funciona em qualquer browser.
- **Smart insights via queries simples (sem ML):** Agrupa contas recorrentes pagas por fornecedor e calcula dia médio. Pragmático para MVP — insights baseados em padrões óbvios são mais úteis que predições complexas com dados insuficientes.
- **Relatório mensal como cron separado:** Endpoint `/api/cron/monthly-report` roda no dia 1 às 12h UTC. Separado do reminder diário para isolamento de falhas e facilidade de debug.
- **Checklist de onboarding server-side (sem DB extra):** Status calculado on-the-fly via queries existentes (count bills, check notifyVia). Dismissível via state local (reaparece em nova sessão se não completou). Evita schema change para algo temporário.
- **Atalhos de teclado com event delegation:** Um listener global no layout que ignora inputs/textareas. Simples e sem dependência.

## D14 - 2026-04-01
- **useOptimistic + useTransition para toggle de status:** Alternativa ao optimistic update manual com useState. useOptimistic é integrado com React 19 e reverte automaticamente quando a transition termina. useTransition previne double-clicks e mantém o estado consistente.
- **React.cache para deduplicar queries no Suspense:** Com 3 Suspense boundaries no dashboard, SummaryCards e BillsSection precisam dos mesmos pendingBills. React.cache deduplica a query dentro do mesmo request sem precisar de estado global.
- **Lixeira com soft delete existente (30 dias):** O copy já prometia "pode ser desfeita em 30 dias". Implementamos a page /bills/trash que filtra deletedAt >= 30 dias atrás. Sem purge automático por ora (aceitável para MVP).
- **Drag-and-drop com counter pattern:** dragCounter evita flickering quando o mouse passa sobre filhos do dropzone. Auto-submit via requestSubmit() ao soltar arquivo elimina clique extra.
- **Tabela mobile via hidden/sm:block:** Duas renderizações (cards mobile + tabela desktop) em vez de tabela responsiva complexa. Mais código mas zero CSS hack, e cada layout é otimizado para seu contexto.

## D12 - 2026-03-31
- **xlsx (SheetJS) para parse de planilhas:** Biblioteca madura (~500KB), suporta .xlsx, .xls e .csv sem depender de APIs externas. O parse roda no server action, sem expor dados no client.
- **Upload + preview (não Google Drive API):** Integração com Google Drive exigiria OAuth separado, file picker e permissões complexas. Para MVP, o usuário baixa do Drive e faz upload — mesmo resultado com fração da complexidade.
- **Mapeamento flexível de colunas:** Headers são encontrados por substring match (ex: coluna "Fornecedor/Supplier" ou "Nome" → fornecedor). Categorias aceitam variações e abreviações. Reduz erros de formatação do usuário.
- **createMany em vez de loop de creates:** Uma única query INSERT para todas as contas válidas — mais rápido e usa uma única transação implícita. Limite de 500 linhas por importação para evitar timeouts no serverless.
- **Cadastro em lote como tabela editável (não modal/wizard):** Página dedicada `/bills/batch` com grid de inputs. Mais intuitivo que um wizard multi-step e não precisa de estado complexo. Linhas vazias são ignoradas automaticamente. Limite de 100 contas por vez (mais que suficiente para uso manual).

## D11 - 2026-03-31
- **Comandos do bot no webhook (não lib separada):** Toda a lógica dos comandos `/contas`, `/nova`, `/pagar` fica no handler do webhook. Como são poucos comandos e o código é linear, não justifica criar uma abstração de "command router" separada.
- **`/nova` em formato inline (não conversacional):** Em vez de um fluxo multi-step (pergunta fornecedor, depois valor, etc.), o comando recebe tudo em uma linha: `/nova Enel 150,00 15/04/2026 FIXO`. Mais rápido para o usuário e sem necessidade de estado entre mensagens.
- **Estado do `/pagar` em Map in-memory:** O fluxo de seleção do `/pagar` precisa guardar a lista de contas por 5 minutos. Usamos um `Map` em memória. No serverless, cada request pode cair em instância diferente, mas na prática o Vercel mantém a instância quente por alguns minutos. Se falhar, o usuário só precisa digitar `/pagar` de novo — aceitável para MVP.
- **Parse de argumentos do `/nova` de trás pra frente:** O nome do fornecedor pode ter espaços (ex: "Conta de Luz"), então extraímos categoria, data e valor do final e o restante vira o supplier.

## D10 - 2026-03-30
- **"Pendente mês" → "Pendente 30 dias" (rolling window):** No fim do mês (ex: 30/mar), "semana" ia até 6/abr mas "mês" só até 31/mar — contas de abril apareciam na semana mas não no mês, confundindo o usuário. Rolling 30 dias garante que mês >= semana sempre.
- **Totalizadores no calendário:** Ao navegar entre meses no calendário, o usuário agora vê o total pendente e pago daquele mês. Informação útil sem precisar sair da visão calendário.

## D9 - 2026-03-30
- **Google OAuth + Nodemailer em vez de Resend:** Resend free tier só envia para o email do dono da conta, impossibilitando onboarding dos 10 usuários. Google OAuth é o login mais simples (sem senha), e Nodemailer com Gmail SMTP (app password) substitui Resend para magic links e lembretes — limite de ~500 emails/dia grátis, suficiente para MVP.
- **Remoção do pacote resend:** Com Nodemailer cobrindo magic links (via NextAuth provider) e lembretes (via `transporter.sendMail`), o pacote `resend` foi removido. Menos uma dependência externa.

## D8 - 2026-03-30
- **Calendário no dashboard (não em página separada):** Usuário pediu visão calendário inline no dashboard para não precisar navegar. Componente client (`BillCalendar`) renderizado entre os cards de resumo e as seções de contas.
- **Query separada para calendário:** O calendário mostra todas as contas (pendentes + pagas), diferente do dashboard que só mostra pendentes. Query com `select` enxuto para performance.
- **Dots via CSS pseudo-elements:** Em vez de customizar o componente DayButton do shadcn Calendar, usamos `modifiersClassNames` do react-day-picker + `::after` pseudo-elements. Mais simples e sem conflito com estilos do shadcn.

## D7 - 2026-03-29
- **Telegram em vez de WhatsApp:** WhatsApp Cloud API exige Meta Business Account (verificação 2-7 dias), templates aprovados para cada mensagem, e setup complexo. Telegram Bot API é instantâneo (BotFather), grátis sem limites, e sem aprovação de templates. Arquitetura igual — se futuramente quiser WhatsApp, só troca o `sendTelegramMessage` por `sendWhatsAppMessage`.
- **OTP em vez de magic link para Telegram:** No celular, clicar um link no Telegram abriria o browser, quebrando o fluxo. Um código de 6 dígitos é mais natural no mobile — o usuário copia e cola. TTL de 10 minutos.
- **Credentials provider no NextAuth:** NextAuth v5 não tem provider nativo para Telegram. Adicionamos um Credentials provider (`telegram-otp`) que valida OTP no banco. Funciona com JWT strategy sem problemas.
- **Placeholder email para usuários Telegram-only:** O campo `email` é `@unique` e required no schema. Em vez de torná-lo opcional (breaking change em todo o app), criamos `telegram_<chatId>@pagafacil.local`. Simples e sem risco.
- **Webhook em vez de polling:** O bot usa webhook (POST para `/api/telegram/webhook`) em vez de long polling. Mais eficiente na Vercel (serverless), sem processo permanente.
- **`notifyVia` como string, não enum:** Usar string (`"email"` | `"telegram"`) em vez de enum Prisma evita migration extra se adicionarmos WhatsApp depois. Default `"email"` mantém retrocompatibilidade.

## D5 - 2026-03-29
- **setMonth fix sem date-fns:** Em vez de instalar dependência, fix manual com `new Date(year, month+1, day)` + check de overflow. Simples e sem deps extras.
- **CATEGORIES em lib/constants.ts:** Arquivos `"use server"` não podem exportar objetos (Next.js restrição). Movido para arquivo separado importado pelos componentes.
- **Dark mode sem next-themes:** Implementado com script inline no `<head>` para evitar FOUC, toggle cycle (light→dark→system), e localStorage. Sem dependência externa.
- **Nav cores semânticas:** Trocadas cores hardcoded (#00A868, #20252A, etc.) por classes Tailwind (bg-card, text-foreground, etc.) para compatibilidade com dark mode.

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
