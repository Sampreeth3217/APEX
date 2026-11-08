import fs from 'node:fs';
import pg from 'pg';
import '../src/env.js';

// Applies the canonical migration (unchanged) and numbered additive migrations, once each.
const url = process.env.SUPABASE_DB_URL;
if (!url) { console.error('SUPABASE_DB_URL is not set'); process.exit(1); }

const files = [
  ['001_005_idea_foundry_v2.sql', new URL('../supabase/source/idea_foundry_migrations_v2.sql', import.meta.url)],
  ['006_app_additions.sql', new URL('../supabase/migrations/006_app_additions.sql', import.meta.url)],
  ['007_local_auth.sql', new URL('../supabase/migrations/007_local_auth.sql', import.meta.url)],
];

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query('create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now())');
await client.query('alter table public.schema_migrations enable row level security');
for (const [name, path] of files) {
  const done = await client.query('select 1 from public.schema_migrations where name = $1', [name]);
  if (done.rowCount) { console.log(`skip ${name} (already applied)`); continue; }
  if (name.startsWith('001')) {
    const exists = await client.query("select to_regclass('public.tools') as t");
    if (exists.rows[0].t) { console.log(`skip ${name}: tables already exist, not touching them`); await client.query('insert into public.schema_migrations(name) values ($1)', [name]); continue; }
  }
  const sql = fs.readFileSync(path, 'utf8');
  try {
    await client.query('begin');
    await client.query(sql);
    await client.query('insert into public.schema_migrations(name) values ($1)', [name]);
    await client.query('commit');
    console.log(`applied ${name}`);
  } catch (e) {
    await client.query('rollback');
    console.error(`failed ${name}: ${e.message}`);
    process.exit(1);
  }
}
await client.query("notify pgrst, 'reload schema'");
await client.end();
