# Backlog — PagaFacil

> Centraliza todas as evolucoes, bugs, tech debt e ideias do produto.
> Atualizar conforme feedback dos usuarios e decisoes do time.
> Fonte: CHANGELOG.md, docs/specs/CODE_REVIEW_AND_EVOLUTION_GUIDE.md, docs/specs/UX_AUDIT.md, docs/specs/PagaFacil_PRD_Fase1.md, DECISIONS.md

---

## Seguranca

| # | Item | Origem | Esforco |
|---|------|--------|---------|
| S-01 | Configurar `TELEGRAM_WEBHOOK_SECRET` na Vercel e registrar webhook com secret_token | CHANGELOG D20 | 30min |
| S-02 | Rate limit OTP: aumentar para 8 digitos (alem do max 5 tentativas ja implementado) | CODE_REVIEW S2 | 1-2h |
| S-03 | Middleware valida sessao real (nao so cookie existence) | CODE_REVIEW A6 | 2-3h |
| S-04 | Sanitizacao HTML nas mensagens Telegram com dados de usuario (reforcar) | CODE_REVIEW S9 | 1h |
| S-05 | CSRF protection via Server Actions (Origin header check) | CODE_REVIEW S8 | 1h |
| S-06 | Politica de privacidade e termos de uso | UX_AUDIT TS-2 | 4-6h |

---

## Performance

| # | Item | Origem | Esforco |
|---|------|--------|---------|
| P-01 | Dashboard: consolidar 12+ queries sequenciais em 2-3 queries paralelas | CODE_REVIEW A4/P1 | 4-6h |
| P-02 | Paginacao na lista de contas (/bills) — hoje carrega ALL bills | CODE_REVIEW P2 | 4-6h |
| P-03 | Relatorio mensal cron: corrigir N+1 query pattern | CODE_REVIEW P3 | 2-4h |
| P-04 | Tornar paginas estaticas onde possivel (login, verify, new, batch, import) | CODE_REVIEW P6 | 1h |
| P-05 | Caching cross-request no dashboard (revalidateTag em vez de revalidatePath) | CODE_REVIEW P7/P8 | 6-8h |
| P-06 | Connection pooling no Prisma client | CODE_REVIEW P5 | 1h |
| P-07 | Parse de planilha grande com progress indicator (bloqueia UI hoje) | UX_AUDIT PP-3 | 2-3h |

---

## Arquitetura & Tech Debt

| # | Item | Origem | Esforco |
|---|------|--------|---------|
| TD-01 | Extrair `lib/recurrence.ts` — logica de recorrencia duplicada em 3 lugares | CODE_REVIEW A1 | 4-6h |
| TD-02 | Unificar `formatCurrency` (duplicada em 3 arquivos) | CODE_REVIEW A2 | 1h |
| TD-03 | Dividir `lib/actions.ts` (800+ linhas) em modulos por dominio | CODE_REVIEW A3 | 6-8h |
| TD-04 | Mover estado `/pagar` do Telegram de Map in-memory para DB | CODE_REVIEW A5 | 2-4h |
| TD-05 | Unificar `createBill` e `createBillOnboarding` (90% identicos) | CODE_REVIEW R3 | 2-3h |
| TD-06 | Mecanismo de cleanup de OTPs expirados (tabela cresce sem limite) | CODE_REVIEW R4 | 1-2h |
| TD-07 | Transacao no `/pagar` do Telegram (markAsPaid + recorrencia) | CODE_REVIEW R1 | 2h |
| TD-08 | Retry/dead letter para falhas no cron de lembretes | CODE_REVIEW R2 | 4-6h |

---

## UX & Interface (itens abertos do UX Audit)

| # | Item | Origem | Severidade | Esforco |
|---|------|--------|------------|---------|
| UX-01 | Confirmacao antes de marcar como paga (tap acidental) | UX_AUDIT IX-3 | Importante | 1-2h |
| UX-02 | Onboarding step 2 deveria ter opcao "Pular" | UX_AUDIT IX-7 | Importante | 2h |
| UX-03 | Undo/snackbar ao deletar conta (alem do dialog) | UX_AUDIT IX-8 | Enhancement | 2-3h |
| UX-04 | Valor monetario maior no card mobile | UX_AUDIT VH-2 | Importante | 1h |
| UX-05 | Hierarquia visual nos botoes de acao do bill-card | UX_AUDIT VH-3 | Importante | 2h |
| UX-06 | Substituir emojis HTML entity por icones Lucide na landing | UX_AUDIT VH-4 | Enhancement | 1-2h |
| UX-07 | Logo com identidade propria (nao so letra "P") | UX_AUDIT VH-5 | Enhancement | 4-6h |
| UX-08 | Erro de importacao mais detalhado (nao so "Erro ao importar") | UX_AUDIT EH-6 | Enhancement | 1-2h |
| UX-09 | Indicadores de status alem da cor (icone/padrao, WCAG 1.4.1) | UX_AUDIT A11Y-4 | Importante | 2h |
| UX-10 | Checkboxes com labels acessiveis (batch form, settings) | UX_AUDIT A11Y-2 | Importante | 1h |
| UX-11 | Focus management no onboarding (ao avancar steps) | UX_AUDIT A11Y-5 | Enhancement | 1h |
| UX-12 | Calendario navegavel por teclado | UX_AUDIT A11Y-6 | Enhancement | 3-4h |
| UX-13 | Delete dialog pode cortar em 320px | UX_AUDIT MR-3 | Enhancement | 1h |
| UX-14 | Batch form denso em mobile (muito scroll com 5+ linhas) | UX_AUDIT MR-4 | Enhancement | 2-3h |
| UX-15 | Acentuacao inconsistente ("PagaFacil", "fisicas") | UX_AUDIT CP-2/CP-3 | Enhancement | 15min |
| UX-16 | Icone do feedback widget confuso ("?" generico) | UX_AUDIT CP-4 | Enhancement | 30min |
| UX-17 | Copy "link magico" confunde usuarios nao-tech | UX_AUDIT CP-5 | Enhancement | 30min |
| UX-18 | Indicadores de seguranca/privacidade na landing | UX_AUDIT TS-1/TS-3 | Importante | 2-3h |
| UX-19 | Tooltips/tour pos-onboarding | UX_AUDIT OB-3 | Enhancement | 4-6h |
| UX-20 | Settings mostrar email do usuario logado | UX_AUDIT IA-4 | Enhancement | 1h |
| UX-21 | Breadcrumbs em sub-paginas de /bills | UX_AUDIT IA-3 | Importante | 2-3h |
| UX-22 | Botoes /bills/batch e /bills/import mais acessiveis no mobile | UX_AUDIT IA-2 | Importante | 15min |
| UX-23 | PushToggle no onboarding (step reminders) | CHANGELOG D21 | Enhancement | 1-2h |

---

## Features Novas

| # | Item | Origem | Esforco |
|---|------|--------|---------|
| F-01 | Pagina de historico/contas pagas com totais por periodo | UX_AUDIT IA-5 | 4-6h |
| F-02 | Modelo de planilha para download (template Excel/CSV) | CHANGELOG D12 | 1-2h |
| F-03 | Workspaces multi-usuario (design completo em `docs/specs/PLAN_workspaces.md`) | PLAN_workspaces | 38-50h |
| F-04 | Scan de boleto via camera (OCR — Google Vision API) | PRD Fase1 (P2) | 20-40h |
| F-05 | Informacoes de pagamento na conta (metodo, chave PIX, codigo de barras) + botao copiar | Conversa D23 | 6-8h |
| F-06 | Pagamento Pix direto do app (deep link → BaaS real) | PRD Fase1 (P3) | 40-80h |
| F-07 | Conexao bancaria via Open Finance (Pluggy/Belvo) | PRD Fase1 (P3) | 40-80h |
| F-08 | Notificacoes via WhatsApp (API oficial) | PRD Fase1 (P2) | 20-30h |
| F-09 | Categorizacao automatica por IA (precisa dados historicos) | PRD Fase1 (P4) | 20-40h |
| F-10 | Exportar dados para Excel/CSV | - | 4-6h |
| F-11 | Escolher horario dos lembretes | - | 2-4h |
| F-12 | Resumo semanal por email | - | 4-6h |
| F-13 | App nativo (React Native ou Capacitor) | PRD Fase1 (P2+) | 80-120h |
| F-14 | Monetizacao (tier pago) | PRD Fase1 (P3) | - |

---

## Offline & PWA

| # | Item | Origem | Esforco |
|---|------|--------|---------|
| O-01 | Pagina de fallback offline com mensagem amigavel | Analise PWA | 2-3h |
| O-02 | Cache de dados do dashboard para visualizacao offline | Analise PWA | 4-6h |
| O-03 | Sync queue — salvar acoes offline e enviar quando voltar | Analise PWA | 8-12h |
| O-04 | Caching avancado (Workbox/Serwist ou strategies no SW) | Analise PWA | 4-6h |

---

## Infraestrutura & Deploy

| # | Item | Origem | Esforco |
|---|------|--------|---------|
| I-01 | Deploy na Vercel com dominio pagafacil.work | CHANGELOG D19 | 1-2h |
| I-02 | Testar login Google em producao (redirect URI) | CHANGELOG D10 | 1h |
| I-03 | Registrar comandos no BotFather (menu de comandos) | CHANGELOG D11 | 30min |
| I-04 | Lighthouse score > 90 | CHANGELOG D6-D8 | 4-6h |
| I-05 | Atualizar landing page com destaque das features D14-D16 | CHANGELOG D14-D16 | 2-3h |

---

## Testes & Qualidade

| # | Item | Origem | Esforco |
|---|------|--------|---------|
| T-01 | Suite de testes automatizados (zero testes hoje) | CODE_REVIEW T1 | 30-40h |
| T-02 | Testar dark mode em mobile (iOS Safari, Android Chrome) | CHANGELOG D6-D8 | 2-3h |
| T-03 | Testar fluxo completo Telegram em producao | CHANGELOG D7-D8 | 2-3h |

---

## Observabilidade

| # | Item | Origem | Esforco |
|---|------|--------|---------|
| OB-01 | Bloco 5 do code review: logging, error tracking, metricas | CODE_REVIEW | 8-12h |

---

## Bugs Conhecidos (nao resolvidos)

| # | Item | Origem |
|---|------|--------|
| B-01 | Next.js 16 deprecou `middleware.ts` em favor de `proxy` — funciona mas mostra warning | DECISIONS D1 |
| B-02 | Vercel Cron free tier roda 1x/dia (suficiente para D-1 mas limita) | DECISIONS D4 |
| B-03 | Usuarios Telegram-only recebem email placeholder (`telegram_<chatId>@pagafacil.local`) | DECISIONS D7 |
| B-04 | Estado do `/pagar` e in-memory (nao sobrevive restart serverless) | DECISIONS D11 |

---

## Legenda

- **Origem** — arquivo/secao de onde o item foi extraido
- **Esforco** — estimativa rough em horas (do code review ou UX audit originais)
- Items marcados com ~~risco~~ ja foram resolvidos e removidos deste backlog
- Ao completar um item, mova para o CHANGELOG.md do dia correspondente
