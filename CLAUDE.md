# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server at http://localhost:5173
npm run build      # tsc -b (typecheck) then vite build
npm run lint       # eslint over the repo
npm run preview    # serve the production build
```

There is no test runner configured. `npm run build` is the typecheck gate — run it before claiming a change compiles.

### Supabase (production backend)

```bash
npx supabase link --project-ref YOUR_REF
npx supabase db push                          # apply migrations in supabase/migrations/
npx supabase functions deploy process-input   # Whisper/OCR/LLM parsing
npx supabase functions deploy r2-presign       # receipt upload presign
npx supabase secrets set OPENAI_API_KEY=... R2_ACCOUNT_ID=... # edge function env
```

## Architecture

OrnateOS is a multi-tenant React + Vite SPA. A jewellery business owner records transactions by voice, receipt photo, or text (Gujarati/Hindi/English); AI parses them into a structured ledger; the app tracks maker (karigar) orders.

### Dual-mode persistence — the central pattern

Every data-access function in `src/lib/` runs in **one of two modes**, decided at module load by `isSupabaseConfigured` (set when `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are present):

- **Production mode** — talks to Supabase Postgres (with RLS) and Edge Functions.
- **Demo mode** (no env vars) — persists to `localStorage`, parses input with a client-side regex parser, and accepts any email/password.

When adding or changing any persistence or AI function, you **must implement both branches** — `if (supabase) { ...Postgres... } return ...localStorage...`. See `src/lib/api.ts`, `src/lib/auth.ts`, `src/lib/orders.ts`, `src/lib/supabase.ts` for the established shape. Demo-mode parsing in `src/lib/demoParser.ts` mirrors the LLM prompt in `supabase/functions/process-input/index.ts`; the edge function itself also falls back to `demoParse` when `OPENAI_API_KEY` is unset.

### Tenant context

`src/lib/tenant.ts` holds a module-level `activeBusinessId`. It is set by `setActiveBusinessId()` whenever a session loads (`src/lib/auth.ts` → `getSession`/`persistLocalSession`). Every data function calls `requireBusinessId()` and scopes by it:

- **Production:** queries filter `.eq('business_id', businessId)`; RLS additionally enforces isolation via the `current_business_id()` SQL function (looks up the caller's profile). The `20250522000000_multi_tenant.sql` migration drops the earlier permissive anon policies — never reintroduce them.
- **Demo:** `localStorage` keys are namespaced with `scopedKey(base, businessId)` (e.g. `ornateos_transactions_<uuid>`).

Auth/session state flows through `src/contexts/AuthContext.tsx` (`useAuth`). A user with a session but no named business is routed to `/onboarding` (see the route guards in `src/App.tsx`).

### Record → preview → confirm flow

1. `InputPage` (`/record`) captures voice / image / text. Images upload to Cloudflare R2 via a presigned URL (`uploadReceipt` → `r2-presign` function).
2. `processInput` (`src/lib/api.ts`) calls the `process-input` edge function (STT via Whisper, OCR + structuring via `gpt-4o-mini`), or falls back to `demoParser` in demo mode. Returns a `ProcessResult` with a structured `LedgerRecord`.
3. `PreviewPage` (`/preview`) lets the user review/correct the parse before confirming. On an `order_received` record matching multiple pending maker orders, the user disambiguates which order to receive (`findPendingOrderMatches` in `src/lib/orders.ts`).
4. Confirm inserts a `transactions` row and updates relevant `maker_orders`.

Dashboard metrics (inventory grams, memo exposure, grams-with-makers) are computed client-side in `computeDashboard` (`src/lib/api.ts`) by folding over confirmed transactions plus order stats — there is no server-side aggregation.

### Layout

- `src/lib/` — all data, auth, AI, and business logic (the dual-mode layer). Keep logic here, not in pages.
- `src/pages/` — one component per route; routes and guards live in `src/App.tsx`.
- `src/types/` — `ledger.ts`, `orders.ts`, `auth.ts` define the shared domain shapes.
- `supabase/migrations/` — schema is additive across timestamped files; multi-tenant RLS is the latest.
- `supabase/functions/` — Deno edge functions (`process-input`, `r2-presign`).
