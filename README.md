# APEX

Find the right AI tools for your business — without wasting time or money.

## Stack (all JavaScript)
- **Frontend:** React 19 + Vite, Tailwind, shadcn/ui primitives, Lucide icons — `frontend/`
- **API:** Node.js 22+ + Express 5, Zod validation, Papa Parse — `backend/src`
- **Data:** your Supabase Postgres, accessed server-side only with the service-role key. RLS stays enabled on every table; the browser never talks to Supabase.
- **Sign-in:** built-in email + password. Passwords are hashed with scrypt in `app_credentials` (migration `007_local_auth.sql`); sessions are hashed tokens in `app_sessions`, sent as an httpOnly cookie.
- **AI:** OpenRouter via the OpenAI-compatible client, one wrapper `src/llm/call.js` (cache, budget guard, telemetry, retry-once, fallbacks).
- No Emergent services, scripts, packages or launchers are used.

## Run it locally
Needs Node.js 22 or newer.

```bash
# 1. Configure the API
cp backend/.env.example backend/.env      # Windows: copy backend\.env.example backend\.env
#    then fill in SUPABASE_*, OPENROUTER_API_KEY, ADMIN_EMAILS

# 2. Install everything (root helper + backend + frontend)
npm install
npm run install:all

# 3. Create tables (first time only; also adds the new app_credentials table) and load the catalog
npm run migrate
npm run seed

# 4. Start API (:8002) and web app (:3000) together
npm run dev
```
Open http://localhost:3000 and use **Create an account**. Accounts whose email is in `ADMIN_EMAILS` get the admin pages.
The Vite dev server proxies `/api` to `http://127.0.0.1:8002`, so the browser only ever talks to localhost:3000.

## Environment (backend)
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` (session pooler string, used only by `npm run migrate`), `OPENROUTER_API_KEY`, `LLM_MODEL_CHEAP`, `LLM_MODEL_MID`, `EMBED_MODEL=none`, `LLM_DAILY_BUDGET_USD=3`, `LLM_TOTAL_BUDGET_USD=20`, `CRON_SECRET`, `ADMIN_EMAILS`, `DEMO_MODE`, optional `LLM_DISABLED=true`, optional `COOKIE_SECURE=true` (set when serving over HTTPS).
If `LLM_MODEL_*` is not a model id, `anthropic/claude-haiku-5.5` and `anthropic/claude-sonnet-5.5` are used.

## Commands (in `backend/`, run with `npm run <name>`)
| Command | What it does |
|---|---|
| `npm run migrate` | Applies `supabase/source/idea_foundry_migrations_v2.sql` (skipped if tables exist) , `006_app_additions.sql` and `007_local_auth.sql`, once each |
| `npm run seed:dry` / `npm run seed` | Parse report / idempotent upsert by slug |
| `npm run enrich` | One `enrich` call per tool not yet at the current `PROMPT_VERSION` |
| `npm run demo:generate` | Rebuilds the 3 sample businesses + their setup guides |
| `npm run test` | Vitest unit suite (parsing, scoring, gates, ETA, profile, LLM guards) |
| `npm run eval` | Engine vs stars-only vs fit-only on the sample personas |

## Seed report (actual)
86 tools · 51 with parsed prices · 22 with numeric ratings · 11 price conflicts — matches the design. 28 tools have only company/competitor-written sources.

## Baseline comparison (`npm run eval`)
| Persona | Engine | Stars-only | Fit-only |
|---|---|---|---|
| Salon | Acuity Scheduling, Setmore/Zeeg, Goodcall | Smith.ai, Goodcall, Rosie AI | Goodcall, Dialzara, AIRA |
| Restaurant (10–49) | MarketMan + review tools | MarketMan, Podium, Birdeye | Podium, NiceJob, LocalImpact |
| Plumber | Jobber, FreshBooks, Housecall Pro | FreshBooks, Jobber, Housecall Pro | Jobber, QuickBooks Online, Xero |
Stars-only ignores the second need; fit-only ignores proof. NDCG@3 is **not** reported: the 12-persona gold labels have not been supplied.

## Security checklist
- RLS enabled on all tables (incl. `app_sessions`, `admin_audit`); no browser Supabase access.
- Every route validates input with Zod; user ids, roles, scores, prices and status are never taken from the client.
- Provider submissions are inserted as `pending` with `provider_id` = session user; edits only while pending; only admins (server-checked `ADMIN_EMAILS`) approve.
- httpOnly secure session cookie + same-origin check on cookie-authenticated mutations; helmet headers; rate limits (chat 30/user/day, recommend 10/user/day, IP limits).
- Untrusted text is sanitised and wrapped in `<untrusted>` tags; faithfulness check on explanations and compare text; guide heading check.
- No prompts or personal data are logged.

## Admin capabilities
Approve/reject pending tools (approve → enrich → rematch), AI usage page (spend today/total, by task, cache hit rate, fallbacks, budget guard), "Add a sample better tool & run alerts" (demo mode, in-app only), run alerts, regenerate samples. All actions are written to `admin_audit`.

## Known limitations
Only 22/86 tools have numeric ratings; setup fields are AI-estimated and labelled "Estimated"; bias flags use a domain list; ETA priors are placeholders; no gold set yet; US/English focus; prices may be out of date (last checked 2026-11-07). Email alerts are not sent (no verified sender configured); SMS is a logged stub; nightly cron is not scheduled (use the admin button or `POST /api/jobs/rematch` with `Bearer CRON_SECRET`); embeddings off.

## Manual setup still yours
Change the database password you shared in chat and update `SUPABASE_DB_URL`; real Privacy/Terms/Contact text; optional cron schedule; optional email sender.
