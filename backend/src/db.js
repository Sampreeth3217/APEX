import { createClient } from '@supabase/supabase-js';
import { env, dbConfigured } from './env.js';
import { createLocalStore } from './localStore.js';

// Server-only data client. Supabase (service role) when its tables exist; otherwise a clearly reported local fallback.
let client = null;
export let dataBackend = 'not_configured';

async function init() {
  if (dbConfigured()) {
    const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await sb.from('tools').select('slug').limit(1);
    if (!error) { client = sb; dataBackend = 'supabase'; return; }
    console.warn(`[db] Supabase tables not available (${error.code || error.message}); using local fallback storage until migrations are applied.`);
  }
  if (process.env.MONGO_URL && process.env.DB_NAME) {
    client = await createLocalStore(process.env.MONGO_URL, process.env.DB_NAME);
    dataBackend = 'local_fallback';
  }
}
await init();

export function db() {
  if (!client) {
    const e = new Error('Database is not configured');
    e.status = 503;
    throw e;
  }
  return client;
}

export async function q(promise) {
  const { data, error } = await promise;
  if (error) {
    const e = new Error(`db: ${error.message}`);
    e.status = 500;
    throw e;
  }
  return data;
}

export const PUBLIC_TOOL_FIELDS = 'id,slug,name,category,best_for,summary,website_url,help_url,has_free_plan,has_free_trial,pricing_notes,price_min_month,price_max_month,price_known,price_conflict,is_usage_based,is_per_seat,reviews,sources,ai_features,integrations,unknowns,setup_complexity,setup_time_class,tech_level_needed,outcomes,business_types,typical_use_cases,enrichment,smb_fit_flag,origin,status,version,last_checked_at,updated_at';

let toolCache = { at: 0, rows: null };
export async function liveTools() {
  if (toolCache.rows && Date.now() - toolCache.at < 60_000) return toolCache.rows;
  const rows = await q(db().from('tools').select(PUBLIC_TOOL_FIELDS).eq('status', 'live'));
  toolCache = { at: Date.now(), rows };
  return rows;
}
export const invalidateTools = () => { toolCache = { at: 0, rows: null }; };
