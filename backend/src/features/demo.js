import { db, q, liveTools, invalidateTools } from '../db.js';
import { PERSONAS } from '../data/personas.js';
import { mapAnswers } from './profile.js';
import { profileSummary, enrichTool } from '../llm/tasks.js';
import { buildResults } from './recommendations.js';
import { getOrCreateGuide } from '../routes/actions.js';
import { PROMPT_VERSION } from '../llm/prompts.js';

export async function generateDemos({ guides = true } = {}) {
  const tools = await liveTools();
  const out = [];
  for (const p of PERSONAS) {
    const { answers, profile } = mapAnswers(p.answers);
    const s = await profileSummary(answers, profile, null);
    profile.summary = s.summary;
    const results = await buildResults(tools, profile, s.summary, null);
    await q(db().from('demo_personas').upsert({ slug: p.slug, label: p.label, answers, structured: profile, summary: s.summary, results, generated_at: new Date().toISOString() }));
    if (guides) for (const pick of results.picks) await getOrCreateGuide(tools.find((t) => t.id === pick.tool.id), profile.tech_comfort, profile, null);
    out.push({ slug: p.slug, picks: results.picks.map((x) => x.tool.name), shortfall: results.shortfall });
  }
  return out;
}

export async function enrichAll({ onlyIds } = {}) {
  let rows = await q(db().from('tools').select('*').in('status', ['live', 'pending']));
  if (onlyIds) rows = rows.filter((r) => onlyIds.includes(r.id));
  const stats = { done: 0, skipped: 0, failed: 0 };
  for (const t of rows) {
    if (t.enrichment?.prompt_version === PROMPT_VERSION) { stats.skipped += 1; continue; }
    const e = await enrichTool(t);
    if (!e) { stats.failed += 1; continue; }
    const { confidence, ...fields } = e;
    await q(db().from('tools').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', t.id));
    stats.done += 1;
  }
  invalidateTools();
  return stats;
}
