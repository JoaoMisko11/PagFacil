# Decisões Técnicas — PagaFácil

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
