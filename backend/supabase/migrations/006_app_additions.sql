-- 006_app_additions.sql — additive only.
-- Why: sign-in is handled by the app itself (see 007_local_auth.sql) (not Supabase Auth sessions), so the server keeps
-- its own hashed session table. Approval audit fields + admin audit log support the admin requirements.
create table if not exists app_sessions (
  token_hash text primary key,
  user_id    uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists app_sessions_user_idx on app_sessions (user_id);
alter table app_sessions enable row level security;   -- no policies: server only

alter table tools add column if not exists approved_by uuid references users(id);
alter table tools add column if not exists approved_at timestamptz;

create table if not exists admin_audit (
  id         bigserial primary key,
  admin_id   uuid references users(id) on delete set null,
  action     text not null,
  target     text,
  details    jsonb,
  created_at timestamptz not null default now()
);
alter table admin_audit enable row level security;    -- no policies: server only

create index if not exists llm_usage_created_idx on llm_usage (created_at);
create index if not exists user_tools_status_idx on user_tools (status);
create index if not exists recommendations_profile_idx on recommendations (profile_id);
