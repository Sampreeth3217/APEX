import { db, q } from '../src/db.js';
import { loadCsvTools } from './seed-dry.js';
import { seedReport } from '../src/scoring/parse.js';

// Idempotent: upsert by slug. Existing enrichment fields are left untouched.
const tools = loadCsvTools();
const report = seedReport(tools);
const existing = await q(db().from('tools').select('slug,version,pricing_notes,summary'));
const bySlug = Object.fromEntries(existing.map((t) => [t.slug, t]));
let inserted = 0; let updated = 0;
for (const t of tools) {
  const prev = bySlug[t.slug];
  const row = { ...t, updated_at: new Date().toISOString() };
  if (prev) {
    const changed = prev.pricing_notes !== t.pricing_notes || prev.summary !== t.summary;
    if (changed) row.version = prev.version + 1;
    updated += 1;
  } else inserted += 1;
  await q(db().from('tools').upsert(row, { onConflict: 'slug' }));
}
console.log(JSON.stringify({ ...report, inserted, updated }, null, 2));
