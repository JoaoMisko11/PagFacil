# Code Review & Evolution Guide — PagaFacil

> **Reviewer:** Principal Engineer (automated)
> **Date:** 2026-04-04
> **Scope:** Full codebase review — security, architecture, reliability, performance, testing, DX, observability
> **Codebase state:** D19 — MVP in validation phase with ~19 days of development

---

## PHASE 1: CODE REVIEW

---

### 1. SECURITY

#### 🔴 CRITICAL — S1: Telegram webhook has no authentication

**File:** `app/api/telegram/webhook/route.ts:325`
**Problem:** The POST handler accepts any request without verifying the `X-Telegram-Bot-Api-Secret-Token` header. Anyone who discovers the webhook URL can impersonate Telegram and execute commands (create bills, mark as paid, list user data).
**Impact:** Full account takeover for any Telegram-linked user. An attacker sends `{"message":{"chat":{"id":"VICTIM_CHAT_ID"},"text":"/contas"}}` and gets back all their bills.
**Fix:**
1. When registering the webhook with Telegram, pass a `secret_token` parameter.
2. In the POST handler, verify `request.headers.get("X-Telegram-Bot-Api-Secret-Token") === process.env.TELEGRAM_WEBHOOK_SECRET`.
3. Return 403 if it doesn't match.

#### 🔴 CRITICAL — S2: OTP brute-force has no rate limiting

**File:** `lib/auth.ts:41-56` (Credentials authorize) + `lib/actions.ts:742-795` (sendTelegramOtp)
**Problem:** There's no rate limit on OTP attempts. A 6-digit numeric OTP has 900,000 possible values. An attacker can enumerate all codes within minutes. The OTP isn't invalidated after failed attempts.
**Impact:** Account takeover. Attacker sends OTP request for a known chatId, then brute-forces the code.
**Fix:**
1. Add a max attempts counter (e.g., 5 attempts per OTP). After 5 failures, invalidate the OTP.
2. Add IP-based rate limiting on the `/api/auth/callback/telegram-otp` route (e.g., 10 attempts per minute per IP).
3. Consider increasing OTP length to 8 digits.

#### 🔴 CRITICAL — S3: `allowDangerousEmailAccountLinking: true` enables account takeover

**File:** `lib/auth.ts:13`
**Problem:** This flag allows any Google OAuth login to link to an existing account by email match. If a user signed up via magic link with `user@gmail.com`, anyone with a Google account for that email auto-links. More critically, if a Telegram user later gets their placeholder email changed, the linking logic could create conflicts.
**Impact:** Account takeover in edge cases where email ownership isn't verified.
**Fix:** Remove `allowDangerousEmailAccountLinking: true` and handle the "OAuthAccountNotLinked" error in the UI, guiding users to sign in with their original method first, then link accounts explicitly.

#### 🔴 CRITICAL — S4: Family invite token is predictable (cuid)

**File:** `prisma/schema.prisma:34` — `token String @unique @default(cuid())`
**Problem:** CUIDs are partially time-based and monotonically increasing. An attacker who sees one invite token can predict nearby tokens. This gives access to other families' shared bills.
**Impact:** Unauthorized access to other users' financial data.
**Fix:** Replace with `@default(uuid())` or better, generate a `crypto.randomBytes(32).toString('hex')` in the `createFamilyInvite` action instead of relying on Prisma's default.

#### 🔴 CRITICAL — S5: Family invite URL is vulnerable to open redirect

**File:** `app/invite/family/page.tsx:29`
**Problem:** `redirect(\`/login?callbackUrl=/invite/family?token=${token}\`)` — the `token` comes from user-controlled query params and is interpolated directly into the redirect URL. While Next.js middleware does some protection, the `callbackUrl` is passed to NextAuth which may redirect to it post-login.
**Impact:** If an attacker crafts a URL with a malicious callbackUrl, the user could be redirected to an external phishing site after authentication.
**Fix:** Encode the callbackUrl properly: `encodeURIComponent(\`/invite/family?token=${token}\`)`. Also validate that callbackUrl is a relative path in the auth callback.

#### 🟡 MAJOR — S6: Cron endpoints only check Bearer token, no IP restriction

**File:** `app/api/cron/reminders/route.ts:17-20`, `app/api/cron/monthly-report/route.ts:20-24`
**Problem:** The `CRON_SECRET` is the only protection. If it leaks (logs, env dump, error message), anyone can trigger reminder/report emails for all users.
**Impact:** Spam/phishing emails to all users, data leakage (bill amounts in emails).
**Fix:** Add Vercel's recommended check: `request.headers.get("x-vercel-cron") === "true"` in addition to the Bearer token, restricting invocation to Vercel's cron infrastructure.

#### 🟡 MAJOR — S7: `importBills` accepts client-provided rows without re-validation

**File:** `lib/actions.ts:603-631`
**Problem:** `importBills(rows: ImportBillRow[])` is a server action that takes pre-parsed rows from the client. The client could modify `rows` after `parseSpreadsheet` returns, injecting arbitrary data. The function re-parses amounts/dates but trusts `r.valid`, `r.supplier`, and `r.category` from the client.
**Impact:** Data injection — user can bypass validation by submitting rows with `valid: true` and arbitrary supplier/category values.
**Fix:** Re-validate all rows server-side in `importBills`. Don't trust the `valid` flag — re-run the same validation logic.

#### 🟡 MAJOR — S8: No CSRF protection on Server Actions invoked from client

**File:** `lib/actions.ts` (all server actions)
**Problem:** Next.js Server Actions have built-in CSRF protection via the `Origin` header check, but only when running behind the default Next.js server. If deployed behind a custom proxy that strips Origin headers, protection is lost.
**Impact:** Low risk currently (Vercel deployment handles this), but becomes a risk if deployment changes.
**Fix:** Ensure `serverActions.allowedOrigins` is set in `next.config.ts` to explicitly whitelist `pagafacil.work`.

#### 🟡 MAJOR — S9: No input sanitization on Telegram messages (HTML injection)

**File:** `app/api/telegram/webhook/route.ts:144` (supplier from user input)
**Problem:** The `supplier` name from `/nova` is directly embedded in HTML-formatted Telegram messages (`parse_mode: "HTML"`). If a user creates a bill with supplier `<b>XSS</b>` or `<a href="evil.com">Click</a>`, it renders as HTML in Telegram.
**Impact:** Social engineering via crafted bill names visible to family members or in reminder notifications.
**Fix:** Escape HTML entities in supplier names before embedding in Telegram messages. Create a `escapeHtml()` utility.

#### 🟢 MINOR — S10: `next-auth` beta dependency

**File:** `package.json:24` — `"next-auth": "^5.0.0-beta.30"`
**Problem:** Beta software in production auth layer. Could have unpatched vulnerabilities.
**Fix:** Monitor for stable release and upgrade promptly. Pin the exact version instead of `^`.

---

### 2. ARCHITECTURE

#### 🟡 MAJOR — A1: Duplicated recurrence logic in 3 places

**Files:**
- `lib/actions.ts:49-75` — `computeNextDueDate()`
- `app/api/telegram/webhook/route.ts:249-277` — inline switch/case
- `lib/actions.ts:257-305` — `markBillAsPaid` recurrence generation

**Problem:** The "compute next due date" logic is implemented three separate times with slight variations. The webhook version is a manual copy-paste of the actions version. Any bug fix must be applied in 3 places.
**Impact:** Inconsistent behavior between web and Telegram. The webhook `/pagar` doesn't use `generateFutureDates` at all — it only creates one next bill instead of pre-generating 90 days ahead.
**Fix:** Extract `computeNextDueDate` and `generateFutureDates` into `lib/recurrence.ts` and import everywhere.

#### 🟡 MAJOR — A2: `formatCurrency` duplicated 3 times

**Files:**
- `lib/format.ts:1-6`
- `app/api/cron/monthly-report/route.ts:15-17`
- `app/api/telegram/webhook/route.ts:19-21`

**Problem:** Two additional copies of the currency formatter exist in API routes that can't import from `lib/format.ts` (which is fine — they're server-only). But the implementations differ slightly (one uses `Intl.NumberFormat`, others use manual `.toFixed(2).replace`).
**Fix:** Consolidate into one shared utility. All three files run server-side, so a single import should work.

#### 🟡 MAJOR — A3: 800+ line `actions.ts` monolith

**File:** `lib/actions.ts` — 861 lines
**Problem:** All server actions (bills CRUD, import, batch, Telegram OTP, notification preferences) live in one file. This makes it hard to navigate, increases merge conflicts, and couples unrelated features.
**Fix:** Split into:
- `lib/actions/bills.ts` — CRUD, mark paid/pending
- `lib/actions/import.ts` — spreadsheet parsing, batch import
- `lib/actions/auth.ts` — Telegram OTP
- `lib/actions/settings.ts` — notification preferences
- Re-export all from `lib/actions/index.ts` for backward compatibility.

#### 🟡 MAJOR — A4: Dashboard page makes 12+ sequential DB queries

**File:** `app/(dashboard)/dashboard/page.tsx`
**Problem:** The dashboard renders 6 Suspense boundaries, each making 1-4 DB queries. `TrendSection` alone makes **12 sequential queries** (2 per month x 6 months in a loop). Even with Suspense streaming, this creates a waterfall of DB round trips.
**Impact:** Slow dashboard load times, especially on cold starts. Each Prisma query has ~5-20ms latency to Neon, so 12 queries = 60-240ms just for the chart.
**Fix:**
1. Batch the TrendSection queries: fetch all bills for the 6-month range in a single query, then aggregate in JS.
2. Use `Promise.all` for independent queries within each section.
3. Consider a materialized view or pre-computed monthly aggregates if data grows.

#### 🟡 MAJOR — A5: In-memory Map for Telegram `/pagar` sessions

**File:** `app/api/telegram/webhook/route.ts:8`
**Problem:** `paySessionMap` is a module-level `Map`. In serverless (Vercel), each invocation may run in a different instance. The Map is lost between cold starts, and concurrent requests may hit different instances.
**Impact:** `/pagar` selection often fails silently — user types a number but the session is gone. Documented as a known bug but unresolved.
**Fix:** For MVP: store the session in the DB (a `TelegramSession` table or reuse `TelegramOtp` with a type field). For production: use Vercel KV or Upstash Redis.

#### 🟡 MAJOR — A6: Middleware only checks cookie existence, not validity

**File:** `middleware.ts:30-33`
**Problem:** The middleware checks if a session cookie *exists* but never validates it. An expired, revoked, or forged cookie will pass the middleware check, and the user sees the dashboard layout briefly before the Server Component's `auth()` call redirects them.
**Impact:** Flash of authenticated content for unauthenticated users. Not a security hole (data comes from Server Components that validate properly), but a UX issue.
**Fix:** Document this as a known limitation. To properly fix, would need JWT validation in Edge Runtime (feasible with `jose` library).

#### 🟢 MINOR — A7: `"use server"` on entire actions.ts file

**File:** `lib/actions.ts:1`
**Problem:** The `"use server"` directive at the top marks ALL exports as server actions, including types (`ActionState`, `ImportBillRow`, etc.) and helper functions. Only actual mutation functions should be server actions.
**Fix:** Remove the top-level `"use server"` and add it individually to each exported async function that should be a server action. Or split types into a separate `lib/types.ts`.

---

### 3. RELIABILITY

#### 🟡 MAJOR — R1: Telegram webhook `/pagar` doesn't use a transaction

**File:** `app/api/telegram/webhook/route.ts:243-296`
**Problem:** `markBillAsPaid` (web) uses `db.$transaction` for recurring bills, but the webhook handler does separate `db.bill.update` + `db.bill.create` without a transaction. If the create fails, the bill is marked paid without generating the next installment.
**Impact:** Lost recurring bills — user pays but next month's bill never appears.
**Fix:** Wrap the webhook's pay logic in `db.$transaction([ ... ])` matching the web behavior. Better yet, call the shared `markBillAsPaid` action directly.

#### 🟡 MAJOR — R2: No retry or dead letter for cron email/Telegram failures

**File:** `app/api/cron/reminders/route.ts:86-115`
**Problem:** If `sendTelegramMessage` or `transporter.sendMail` fails for a user, it's logged and skipped. No retry, no tracking of which users missed reminders.
**Impact:** Users miss bill reminders silently. The cron returns `{ sent: 5 }` but 3 of 8 users may have failed.
**Fix:** For MVP: return failed user IDs in the response and set up Vercel alerts on partial failures. For production: add a `ReminderLog` table and retry logic.

#### 🟡 MAJOR — R3: `createBill` and `createBillOnboarding` are 90% identical

**File:** `lib/actions.ts:114-170` vs `lib/actions.ts:398-454`
**Problem:** `createBillOnboarding` duplicates `createBill` with a different redirect target. If validation logic changes, both must be updated.
**Impact:** Drift between the two paths — bugs get fixed in one but not the other.
**Fix:** Extract shared bill creation logic into `createBillInternal()`, then call it from both public actions with different redirect targets.

#### 🟡 MAJOR — R4: No OTP cleanup mechanism (unbounded table growth)

**File:** `lib/actions.ts:752-759` (deleteMany on sendTelegramOtp)
**Problem:** OTPs are cleaned up only when a new OTP is requested for the same chatId. If a user requests an OTP and never logs in again, the row stays forever. There's no scheduled cleanup.
**Impact:** `TelegramOtp` table grows unboundedly.
**Fix:** Add cleanup to the cron job, or add a DB-level TTL mechanism. Simplest: add `await db.telegramOtp.deleteMany({ where: { expires: { lt: new Date() } } })` to the daily cron.

#### 🟢 MINOR — R5: `assertBillAccess` returns the bill but callers re-query

**File:** `lib/actions.ts:106-112`
**Problem:** `assertBillAccess` fetches the bill to check access, then `markBillAsPaid` fetches it again. Two queries where one suffices.
**Fix:** Return the bill from `assertBillAccess` and use the returned object (already partially done in `markBillAsPaid` but not in other callers).

#### 🟢 MINOR — R6: JWT callback queries DB on every request

**File:** `lib/auth.ts:95-101`
**Problem:** Every JWT callback (every authenticated request) queries `db.user.findUnique` to refresh the user's name. This adds a DB round trip to every page load.
**Impact:** Unnecessary latency on every request. For the current user count it's fine, but doesn't scale.
**Fix:** Only refresh the name periodically (e.g., if `token.iat` is older than 5 minutes). Or remove the refresh entirely — the name is set during onboarding and rarely changes.

---

### 4. PERFORMANCE

#### 🟡 MAJOR — P1: TrendSection makes 12 sequential DB queries

**File:** `app/(dashboard)/dashboard/page.tsx:293-335`
**Problem:** A `for` loop with `i` from 5 to 0 makes two `db.bill.aggregate` calls per iteration, sequentially.
**Impact:** ~120-240ms of DB latency just for the chart on cold requests.
**Fix:**
```ts
// Replace the loop with a single query:
const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
const allBills = await db.bill.findMany({
  where: { userId: { in: userIds }, deletedAt: null, dueDate: { gte: sixMonthsAgo } },
  select: { amount: true, status: true, dueDate: true },
})
// Then group/aggregate in JS
```

#### 🟡 MAJOR — P2: Bills page fetches ALL bills with no pagination

**File:** `app/(dashboard)/bills/page.tsx:61-64`
**Problem:** `db.bill.findMany` with no `take` limit fetches every bill for the user (including all generated recurring bills). With the 90-day pre-generation, a user with 10 recurring weekly bills has 10 * 13 = 130 bills.
**Impact:** Degrades with time. After a year of use, queries could return thousands of rows.
**Fix:** Add pagination. For the grouped view, consider fetching only the aggregate/first-pending per recurring group using a more targeted query.

#### 🟡 MAJOR — P3: Monthly report cron has N+1 query pattern

**File:** `app/api/cron/monthly-report/route.ts:49-76`
**Problem:** Fetches all users, then for EACH user makes 3 queries (paid, pending, overdue). With 100 users = 300+ queries.
**Impact:** Cron timeout on Vercel free tier (10s limit for Hobby plan).
**Fix:** Use a single aggregation query grouped by userId, or batch users and use `Promise.all` with concurrency control.

#### 🟢 MINOR — P4: `getAllBills` cache fetches more data than needed

**File:** `app/(dashboard)/dashboard/page.tsx:25-39`
**Problem:** `getAllBills` is cached via `React.cache` but fetches ALL bills (no date range filter). The calendar only renders one month at a time.
**Impact:** Transfers more data than necessary as bill count grows.
**Fix:** Consider filtering to a reasonable window (e.g., current month +/- 1 month).

#### 🟡 MAJOR — P6: 5 pages dynamically rendered without reason

**Files:**
- `app/(auth)/login/page.tsx` — checks `auth()` but just renders static form
- `app/(auth)/login/verify/page.tsx` — zero DB queries, pure static content
- `app/(dashboard)/bills/new/page.tsx` — zero DB queries, just renders form
- `app/(dashboard)/bills/batch/page.tsx` — zero DB queries
- `app/(dashboard)/bills/import/page.tsx` — zero DB queries

**Problem:** These pages have no dynamic data but are server-rendered on every request. Login page calls `auth()` only to redirect authenticated users (middleware already handles this).
**Impact:** Unnecessary server compute on every page load. Slower TTFB.
**Fix:** Add `export const dynamic = 'force-static'` to pages with zero queries. For login page, rely on middleware redirect and mark static.

#### 🟡 MAJOR — P7: Dashboard hot path has zero cross-request caching

**File:** `app/(dashboard)/dashboard/page.tsx`
**Problem:** The dashboard makes 16-20 DB queries per render. Only `getFamilyUserIds` uses `unstable_cache` (60s). The remaining queries — TrendSection (12 aggregates), InsightsSection (2 queries), PunctualityStreak (1 query), ChecklistSection (4 queries) — hit the DB fresh every time.
**Impact:** Every dashboard visit = 16+ DB round trips. With Neon latency (~5-20ms each), that's 80-320ms of pure DB wait.
**Fix:** Apply `unstable_cache` with appropriate TTLs:
- TrendSection: `revalidate: 3600` (1h) — historical data barely changes
- InsightsSection: `revalidate: 1800` (30min) — patterns don't shift fast
- PunctualityStreak: `revalidate: 3600` (1h)
- ChecklistSection: `revalidate: 300` (5min)
Use `revalidateTag("bills")` in all bill-mutating actions to invalidate on writes.

#### 🟡 MAJOR — P8: All invalidation uses `revalidatePath` instead of `revalidateTag`

**File:** `lib/actions.ts` (all actions), `lib/family-actions.ts`
**Problem:** Every mutation calls `revalidatePath("/bills")`, `revalidatePath("/")`, etc. This invalidates the **entire page cache**, including sections whose data didn't change. With `unstable_cache` and tags, you could invalidate only the specific cached query that changed.
**Impact:** Makes any future caching strategy less effective — adding cache without fixing invalidation is pointless.
**Fix:** 
1. Tag all `unstable_cache` calls: `tags: ["bills"]`, `tags: ["family"]`, `tags: ["user"]`
2. In actions, replace `revalidatePath` with `revalidateTag("bills")` for bill mutations
3. Keep `revalidatePath` only for navigation-related invalidation where needed

#### 🟢 MINOR — P5: No connection pooling configuration

**File:** `lib/db.ts`
**Problem:** PrismaClient is instantiated with default connection pool settings. On Vercel serverless, each function instance creates its own pool. Neon free tier has a connection limit.
**Impact:** "Too many connections" errors under concurrent load.
**Fix:** Use Neon's pooler URL (already in `DATABASE_URL` if using pooled connection string) and set `connection_limit=1` in the Prisma datasource URL for serverless.

---

### 5. TESTING

#### 🔴 CRITICAL — T1: Zero automated tests

**Problem:** The entire codebase has zero unit, integration, or end-to-end tests. Per CLAUDE.md, this is intentional for the MVP phase ("Não crie testes unitários ainda").
**Impact:** Every deployment is a manual QA exercise. Regressions are caught by users.
**Fix (post-MVP):**
1. **Critical path e2e**: Login flow, create bill, mark as paid, recurring generation — using Playwright.
2. **Server action unit tests**: `createBill`, `markBillAsPaid`, `importBills` — using Vitest + Prisma test client.
3. **Cron route tests**: Mock nodemailer/Telegram, verify correct users get notified.

---

### 6. DEVELOPER EXPERIENCE

#### 🟡 MAJOR — DX1: No TypeScript strict errors for Prisma types

**Problem:** Several places cast Prisma enums as string literals (`as "FIXO" | "VARIAVEL" | ...`), bypassing type safety. The `Category` and `BillStatus` types from `@prisma/client` should be used directly.
**Impact:** Adding a new category requires finding all hardcoded enum arrays.
**Fix:** Import and use Prisma generated types. Replace `VALID_CATEGORIES` array with `Object.values(Category)` from `@prisma/client`.

#### 🟡 MAJOR — DX2: No `.env.example` in repository

**Problem:** CLAUDE.md mentions `.env.example` but also notes it's in `.gitignore`. New developers can't see what environment variables are needed.
**Impact:** Onboarding friction — new dev has to read CLAUDE.md to discover 8+ required env vars.
**Fix:** Either commit `.env.example` (with empty values) or add a `SETUP.md` with the full list.

#### 🟢 MINOR — DX3: `prisma` is in `dependencies` instead of `devDependencies`

**File:** `package.json:29`
**Problem:** The `prisma` CLI package is a dev tool but listed in production dependencies, increasing deployment bundle size.
**Fix:** Move to `devDependencies`. The `postinstall` script and build command will still work.

#### 🟢 MINOR — DX4: Inconsistent Portuguese/English in code

**Problem:** Some variable names are in Portuguese (`otpState`, `chatId`), component names mix (`BillCalendar`, `PagamentosTabs`), and comments switch languages. CLAUDE.md says "componentes em português para nomes de domínio... código e variáveis em inglês" but this isn't consistently followed.
**Fix:** Audit and align naming. Not urgent, but clean up during refactors.

---

### 7. OBSERVABILITY

#### 🟡 MAJOR — O1: No structured logging

**Problem:** All logging is `console.error()` with unstructured strings. No log levels, no request IDs, no user context.
**Impact:** Can't correlate errors across requests, can't set up alerts on specific error types, can't track error rates.
**Fix:** Use Vercel's built-in logging or add a minimal structured logger. At minimum, include userId and operation name in error logs.

#### 🟡 MAJOR — O2: No health check endpoint

**Problem:** No `/api/health` endpoint to verify the app is running and can reach the database.
**Impact:** Can't set up uptime monitoring or database connectivity alerts.
**Fix:** Add `app/api/health/route.ts` that does a `SELECT 1` against the DB and returns 200 or 503.

#### 🟡 MAJOR — O3: No error tracking (Sentry, etc.)

**Problem:** Errors are caught and logged to console, which disappears in serverless. No persistent error tracking.
**Impact:** Bugs in production go unnoticed until users report them.
**Fix:** Add Sentry free tier (5K events/month). Next.js has first-class Sentry support with `@sentry/nextjs`.

#### 🟢 MINOR — O4: Cron job success/failure not tracked

**Problem:** Cron returns `{ sent: N }` but there's no way to know if it ran, how many failures occurred, or if it timed out.
**Fix:** Log structured output that Vercel can alert on. Consider a simple `CronLog` table or use Vercel's cron monitoring.

---

## PHASE 2: EVOLUTION GUIDE

---

### Executive Summary

PagaFacil is an impressive MVP built in 19 days — feature-rich, mobile-responsive, with Telegram integration, family sharing, bulk import, and a polished UX. The code is clean, pragmatic, and well-documented. However, the rapid pace introduced **security vulnerabilities that must be fixed before any wider rollout**: the unauthenticated Telegram webhook, brute-forceable OTPs, and predictable invite tokens could lead to data breaches. The biggest opportunity is that the feature set is already compelling — fixing security and adding basic observability would make this production-ready for a real user base.

---

### Prioritized Initiatives

| # | Title | Category | Reach | Impact | Confidence | Effort | RICE | Dependencies |
|---|-------|----------|-------|--------|------------|--------|------|-------------|
| 1 | Authenticate Telegram webhook (S1) | Security | 10 | 10 | 10 | 1 | 1000 | None |
| 2 | Rate-limit OTP + max attempts (S2) | Security | 10 | 10 | 10 | 2 | 500 | None |
| 3 | Secure family invite tokens (S4) | Security | 8 | 9 | 10 | 1 | 720 | None |
| 4 | Fix `importBills` server-side validation (S7) | Security | 6 | 8 | 10 | 2 | 240 | None |
| 5 | Remove `allowDangerousEmailAccountLinking` (S3) | Security | 8 | 8 | 8 | 3 | 171 | UX for account linking flow |
| 6 | Escape HTML in Telegram messages (S9) | Security | 7 | 6 | 10 | 1 | 420 | None |
| 7 | Add health check + error tracking (O2, O3) | Observability | 10 | 7 | 9 | 3 | 210 | None |
| 8 | Fix TrendSection N+1 queries (P1) | Performance | 10 | 6 | 9 | 2 | 270 | None |
| 9 | Extract shared recurrence logic (A1) | Architecture | 8 | 6 | 10 | 2 | 240 | None |
| 10 | Add pagination to bills page (P2) | Performance | 8 | 5 | 9 | 3 | 120 | None |
| 11 | Webhook transaction for `/pagar` (R1) | Reliability | 5 | 7 | 10 | 1 | 350 | Shared recurrence logic (#9) |
| 12 | Split `actions.ts` monolith (A3) | Architecture | 10 | 4 | 10 | 3 | 133 | None |
| 13 | Add Vercel cron header check (S6) | Security | 10 | 5 | 10 | 1 | 500 | None |
| 14 | Structured logging (O1) | Observability | 10 | 5 | 8 | 4 | 100 | None |
| 15 | Persistent Telegram sessions (A5) | Reliability | 4 | 5 | 8 | 3 | 53 | None |
| 16 | Critical path e2e tests (T1) | Testing | 10 | 7 | 7 | 6 | 82 | None |
| 17 | Monthly report batch query (P3) | Performance | 6 | 5 | 9 | 2 | 135 | None |
| 18 | Fix JWT callback DB query (R6) | Performance | 10 | 3 | 10 | 1 | 300 | None |
| 19 | Add `allowedOrigins` in next.config (S8) | Security | 10 | 3 | 9 | 1 | 270 | None |
| 20 | OTP cleanup in cron (R4) | Reliability | 3 | 4 | 10 | 1 | 120 | None |
| 21 | Static generation for 5 pages (P6) | Performance | 10 | 5 | 10 | 1 | 500 | None |
| 22 | Dashboard `unstable_cache` + tags (P7) | Performance | 10 | 8 | 9 | 3 | 240 | P8 (tag invalidation) |
| 23 | Switch to `revalidateTag` invalidation (P8) | Performance | 10 | 7 | 9 | 2 | 315 | None |

---

### Execution Phases

#### Phase 0: Stop the Bleeding (this week)

**Goal:** Close critical security holes before any new user onboarding.

- [ ] **S1 — Authenticate Telegram webhook** (~30 min)
  - Register webhook with `secret_token` via Telegram Bot API
  - Add header check in `POST` handler
  - **Acceptance:** Requests without valid secret return 403

- [ ] **S2 — Rate-limit OTP brute-force** (~2 hours)
  - Add `attempts` counter to `TelegramOtp` model
  - In Credentials authorize, increment attempts on failure, reject after 5
  - Add IP rate limit via middleware or Vercel Edge Config
  - **Acceptance:** 6th wrong code attempt returns "Too many attempts"

- [ ] **S4 — Secure family invite tokens** (~30 min)
  - Replace `@default(cuid())` with `crypto.randomBytes(32).toString('hex')` in `createFamilyInvite`
  - **Acceptance:** Tokens are 64-char hex strings, unpredictable

- [ ] **S6 — Add Vercel cron header check** (~15 min)
  - Add `request.headers.get("x-vercel-cron")` check to both cron routes
  - **Acceptance:** Direct HTTP calls without Vercel header get 401

- [ ] **S9 — Escape HTML in Telegram messages** (~30 min)
  - Create `escapeHtml()` utility
  - Apply to all user-provided content in Telegram messages
  - **Acceptance:** Bill named `<b>test</b>` shows as literal text in Telegram

- [ ] **S8/S19 — Add `allowedOrigins` in next.config** (~5 min)
  - **Acceptance:** `experimental.serverActions.allowedOrigins` includes `pagafacil.work`

---

#### Phase 1: Foundation (2-4 weeks)

**Goal:** Fix architectural issues that compound over time.

- [ ] **A1/R1 — Extract recurrence logic into `lib/recurrence.ts`** (~2 hours)
  - Move `computeNextDueDate`, `generateFutureDates` to shared module
  - Update webhook to use shared logic + transaction
  - **Acceptance:** Only one implementation of date computation exists. Webhook uses `$transaction`.

- [ ] **P1 — Fix TrendSection to single query** (~1 hour)
  - Replace 12 `db.bill.aggregate` calls with 1 `findMany` + JS aggregation
  - **Acceptance:** Dashboard chart loads in < 100ms (measure with Vercel analytics)

- [ ] **A3 — Split actions.ts** (~2 hours)
  - Create `lib/actions/{bills,import,auth,settings}.ts` + `index.ts`
  - **Acceptance:** No file over 300 lines in `lib/actions/`

- [ ] **S7 — Server-side re-validation in `importBills`** (~1 hour)
  - Re-run validation on all rows inside `importBills`, ignoring client-sent `valid` flag
  - **Acceptance:** Sending rows with `valid: true` and invalid data gets rejected

- [ ] **O2/O3 — Health check + Sentry** (~2 hours)
  - Add `/api/health` route
  - Install `@sentry/nextjs`, configure error boundary integration
  - **Acceptance:** Unhandled errors appear in Sentry dashboard within 1 minute

- [ ] **R6 — Optimize JWT callback** (~30 min)
  - Only refresh user name if token is older than 5 minutes
  - **Acceptance:** Authenticated page loads make 0 extra DB queries for name refresh (most of the time)

- [ ] **R4 — OTP cleanup** (~15 min)
  - Add `deleteMany` expired OTPs to reminders cron
  - **Acceptance:** No OTP rows older than 24 hours in the table

- [ ] **S3 — Remove `allowDangerousEmailAccountLinking`** (~3 hours)
  - Remove the flag
  - Handle "OAuthAccountNotLinked" error in login UI with a helpful message
  - Add explicit account linking flow in settings
  - **Acceptance:** Logging in with Google for an existing magic-link user shows "Account exists — sign in with email first"

---

#### Phase 2: Acceleration (1-2 months)

**Goal:** Performance, reliability, and developer velocity improvements.

- [ ] **P2 — Pagination on bills page** (~3 hours)
  - Add cursor-based pagination with "Load more" button
  - Maintain filter/sort compatibility
  - **Acceptance:** Initial page load fetches max 50 bills. "Load more" fetches next batch.

- [ ] **P3 — Batch monthly report queries** (~2 hours)
  - Replace N+1 per-user queries with aggregation grouped by userId
  - **Acceptance:** Cron completes in < 5s for 100 users

- [ ] **T1 — Critical path e2e tests** (~1 week)
  - Set up Playwright with test database
  - Cover: login, create bill, mark as paid, recurring generation, import
  - **Acceptance:** CI runs tests on every PR, green = deployable

- [ ] **O1 — Structured logging** (~3 hours)
  - Add request context (userId, operation) to all error logs
  - Use Vercel Log Drains or Axiom for persistence
  - **Acceptance:** Can filter logs by userId in the logging dashboard

- [ ] **A5 — Persistent Telegram sessions** (~2 hours)
  - Replace in-memory Map with DB table or Vercel KV
  - **Acceptance:** `/pagar` flow works reliably across multiple requests

- [ ] **DX1 — Use Prisma types consistently** (~1 hour)
  - Replace hardcoded enum arrays with `Object.values(Category)` from Prisma client
  - **Acceptance:** Adding a new category only requires schema change + migration

---

#### Phase 3: Scale Readiness (2-3 months)

**Goal:** Prepare for growth beyond initial 10 users.

- [ ] **Database optimization** — Add connection pooling config, query performance monitoring
- [ ] **Soft delete cleanup** — Scheduled job to permanently delete bills with `deletedAt > 30 days`
- [ ] **LGPD compliance** — Data export/deletion endpoints, privacy policy, cookie consent
- [ ] **Multi-timezone support** — Currently hardcoded to `America/Sao_Paulo`
- [ ] **Monitoring dashboard** — Uptime, error rates, cron success rates, user activity
- [ ] **Load testing** — Verify system handles 100 concurrent users without connection pool exhaustion
- [ ] **Backup strategy** — Automated Neon snapshots, point-in-time recovery verification

---

### Architecture Decision Records (Recommended)

These decisions should be discussed and documented in `DECISIONS.md`:

1. **Auth consolidation** — Should Telegram OTP move to a proper NextAuth provider pattern instead of Credentials?
2. **State management for Telegram bot** — DB vs Redis vs Vercel KV for session state?
3. **Cron reliability** — Should reminders use a queue (QStash, Inngest) instead of direct sends?
4. **Family feature scope** — Should family members have roles (admin/member) with different permissions?
5. **Data retention** — How long to keep soft-deleted bills? What about inactive users?

---

### Summary of Findings by Severity

| Severity | Count | Key Items |
|----------|-------|-----------|
| 🔴 CRITICAL | 6 | Unauthenticated webhook, OTP brute-force, email linking, predictable tokens, open redirect, zero tests |
| 🟡 MAJOR | 19 | Duplicated logic, N+1 queries, no observability, no pagination, cron fragility, no caching strategy, 5 pages needlessly dynamic, coarse invalidation |
| 🟢 MINOR | 8 | Type safety, naming conventions, dependency placement, minor DX improvements |

**Bottom line:** The feature surface is strong for an MVP. The security issues are the only true blockers — fix those this week, then the architectural cleanup can proceed at a sustainable pace.
