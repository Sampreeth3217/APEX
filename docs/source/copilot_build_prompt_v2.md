# Copilot build prompt for Idea Foundry, v2

Idea Foundry helps owners of small shops and service businesses find the right AI tool. This file tells GitHub Copilot how to build the site on Supabase, in time-boxed phases that fit the Sunday 11:59 pm ET deadline.

## How to use this file

1. Put these files in the repo.
   * `docs/idea_foundry_system_design_v2.md` (the design, source of truth)
   * `docs/copilot_build_prompt_v2.md` (this file)
   * `supabase/idea_foundry_migrations_v2.sql` (tested SQL, schema + RLS)
   * `data/ai_tools_seed.csv` (86 tools)
2. Do section 0 yourself. Copilot cannot create accounts or keys.
3. Copy section 1 into `.github/copilot-instructions.md`.
4. Open Copilot Chat in agent mode. Paste section 2 once, then the phase prompts in section 3 one at a time.
5. Run each phase's acceptance check before moving on. Stuck for more than 20 minutes on one thing? Use section 6, or cut it (section 5 lists what can go).

---

## 0. Human setup before Copilot starts (about 30 minutes)

* [ ] Supabase project. Save Project URL, anon key, service role key.
* [ ] SQL editor: run `supabase/idea_foundry_migrations_v2.sql` top to bottom. (It creates the `vector` extension. Skip `pg_cron` for now.)
* [ ] Google Cloud OAuth client (web). Redirect URI `https://<project>.supabase.co/auth/v1/callback`. Paste id and secret into Supabase → Authentication → Providers → Google. Add `http://localhost:3000` to redirect URLs. Publish the consent screen or add test users.
* [ ] OpenRouter: set a credit limit on the team key. Pick two models (cheap, mid) that support JSON output and tool calling.
* [ ] `npx create-next-app@latest idea-foundry --typescript --tailwind --app --eslint`, push to a **private** GitHub repo, import into Vercel, deploy the empty app now.
* [ ] `.env.local` and Vercel env vars from design section 7.6, with `EMBED_MODEL=none`, `LLM_DAILY_BUDGET_USD=3`, and your three emails in `ADMIN_EMAILS`.
* [ ] Add the Vercel URL to Supabase redirect URLs.

---

## 1. Standing rules (copy into `.github/copilot-instructions.md`)

```text
Project  Idea Foundry, an AI tool finder for small business owners who are not technical.
Design   docs/idea_foundry_system_design_v2.md is the source of truth. Read the relevant
         section before writing code. If this file and the design disagree, follow the
         design and tell me. The database already exists: supabase/idea_foundry_migrations_v2.sql.
         Do not change the schema without asking; if a change is needed, write a new
         numbered migration file and tell me.

Stack    Next.js App Router, TypeScript strict, Tailwind CSS, Supabase via @supabase/ssr and
         supabase-js, zod, Vitest, lucide-react, openai (as the OpenRouter client), papaparse.
         No other UI libraries without asking.

Rules
 1. Secrets. SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY and CRON_SECRET only in server
    code. Never in a client component, never logged, never committed.
 2. Every LLM call goes through lib/llm/call.ts.
 3. The LLM never ranks. Ranking is plain code in lib/scoring.
 4. Missing data stays missing. Null price, rating or integration shows "not listed" and gets
    the neutral score from the design. Never invent a number or a claim.
 5. Validate every request body and every model output with zod.
 6. RLS is on. Browser code uses the anon key. Server code uses the service role only to write
    system data (tools, recommendations, guides, caches, notifications).
 7. Every LLM feature has a fallback that works with the model off.
 8. Pure logic (parsing, scoring) lives in lib/ with unit tests.
 9. User-facing text: plain words, about grade 7. Never show "BANT", "API", "embedding",
    model names or raw decimals. Fit = "how well it matches you", Trust = "how well proven",
    integration = "works with".
10. Questionnaire answers from signed-out visitors live in localStorage until sign-in.
11. Tech comfort is 1 to 5 everywhere.
12. Time box. Build the simplest version that passes the acceptance check. Do not add
    features the phase did not ask for.
13. After each task, list the files you changed and how to test them.
```

---

## 2. Master context prompt (paste once)

```text
You are building Idea Foundry, a website that helps owners of small businesses (salons,
restaurants, plumbers, small shops) choose AI tools. Users are not technical. It must feel
simple, warm and friendly, and work well on a phone.

Read docs/idea_foundry_system_design_v2.md fully first, especially section 0 (what changed),
4 (pipeline), 5 (scoring code), 6A (LLM layer) and 7 (web system). The database is already
created from supabase/idea_foundry_migrations_v2.sql; generate TypeScript types that match it
in lib/types.ts. The dataset is data/ai_tools_seed.csv: 86 tools, 10 categories, many blanks
on purpose.

User journey
 1. Landing page: "Find AI for my business" and "Try a sample business".
 2. Questionnaire, one question per screen, answers kept in the browser.
 3. Continue with Google, then a short onboarding: name, business name, city or ZIP,
    optional phone, two separate unticked consent boxes (email, text).
 4. Dashboard: top 3 tools, why each fits, hours saved range, unknowns.
 5. Marketplace, tool details, compare 2 or 3 tools.
 6. Setup guide written for the owner's comfort with technology.
 7. Chat helper on every page.
 8. Save tools, comment, get a notice when a better tool appears.
 9. /demo shows three sample businesses without signing in, for judges.
10. A form for tool providers to submit a tool.

Work in the phases I give you, one at a time. Do not start the next phase until I say so.
Ask me before any choice the design does not cover.
```

---

## 3. Phase prompts

### Phase 1. Project setup (Sat, by 10:00 pm)

```text
Set up the project.
- Install @supabase/supabase-js @supabase/ssr zod openai papaparse lucide-react and dev deps
  vitest tsx @types/papaparse.
- Layout:
  app/  components/  lib/supabase/{browser,server,admin}.ts  lib/llm/{call,prompts,schemas,budget}.ts
  lib/scoring/{config,parse,features,trust,rank,eta}.ts  lib/data/biasedDomains.ts
  lib/types.ts  lib/env.ts  scripts/{seed,enrich,demo,tune}.ts  tests/
- lib/env.ts validates env vars with zod: server vars in a server-only module, public vars
  separately. A missing var fails with a clear message.
- middleware.ts refreshes the Supabase session.
- Shared layout: header (logo "Idea Foundry", Marketplace, Sample businesses, My tools,
  Sign in / avatar) and footer. Base font 18px.
- /healthz returns {supabase: ok|error, env: ok|missing:[names]} with no secret values.
- lib/types.ts with types for every table in the migrations file.
```

Acceptance. `npm run dev` starts, `/healthz` is ok locally and on the Vercel URL, a removed env var stops the app with a clear message.

### Phase 2. Seed the catalog (Sat, by 11:00 pm)

```text
Write scripts/seed.ts (run with tsx, uses the service role) implementing design section 4,
stage 0, steps 1 to 7. No LLM calls in this script.
- Put the parsers in lib/scoring/parse.ts as pure functions: parsePrice(notes),
  parseReviews(text), parseSources(text, slug), splitList(text).
- parsePrice returns {price_min_month, price_max_month, price_known, price_conflict,
  is_usage_based, is_per_seat}. Ignore amounts followed within 40 characters by
  "resolution", "year" or "per tech" for the minimum.
- parseReviews follows the rules table: drop "None/5", lower bound for "1,000+ to 1,700+",
  null count for "(None)", is_customer false for Editorial and Toolradar, source lowercased.
- parseSources splits on whitespace before "http" and sets kind and biased using
  lib/data/biasedDomains.ts (list in the design) plus the tool's own domain.
- Keep has_free_plan / has_free_trial null when blank. Drop integration entries that
  contain "reported". Set smb_fit_flag from the lists in the design. last_checked_at 2026-11-07.
- Upsert on slug. Print a report: tools, parsed prices (expect 51), rated tools (expect 22),
  price conflicts (expect 11), tools whose sources are all biased.
- npm scripts "seed" and "seed:dry" (report only).
- Vitest tests for the parsers with at least 10 real CSV rows: smith-ai, cloudtalk, tidio,
  intercom-fin, ringcentral-ai-receptionist, quickbooks-online, wave, jobber, servicetitan,
  marketman, and one row with every optional field blank.
```

Acceptance. Report shows 86 / 51 / 22 / 11. Tests pass. Running the seed twice leaves 86 rows.

### Phase 3. Scoring engine (Sat, by 1:00 am)

```text
Implement lib/scoring exactly as design sections 4 (stages 2 to 6 and 8) and 5.
- config.ts: weights, priority shift, thresholds, alpha, C, source weights and default
  counts, budget band mapping, urgency classes, a_cat priors, SCORING_VERSION.
- features.ts: need, budget, ease, timeline, integration. Each returns
  {score, unknown, note}. Need uses the no-embedding formula plus the business_types bonus.
- trust.ts: categoryMeans(tools) with the "3 or more rated, else global mean" rule,
  reviewScore, evidenceScore, sourceScore (biased counts 0.5), trust.
- rank.ts: rank(profile, tools) applies the three hard gates (including the SMB gate),
  computes Fit, Trust, Final, quadrant, tie-breaks, diversity rule, and returns up to 3
  results with a full breakdown and, if fewer than 3, a plain reason.
- eta.ts: per-tool low, likely, high hours saved per week, first month and after setup,
  payback months if an hourly value is given, estimate: true.
- Tests: tool with every field missing scores with unknown flags; free tool gets budget 1;
  over-budget tool is gated; 12 reviews at 4.8 does not beat 900 at 4.5 when all else is
  equal; a tool with only biased sources gets a lower S; servicetitan never reaches a
  2-9 person top 3; fewer than 3 results returns a reason; weights always sum to 1.
- scripts/try.ts prints the top 3 with breakdowns for three built-in personas
  (salon, restaurant, plumber).
```

Acceptance. All tests pass. `npx tsx scripts/try.ts` prints three different, sensible top-3 lists.

### Phase 4. LLM layer and enrichment (Sun, by 9:30 am)

```text
Implement lib/llm from design section 6A.
- call.ts: callLLM with budget guard, cache lookup, 30 s timeout, zod validation with one
  retry, llm_usage logging (tokens, cost, cache_hit, fallback_used). Model prices in config.
- prompts.ts: all templates from 6A.4, PROMPT_VERSION, and wrapUntrusted(text) that strips
  system-like markers.
- schemas.ts: ToolEnrichment, Profile, ProfileSummary, Explanations, CommentTags.
- Task functions with fallbacks from 6A.6: enrichTool, buildProfileSummary, explainTop3
  (with the faithfulness check), tagComment, compareTradeoff, writeGuide (checks the six
  headings).
- scripts/enrich.ts: enrich every tool missing enrichment for the current PROMPT_VERSION,
  print counts and total cost. npm script "enrich".
- tests/llm/fixtures.json with 10 personas; tests run schemas, faithfulness and fallbacks
  with the model mocked.
- /admin/llm (ADMIN_EMAILS only): spend today, cache hit rate, spend by task.
```

Acceptance. Mocked tests pass. `npm run enrich` fills all 86 tools for well under $1. A second identical `buildProfileSummary` call is a cache hit.

### Phase 5. Sign in and onboarding (Sun, by 10:30 am)

```text
Build authentication.
- /login: large "Continue with Google" button (Supabase OAuth) and an /auth/callback route.
  After sign-in: if users.onboarding_complete is false go to /onboarding, else /dashboard.
- /onboarding: name (prefilled from Google), business name, city or ZIP, phone (optional),
  and two unticked boxes "Email me about updates to my search" and "Text me about updates
  to my search". The text box needs a phone number. Save one consents row per channel with
  the exact wording, wording_version "v1" and timestamp. Say they can change this in
  Settings. Then set onboarding_complete and, if localStorage holds questionnaire answers,
  POST them to /api/profile and go to /dashboard. (/api/profile is built in Phase 6; leave
  a clearly marked TODO call until then.)
- /me/settings: change phone, location and both consents.
- Protect /dashboard, /me, /onboarding and /guide (except demo guides). Public: /, /start,
  /demo, /tools, /compare.
- Sign out works. Redirects work on localhost and the Vercel URL.
```

Acceptance. A new Google account signs in, onboards and sees its consent rows. A second account cannot read the first one's rows.

### Phase 6. Landing, questionnaire and demo (Sun, by 12:00 pm)

```text
Build the entry points.
- / : headline in plain words, three short "how it works" steps, three example businesses,
  buttons "Find AI for my business" (/start) and "Try a sample business" (/demo).
- /start: the 10 questions in design section 4 stage 1, one per screen, progress bar, Back,
  big tap targets, answers in localStorage (key "if_answers_v1"). Question 3 shows one slider
  per need chosen in question 2. Question 4 shows outcome chips for the chosen needs.
  The last screen: "See my matches" → if signed out, /login; if signed in, POST /api/profile
  then /dashboard.
- POST /api/profile: zod-validate answers, map to the Profile in plain code
  (lib/profile/map.ts, unit tested), call buildProfileSummary, save a new profiles row with
  is_current true and set older rows false.
- scripts/demo.ts: three personas (salon, restaurant, plumber) → run rank, explainTop3 and
  ETA → upsert demo_personas.results. npm script "demo:generate".
- /demo lists the three; /demo/[slug] renders the same dashboard component as /dashboard
  from demo_personas.results, with a banner "This is a sample business".
```

Acceptance. A full questionnaire run takes under two minutes and survives a refresh. `/demo/salon` works in a private window with no sign-in.

### Phase 7. Recommendations and dashboard (Sun, by 2:00 pm)

```text
Build recommendations.
- POST /api/recommend (signed in, rate limited 10 a day): load current profile and live
  tools, run rank, explainTop3 and ETA, save recommendations rows, return them. If rows exist
  for this profile with the same SCORING_VERSION and tool versions, return those.
- components/Dashboard.tsx (used by /dashboard and /demo/[slug]): three large cards in rank
  order. Each card: name, one_line, labels in words ("Great match", "Well proven",
  "Promising, limited reviews"), why_it_fits, not_for, check_first, hours saved range with
  "rough estimate", price in plain words or "not listed" (and "prices vary by source" when
  price_conflict), an Unknown box, buttons Save, Compare, "How do I set this up?".
- A small Fit × Trust chart (SVG, no chart library) with the top 3 marked and a plain sentence
  under it. A "Why these three?" expander with the breakdown in words.
- If fewer than 3 results, show the plain reason from rank.
- "Not quite right? Change my answers" → /start with saved answers.
```

Acceptance. Three personas give sensible, different top 3 lists. No card shows a price or integration that is not in the record. Works at 375 px wide.

### Phase 8. Marketplace, details, compare (Sun, by 3:30 pm)

```text
Build browsing.
- /tools: card grid, search box (name, best_for, summary), category chips, price filter
  (free, under $50, under $150, any), "has free trial" toggle, "works with" labels,
  "Built for bigger businesses" tag when smb_fit_flag is not good, "show more".
- /tools/[slug]: summary, typical use cases ("estimated"), pricing in plain words, works with,
  "How we checked this tool" (Trust explained in words, sources listed, biased sources marked
  "written by the company or a competitor"), Unknowns box, last checked date, comments with
  topic chips and "N salon owners use this" from tool_community and comments.
- /compare?a=&b=&c=: columns with rows price, free options, how hard to set up, who it suits,
  works with, reviews, unknowns. Highlight differences. compareTradeoff text under the table.
  "Add to compare" on cards with a floating bar after the first pick.
```

Acceptance. Search and filters work. A tool with almost no data renders cleanly. Compare works for 2 and 3 tools.

### Phase 9. Chat helper and setup guide (Sun, by 5:00 pm)

```text
Build the helper and the guide.
- Floating chat button on every page. POST /api/chat streams replies, uses the chat prompt
  and the four functions in 6A.5, max 3 rounds, last 10 messages plus profile and top 3,
  saves chat_messages for signed-in users, 30 messages per user per day. On /demo pages use
  the demo persona's profile and do not save. Starter questions in plain words. A note that
  the helper can make mistakes and facts come from the tool pages.
- /guide/[slug]: writeGuide with the owner's tech comfort and existing software, cached in
  guides by (tool, tech level, version). Render headings, numbered steps with checkboxes saved
  to guide_progress, a "Talk to the provider" box, the AI disclaimer line, and "Was this
  helpful?" thumbs saved to guide_progress.helpful.
- scripts/demo.ts also pre-generates guides for each demo persona's top 3.
```

Acceptance. Chat refuses to invent a price and answers in about 120 words or less; with the model off it shows the fallback. Level 1 and level 5 guides read clearly differently.

### Phase 10-lite. Saved tools, comments, alerts (Sun, by 6:00 pm)

```text
Build the follow-up features, minimum versions.
- Save writes user_tools (considering, fit/trust/final at pick). /me lists saved tools with
  "I'm using this" (asks for a one-line comment and hours saved) and "Dropped it".
- POST /api/comments saves body, rating, display_name (first name), business_type, calls
  tagComment.
- lib/jobs/rematch.ts implements stage 10 (in-app always, email only with consent through a
  mockable sender, SMS logs only, one alert per user per week). POST /api/jobs/rematch needs
  Bearer CRON_SECRET or an admin session.
- /admin: list pending provider tools with Approve (sets live, runs enrichTool, runs rematch),
  and a button "Add a better tool and run alerts" that inserts a prepared demo tool and runs
  rematch. Notification bell in the header with unread count.
- /providers/new: form with the tools fields plus contact email and help link → status
  pending, origin provider, provider_id = user.
```

Acceptance. The demo button creates exactly one notification for a user with a matching saved tool and none for a user without one.

### Phase 11. Polish, tune, deploy (Sun, 6:00–7:00 pm)

```text
Finish.
- Accessibility: 18px base, large targets, strong contrast, visible focus, labels, alt text,
  keyboard only works. Plain-language pass on every page (rule 9).
- Empty, error and loading states everywhere. Rate limits on every LLM route.
- scripts/tune.ts: load tests/gold_personas.json (12 personas with 2/1/0 labels), grid search
  alpha, Fit and Trust thresholds by NDCG@3, compare with stars-only and Fit-only baselines,
  print a markdown table.
- README: setup, env vars, seed/enrich/demo commands, tests, the tuning table, the seed report,
  Known limitations (design section 10).
- Production check on Vercel: env vars set, Supabase redirect URLs include the Vercel URL,
  Google login works in a private window, /demo works signed out.
```

Acceptance. Someone who has never seen the site can finish the questionnaire and explain why the top tool was picked. Lighthouse accessibility ≥ 90 on `/` and `/dashboard`.

---

## 4. UI design brief (give to Copilot for every screen)

```text
Design for a shop owner who is busy, on a phone, and unsure about technology.
- One main action per screen. Large buttons with plain verbs.
- Short sentences. No acronyms, model names or scoring words.
- Money in dollars per month. Time in hours per week, always as a range.
- Words and simple icons for scores, never decimals.
- Every claim has a source link nearby. Every gap says "not listed".
- Warm, calm look: lots of white space, one accent colour, readable type.
- Always an easy way back and a way to reach a person (the provider's help link).
```

---

## 5. Definition of done and cut line

- [ ] 86 tools seeded and enriched; seed report in the README.
- [ ] `/demo/salon`, `/demo/restaurant`, `/demo/plumber` work signed out on the live URL.
- [ ] Questionnaire → Google → onboarding → dashboard works end to end.
- [ ] Marketplace, tool details, chat and guide work; compare if time allowed.
- [ ] No secret in browser code or the repo.
- [ ] Missing data shows "not listed"; no invented price or integration.
- [ ] Every LLM feature works with the model off.
- [ ] Tuning table and baseline comparison in the README.
- [ ] Supabase project awake; live site checked before the deadline.

**Cut in this order if behind:** SMS stub → provider admin approval (keep the form) → email sending (keep in-app) → comments tagging → compare tradeoff text → compare page → tuning grid (keep the baseline comparison). Never cut: seed, scoring, demo route, questionnaire, dashboard, guide.

---

## 6. Fix prompts

```text
The scoring tests fail. Show the failing test, explain the cause in two sentences, then fix
the code, not the test, unless the test contradicts the design. If it does, tell me.
```

```text
A page shows a price or integration that is not in the tool record. Trace where the text
came from. If from the model, tighten the prompt in lib/llm/prompts.ts, bump PROMPT_VERSION
and check the faithfulness check runs. If from code, fix the code.
```

```text
Google login fails on the deployed site. Check the Supabase Site URL and redirect URLs, the
Google OAuth redirect URI, NEXT_PUBLIC_SITE_URL and the /auth/callback route. List what to
change in each place.
```

```text
Row level security blocks a query I expect to work. Show which policy applies, whether the
request used the anon or service role key, and the smallest change that fixes it without
opening other users' data. Do not disable RLS.
```

```text
The model returns invalid JSON. Show the zod error and the raw output. Fix the prompt or the
schema, keep the single retry, and make sure the fallback runs if the second try fails.
```

```text
This phase is taking too long. List what is done, what is left, and the smallest version of
what is left that passes the acceptance check. Then build only that.
```
