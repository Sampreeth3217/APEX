import crypto from 'node:crypto';
import { MongoClient } from 'mongodb';

// Temporary local store with the same query-builder subset the app uses from supabase-js.
// Used only while the Supabase tables are not yet created (see /api/healthz "database").
const PK = {
  tools: ['slug'], users: ['id'], consents: ['user_id', 'channel'], user_tools: ['user_id', 'tool_id'], guides: ['tool_id', 'tech_level', 'tool_version'],
  guide_progress: ['user_id', 'tool_id'], llm_cache: ['cache_key'], demo_personas: ['slug'], app_sessions: ['token_hash'], app_credentials: ['user_id'],
};
const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
const DEFAULTS = {
  tools: () => ({ id: uid(), status: 'live', origin: 'seed', version: 1, price_known: false, price_conflict: false, reviews: [], sources: [], ai_features: [], integrations: [], unknowns: [], outcomes: [], business_types: [], typical_use_cases: [], smb_fit_flag: 'good', updated_at: now() }),
  users: () => ({ onboarding_complete: false, created_at: now() }),
  profiles: () => ({ id: uid(), is_current: true, version: 1, created_at: now() }),
  recommendations: () => ({ id: uid(), created_at: now() }),
  comments: () => ({ id: uid(), topics: [], created_at: now() }),
  notifications: () => ({ id: uid(), type: 'better_tool', channel: 'in_app', created_at: now(), read_at: null }),
  chat_messages: () => ({ id: uid(), created_at: now() }),
  llm_usage: () => ({ id: uid(), cache_hit: false, fallback_used: false, created_at: now() }),
  llm_cache: () => ({ created_at: now() }),
  guides: () => ({ is_fallback: false, created_at: now() }),
  guide_progress: () => ({ completed_steps: [], updated_at: now() }),
  consents: () => ({ granted_at: now() }),
  user_tools: () => ({ updated_at: now() }),
  app_sessions: () => ({ created_at: now() }),
  admin_audit: () => ({ id: uid(), created_at: now() }),
};

function splitTop(s) {
  const out = []; let depth = 0; let cur = '';
  for (const ch of s) {
    if (ch === '(') depth += 1; if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

class Query {
  constructor(store, table) { Object.assign(this, { store, table, op: 'select', filters: [], sorts: [], fields: '*', returning: false, lim: 0, one: null }); }
  select(f = '*') { if (this.op !== 'select') this.returning = true; this.fields = f; return this; }
  insert(rows) { this.op = 'insert'; this.rows = [].concat(rows); return this; }
  upsert(rows, opts = {}) { this.op = 'upsert'; this.rows = [].concat(rows); this.opts = opts; return this; }
  update(patch) { this.op = 'update'; this.patch = patch; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(c, v) { this.filters.push({ [c]: v }); return this; }
  in(c, v) { this.filters.push({ [c]: { $in: v } }); return this; }
  gt(c, v) { this.filters.push({ [c]: { $gt: v } }); return this; }
  gte(c, v) { this.filters.push({ [c]: { $gte: v } }); return this; }
  ilike(c, v) { this.filters.push({ [c]: { $regex: `^${String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }); return this; }
  order(c, o = {}) { this.sorts.push([c, o.ascending === false ? -1 : 1]); return this; }
  limit(n) { this.lim = n; return this; }
  maybeSingle() { this.one = 'maybe'; return this; }
  single() { this.one = 'single'; return this; }
  then(res, rej) {
    return this.exec().then((data) => ({ data, error: null }), (e) => ({ data: null, error: { message: e.message } })).then(res, rej);
  }

  get col() { return this.store.db.collection(this.table); }
  get where() { return this.filters.length ? { $and: this.filters } : {}; }

  async project(rows) {
    if (this.fields === '*') return rows;
    const parts = splitTop(this.fields);
    const out = [];
    for (const r of rows) {
      const o = {};
      for (const p of parts) {
        const j = p.match(/^(?:(\w+):)?(\w+)(?:!(\w+))?\((.*)\)$/);
        if (!j) { o[p] = r[p] ?? null; continue; }
        const [, alias, table, fk, cols] = j;
        const key = fk?.includes('replaces_tool_id') ? 'replaces_tool_id' : 'tool_id';
        const doc = r[key] ? await this.store.db.collection(table).findOne({ id: r[key] }, { projection: { _id: 0 } }) : null;
        o[alias || table] = doc && cols !== '*' ? Object.fromEntries(splitTop(cols).map((c) => [c, doc[c] ?? null])) : doc;
      }
      out.push(o);
    }
    return out;
  }

  async find(where) {
    let cur = this.col.find(where, { projection: { _id: 0 } });
    if (this.sorts.length) cur = cur.sort(this.sorts);
    if (this.lim) cur = cur.limit(this.lim);
    return cur.toArray();
  }

  async exec() {
    let rows;
    if (this.table === 'tool_community') {
      const tid = this.filters.find((f) => f.tool_id)?.tool_id;
      const cs = await this.store.db.collection('comments').find(tid ? { tool_id: tid } : {}).toArray();
      const rated = cs.filter((c) => c.rating);
      rows = cs.length ? [{ tool_id: tid, comment_count: cs.length, avg_rating: rated.length ? Math.round((rated.reduce((s, c) => s + c.rating, 0) / rated.length) * 100) / 100 : null }] : [];
    } else if (this.op === 'select') rows = await this.find(this.where);
    else if (this.op === 'insert') {
      const docs = this.rows.map((r) => ({ ...(DEFAULTS[this.table]?.() || {}), ...r }));
      await this.col.insertMany(docs.map((d) => ({ ...d })));
      rows = docs;
    } else if (this.op === 'upsert') {
      const keys = this.opts.onConflict ? this.opts.onConflict.split(',') : PK[this.table];
      rows = [];
      for (const r of this.rows) {
        const k = Object.fromEntries(keys.map((x) => [x, r[x]]));
        const existing = await this.col.findOne(k);
        if (existing && this.opts.ignoreDuplicates) continue;
        const base = existing ? {} : (DEFAULTS[this.table]?.() || {});
        const doc = { ...base, ...r };
        await this.col.updateOne(k, { $set: doc }, { upsert: true });
        rows.push(await this.col.findOne(k, { projection: { _id: 0 } }));
      }
    } else if (this.op === 'update') {
      const ids = (await this.col.find(this.where, { projection: { _id: 1 } }).toArray()).map((d) => d._id);
      await this.col.updateMany({ _id: { $in: ids } }, { $set: this.patch });
      rows = await this.col.find({ _id: { $in: ids } }, { projection: { _id: 0 } }).toArray();
    } else if (this.op === 'delete') { await this.col.deleteMany(this.where); rows = []; }
    if (this.op !== 'select' && !this.returning && !this.one) return null;
    rows = await this.project(rows);
    if (this.one === 'single') { if (rows.length !== 1) throw new Error('expected one row'); return rows[0]; }
    if (this.one === 'maybe') return rows[0] ?? null;
    return rows;
  }
}

export async function createLocalStore(url, dbName) {
  const client = new MongoClient(url);
  await client.connect();
  const store = { db: client.db(dbName) };
  for (const [t, k] of Object.entries(PK)) await store.db.collection(t).createIndex(Object.fromEntries(k.map((x) => [x, 1])), { unique: true }).catch(() => {});
  return {
    from: (t) => new Query(store, t),
    auth: { admin: { createUser: async () => ({ data: { user: { id: uid() } }, error: null }), listUsers: async () => ({ data: { users: [] } }) } },
  };
}
