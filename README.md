# Idea Foundry

Find the right AI tools for your business — without wasting time or money.

## Stack (all JavaScript)
- **Frontend:** React 19 + Vite, Tailwind, shadcn/ui primitives, Lucide icons — `/app/frontend`
- **API:** Node.js 24 + Express 5, Zod validation, Papa Parse — `/app/backend/src`
- **Data:** your Supabase Postgres (canonical migration applied unchanged + additive `006_app_additions.sql`), accessed server-side only with the service-role key. RLS stays enabled on every table; the browser never talks to Supabase.
- **Sign-in:** Emergent-managed Google login. On first sign-in the server creates the Supabase auth user, the canonical `handle_new_user` trigger creates `public.users`, and a hashed session is stored in `app_sessions`.
- **AI:** OpenRouter via the OpenAI-compatible client, one wrapper `src/llm/call.js` (cache, budget guard, telemetry, retry-once, fallbacks).
- `backend/server.py` is only a launcher: the platform supervisor runs uvicorn on :8001, so it starts the Node API (:8002) and forwards requests to it unchanged.

## Environment (backend)
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` (session pooler string, used only by `yarn migrate`), `OPENROUTER_API_KEY`, `LLM_MODEL_CHEAP`, `LLM_MODEL_MID`, `EMBED_MODEL=none`, `LLM_DAILY_BUDGET_USD=3`, `LLM_TOTAL_BUDGET_USD=20`, `CRON_SECRET`, `ADMIN_EMAILS`, `DEMO_MODE`.
Model choice: the owner asked us to pick; if `LLM_MODEL_*` is not a model id, `LLM_DEFAULT_MODEL_CHEAP=anthropic/claude-haiku-5.5` and `LLM_DEFAULT_MODEL_MID=anthropic/claude-sonnet-5.5` are used. Cheap tier runs with thinking off; mid tier gets a fixed 1,024-token thinking budget.
If Supabase tables are missing, the API reports `database: local_fallback` on `/api/healthz` and uses local storage until `yarn migrate` is run.

## Commands (in `/app/backend`)
| Command | What it does |
|---|---|
| `yarn migrate` | Applies `supabase/source/idea_foundry_migrations_v2.sql` (skipped if tables exist) and `006_app_additions.sql`, once each |
| `yarn seed:dry` / `yarn seed` | Parse report / idempotent upsert by slug |
| `yarn enrich` | One `enrich` call per tool not yet at the current `PROMPT_VERSION` |
| `yarn demo:generate` | Rebuilds the 3 sample businesses + their setup guides |
| `yarn test` | Vitest unit suite (parsing, scoring, gates, ETA, profile, LLM guards) |
| `yarn eval` | Engine vs stars-only vs fit-only on the sample personas |

## Seed report (actual)
86 tools · 51 with parsed prices · 22 with numeric ratings · 11 price conflicts — matches the design. 28 tools have only company/competitor-written sources.

## Baseline comparison (`yarn eval`)
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
