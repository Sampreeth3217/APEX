-- =====================================================================
-- Idea Foundry v2 — Supabase migrations (merged design)
-- Split into files 001–005 as listed in the design doc section 7.9, or run in
-- the Supabase SQL editor top to bottom. 006_cron.sql is in the design doc.
-- Vector size 384 = EMBED_MODEL output. If EMBED_MODEL=none, keep the columns empty.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 001_schema.sql
-- ---------------------------------------------------------------------
create extension if not exists vector;

create table tools (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  name              text not null,
  category          text not null check (category in (
                      'ai_receptionist','customer_chatbot','reviews_reputation','social_content',
                      'email_marketing','bookkeeping','scheduling','field_service',
                      'restaurant_inventory','workforce')),
  best_for          text,
  summary           text,
  website_url       text,
  help_url          text,                         -- provider help / contact page
  contact_email     text,
  -- pricing (raw notes kept; parsed values beside them)
  has_free_plan     boolean,                      -- null = unknown, never false by default
  has_free_trial    boolean,
  pricing_notes     text,
  price_min_month   numeric,
  price_max_month   numeric,
  price_known       boolean not null default false,
  price_conflict    boolean not null default false, -- sources disagree (" | " in notes)
  is_usage_based    boolean,
  is_per_seat       boolean,
  -- evidence
  reviews           jsonb not null default '[]',  -- [{source, rating, count, is_customer}]
  sources           jsonb not null default '[]',  -- [{url, kind, biased}] kind: review_site|vendor|editorial|directory
  ai_features       text[] not null default '{}',
  integrations      text[] not null default '{}',
  unknowns          text[] not null default '{}',
  -- inferred by the enrichment task (labelled "estimated" in the UI)
  setup_complexity  int check (setup_complexity between 1 and 5),
  setup_time_class  text check (setup_time_class in ('same_day','few_days','needs_onboarding')),
  tech_level_needed int check (tech_level_needed between 1 and 5),
  outcomes          text[] not null default '{}',
  business_types    text[] not null default '{}',
  typical_use_cases text[] not null default '{}',
  enrichment        jsonb,                        -- {model, prompt_version, date, confidence}
  -- human judgement
  smb_fit_flag      text not null default 'good' check (smb_fit_flag in ('good','too_costly','too_heavy','unclear')),
  -- lifecycle
  embedding         vector(384),
  origin            text not null default 'seed' check (origin in ('seed','provider','discovered')),
  status            text not null default 'live' check (status in ('live','pending','rejected')),
  provider_id       uuid references auth.users(id),
  version           int not null default 1,
  last_checked_at   date,
  updated_at        timestamptz not null default now()
);
create index tools_category_idx on tools (category) where status = 'live';

create table users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  name                text,
  email               text,
  avatar_url          text,
  phone               text,                       -- optional; required only for SMS consent
  location            text,                       -- city or ZIP
  business_name       text,
  onboarding_complete boolean not null default false,
  created_at          timestamptz not null default now()
);

create table consents (
  user_id         uuid not null references users(id) on delete cascade,
  channel         text not null check (channel in ('email','sms')),
  granted         boolean not null,
  wording         text not null,                  -- exact text shown
  wording_version text not null,
  granted_at      timestamptz not null default now(),
  primary key (user_id, channel)
);

create table profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  answers     jsonb not null,                     -- raw questionnaire answers
  structured  jsonb not null,                     -- Profile schema (section 4, stage 1)
  summary     text,
  embedding   vector(384),
  is_current  boolean not null default true,
  version     int not null default 1,
  created_at  timestamptz not null default now()
);
create unique index profiles_one_current on profiles (user_id) where is_current;

create table recommendations (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references profiles(id) on delete cascade,
  tool_id         uuid not null references tools(id) on delete cascade,
  rank            int not null,
  fit             numeric not null,
  trust           numeric not null,
  final           numeric not null,
  quadrant        text not null check (quadrant in ('top_pick','thin_evidence','proven_weak_fit','skip')),
  breakdown       jsonb not null,                 -- N B A T I, R E S, unknown flags, notes
  explanation     jsonb,                          -- {one_line, why_it_fits, not_for, check_first, fallback}
  eta             jsonb,                          -- {low, likely, high, payback_months, estimate:true}
  scoring_version text not null,
  created_at      timestamptz not null default now()
);

-- Pre-generated sample businesses, viewable without signing in (judges, demo video)
create table demo_personas (
  slug            text primary key,               -- 'salon', 'restaurant', 'plumber'
  label           text not null,
  answers         jsonb not null,
  structured      jsonb not null,
  summary         text,
  results         jsonb,                          -- same shape as /api/recommend output
  generated_at    timestamptz
);

create table user_tools (
  user_id              uuid not null references users(id) on delete cascade,
  tool_id              uuid not null references tools(id) on delete cascade,
  status               text not null check (status in ('considering','using','dropped')),
  fit_at_pick          numeric,
  trust_at_pick        numeric,
  final_at_pick        numeric,                   -- baseline for better-tool alerts
  hours_saved_reported numeric,
  updated_at           timestamptz not null default now(),
  primary key (user_id, tool_id)
);

create table comments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  tool_id       uuid not null references tools(id) on delete cascade,
  body          text not null check (char_length(body) between 1 and 1000),
  rating        smallint check (rating between 1 and 5),
  display_name  text,                             -- first name only, shown publicly
  business_type text,                             -- snapshot, for "owners like you"
  sentiment     text check (sentiment in ('positive','neutral','negative')),
  topics        text[] not null default '{}',
  summary       text,
  created_at    timestamptz not null default now()
);
create index comments_tool_idx on comments (tool_id);

create table guides (
  tool_id        uuid not null references tools(id) on delete cascade,
  tech_level     int not null check (tech_level between 1 and 5),
  tool_version   int not null,
  body_md        text not null,
  model          text,
  prompt_version text,
  is_fallback    boolean not null default false,
  created_at     timestamptz not null default now(),
  primary key (tool_id, tech_level, tool_version)
);

create table guide_progress (
  user_id         uuid not null references users(id) on delete cascade,
  tool_id         uuid not null references tools(id) on delete cascade,
  completed_steps int[] not null default '{}',
  helpful         boolean,                        -- thumbs up / down
  updated_at      timestamptz not null default now(),
  primary key (user_id, tool_id)
);

create table notifications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  type             text not null default 'better_tool' check (type in ('better_tool','system')),
  tool_id          uuid references tools(id) on delete set null,
  replaces_tool_id uuid references tools(id) on delete set null,
  reason           text not null,                 -- one plain sentence
  scores           jsonb,
  channel          text not null default 'in_app' check (channel in ('in_app','email','sms')),
  created_at       timestamptz not null default now(),
  sent_at          timestamptz,
  read_at          timestamptz,
  clicked_at       timestamptz
);
create index notifications_user_idx on notifications (user_id, created_at desc);

create table chat_messages (
  id         bigserial primary key,
  user_id    uuid not null references users(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  role       text not null check (role in ('user','assistant','tool')),
  content    text not null,
  created_at timestamptz not null default now()
);
create index chat_user_idx on chat_messages (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 002_llm_tables.sql
-- ---------------------------------------------------------------------
create table llm_cache (
  cache_key  text primary key,
  task       text not null,
  result     jsonb not null,
  created_at timestamptz not null default now()
);

create table llm_usage (
  id            bigserial primary key,
  task          text,
  model         text,
  user_id       uuid,
  input_tokens  int,
  output_tokens int,
  est_cost_usd  numeric,
  cache_hit     boolean not null default false,
  fallback_used boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 003_auth_trigger.sql — a users row on first Google sign-in
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 004_rls.sql
-- Service role (server code) bypasses RLS. No policy = no access for browsers.
-- ---------------------------------------------------------------------
alter table tools           enable row level security;
alter table users           enable row level security;
alter table consents        enable row level security;
alter table profiles        enable row level security;
alter table recommendations enable row level security;
alter table demo_personas   enable row level security;
alter table user_tools      enable row level security;
alter table comments        enable row level security;
alter table guides          enable row level security;
alter table guide_progress  enable row level security;
alter table notifications   enable row level security;
alter table chat_messages   enable row level security;
alter table llm_cache       enable row level security;   -- no policies: server only
alter table llm_usage       enable row level security;   -- no policies: server only

-- catalog: public reads live tools; providers see and edit their own pending rows
create policy read_live_tools on tools
  for select using (status = 'live' or provider_id = auth.uid());
create policy provider_submit on tools
  for insert with check (auth.uid() = provider_id and status = 'pending' and origin = 'provider');
create policy provider_edit on tools
  for update using (auth.uid() = provider_id and status = 'pending')
  with check (auth.uid() = provider_id and status = 'pending');   -- cannot self-approve

create policy read_guides   on guides        for select using (true);
create policy read_demo     on demo_personas for select using (true);

-- own rows only
create policy own_user on users
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy own_consents on consents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_profiles on profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_recs on recommendations
  for select using (exists (
    select 1 from profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy own_user_tools on user_tools
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_progress on guide_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_notifications_read on notifications
  for select using (auth.uid() = user_id);
create policy own_notifications_mark on notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_chat on chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- comments: anyone (signed in or not) reads; owner writes
create policy read_comments on comments for select using (true);
create policy write_own_comments  on comments for insert with check (auth.uid() = user_id);
create policy edit_own_comments   on comments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy delete_own_comments on comments for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 005_functions.sql
-- ---------------------------------------------------------------------
-- "Owners like you" (only used when embeddings are on)
create or replace function match_profiles(query_embedding vector(384), match_count int default 10)
returns table (profile_id uuid, user_id uuid, similarity float)
language sql stable as $$
  select id, user_id, 1 - (embedding <=> query_embedding)
  from profiles
  where embedding is not null and is_current
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Per-tool community numbers for tool pages and the community signal
create or replace view tool_community as
select tool_id,
       count(*)                                         as comment_count,
       round(avg(rating)::numeric, 2)                   as avg_rating,
       avg(case sentiment when 'positive' then 1 when 'neutral' then 0.5 when 'negative' then 0 end) as sentiment_score
from comments
group by tool_id;
