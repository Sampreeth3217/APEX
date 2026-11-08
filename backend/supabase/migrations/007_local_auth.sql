-- 007: self-hosted email + password sign-in (replaces the previous hosted Google login).
-- Server-only table: RLS on, no policies, accessed with the service-role key.
create table if not exists app_credentials (
  user_id       uuid primary key references users(id) on delete cascade,
  email         text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now()
);
alter table app_credentials enable row level security;
