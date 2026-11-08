import { Router } from 'express';
import { z } from 'zod';
import { db, q, liveTools } from '../db.js';
import { requireAuth, optionalAuth } from '../security/auth.js';
import { limit } from '../security/rateLimit.js';
import { sanitizeText, firstName, safeUrl } from '../security/sanitize.js';
import { generateGuide, fallbackGuide, tagComment, enrichTool } from '../llm/tasks.js';
import { scoreTool } from '../scoring/rank.js';
import { priorMeans } from '../scoring/trust.js';
import { CATEGORY_SLUGS } from '../data/categories.js';
import { PROMPT_VERSION } from '../llm/prompts.js';

const r = Router();
const Slug = z.string().max(80).regex(/^[a-z0-9-]+$/);

export async function getOrCreateGuide(tool, techLevel, profile, userId, { generate = true } = {}) {
  const cached = await q(db().from('guides').select('*').eq('tool_id', tool.id).eq('tech_level', techLevel).eq('tool_version', tool.version).maybeSingle());
  if (cached && !cached.is_fallback) return cached;
  if (!generate) return cached || { tool_id: tool.id, tech_level: techLevel, tool_version: tool.version, body_md: fallbackGuide(tool), is_fallback: true };
  const g = await generateGuide(tool, techLevel, profile, userId);
  const row = { tool_id: tool.id, tech_level: techLevel, tool_version: tool.version, body_md: g.body_md, model: g.model, prompt_version: PROMPT_VERSION, is_fallback: g.is_fallback };
  await q(db().from('guides').upsert(row));
  return row;
}

r.post('/guide', optionalAuth, limit('recommend'), async (req, res) => {
  const p = z.object({ slug: Slug, persona: z.string().max(40).optional() }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Unknown tool' });
  const tool = (await liveTools()).find((t) => t.slug === p.data.slug);
  if (!tool) return res.status(404).json({ error: 'Tool not found' });
  if (!req.user) {
    const persona = p.data.persona && await q(db().from('demo_personas').select('structured').eq('slug', p.data.persona).maybeSingle());
    if (!persona) return res.status(401).json({ error: 'Sign in to get a setup guide made for you, or open one from a sample business.' });
    const g = await getOrCreateGuide(tool, persona.structured.tech_comfort, null, null, { generate: false });
    return res.json({ guide: g, tech_level: persona.structured.tech_comfort, read_only: true, tool: { slug: tool.slug, name: tool.name, help_url: tool.help_url, website_url: tool.website_url } });
  }
  const prof = await q(db().from('profiles').select('structured').eq('user_id', req.user.id).eq('is_current', true).maybeSingle());
  const tech = prof?.structured?.tech_comfort || 3;
  const g = await getOrCreateGuide(tool, tech, prof?.structured, req.user.id);
  const progress = await q(db().from('guide_progress').select('completed_steps,helpful').eq('user_id', req.user.id).eq('tool_id', tool.id).maybeSingle());
  res.json({ guide: g, tech_level: tech, read_only: false, progress, tool: { slug: tool.slug, name: tool.name, help_url: tool.help_url, website_url: tool.website_url } });
});

r.put('/guide-progress/:slug', requireAuth, limit('write'), async (req, res) => {
  const p = z.object({ completed_steps: z.array(z.number().int().min(0).max(100)).max(100).optional(), helpful: z.boolean().nullable().optional() }).safeParse(req.body);
  const s = Slug.safeParse(req.params.slug);
  if (!p.success || !s.success) return res.status(400).json({ error: 'Invalid progress' });
  const tool = (await liveTools()).find((t) => t.slug === s.data);
  if (!tool) return res.status(404).json({ error: 'Tool not found' });
  const cur = await q(db().from('guide_progress').select('*').eq('user_id', req.user.id).eq('tool_id', tool.id).maybeSingle());
  const row = { user_id: req.user.id, tool_id: tool.id, completed_steps: p.data.completed_steps ?? cur?.completed_steps ?? [], helpful: p.data.helpful !== undefined ? p.data.helpful : cur?.helpful ?? null, updated_at: new Date().toISOString() };
  await q(db().from('guide_progress').upsert(row));
  res.json({ progress: row });
});

r.post('/user-tools', requireAuth, limit('write'), async (req, res) => {
  const p = z.object({ slug: Slug, status: z.enum(['considering', 'using', 'dropped']), hours_saved_reported: z.number().min(0).max(80).nullable().optional(), comment: z.string().max(200).optional() }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Invalid request' });
  const tools = await liveTools();
  const tool = tools.find((t) => t.slug === p.data.slug);
  if (!tool) return res.status(404).json({ error: 'Tool not found' });
  const existing = await q(db().from('user_tools').select('*').eq('user_id', req.user.id).eq('tool_id', tool.id).maybeSingle());
  const row = { user_id: req.user.id, tool_id: tool.id, status: p.data.status, updated_at: new Date().toISOString() };
  if (!existing) {
    const prof = await q(db().from('profiles').select('structured').eq('user_id', req.user.id).eq('is_current', true).maybeSingle());
    if (prof) {
      const s = scoreTool(tool, prof.structured, priorMeans(tools));
      Object.assign(row, { fit_at_pick: s.fit, trust_at_pick: s.trust, final_at_pick: s.final });
    }
  }
  if (p.data.hours_saved_reported !== undefined) row.hours_saved_reported = p.data.hours_saved_reported;
  await q(db().from('user_tools').upsert(row));
  if (p.data.status === 'using' && p.data.comment?.trim()) await addComment(req.user, tool, p.data.comment, null);
  res.json({ ok: true, status: row.status });
});

async function addComment(user, tool, body, rating) {
  const prof = await q(db().from('profiles').select('structured').eq('user_id', user.id).eq('is_current', true).maybeSingle());
  const row = await q(db().from('comments').insert({ user_id: user.id, tool_id: tool.id, body: sanitizeText(body, 1000), rating, display_name: firstName(user.name), business_type: prof?.structured?.business_type || null }).select('*').single());
  const tags = await tagComment(row.id, row.body, user.id);
  if (tags) await q(db().from('comments').update({ sentiment: tags.sentiment, topics: tags.topics, summary: tags.summary }).eq('id', row.id));
  return { ...row, ...(tags || {}) };
}

r.post('/comments', requireAuth, limit('write'), async (req, res) => {
  const p = z.object({ slug: Slug, body: z.string().trim().min(1).max(1000), rating: z.number().int().min(1).max(5).nullable().optional() }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Write a comment between 1 and 1000 characters.' });
  const tool = (await liveTools()).find((t) => t.slug === p.data.slug);
  if (!tool) return res.status(404).json({ error: 'Tool not found' });
  const c = await addComment(req.user, tool, p.data.body, p.data.rating ?? null);
  const { user_id, ...pub } = c;
  res.json({ comment: pub });
});

const Provider = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.enum(CATEGORY_SLUGS),
  best_for: z.string().trim().max(300).optional().default(''),
  summary: z.string().trim().min(10).max(1000),
  website_url: z.string().url().max(300),
  help_url: z.string().url().max(300).optional().or(z.literal('')),
  contact_email: z.string().email().max(200),
  pricing_notes: z.string().trim().max(500).optional().default(''),
  has_free_plan: z.boolean().nullable().optional(),
  has_free_trial: z.boolean().nullable().optional(),
  ai_features: z.array(z.string().max(120)).max(15).optional().default([]),
  integrations: z.array(z.string().max(80)).max(30).optional().default([]),
});

const toRow = (d) => ({
  name: sanitizeText(d.name, 120), category: d.category, best_for: sanitizeText(d.best_for, 300) || null, summary: sanitizeText(d.summary, 1000),
  website_url: safeUrl(d.website_url), help_url: safeUrl(d.help_url) || null, contact_email: d.contact_email.toLowerCase(),
  pricing_notes: sanitizeText(d.pricing_notes, 500) || null, has_free_plan: d.has_free_plan ?? null, has_free_trial: d.has_free_trial ?? null,
  ai_features: d.ai_features.map((x) => sanitizeText(x, 120)).filter(Boolean), integrations: d.integrations.map((x) => sanitizeText(x, 80)).filter(Boolean),
  sources: safeUrl(d.website_url) ? [{ url: safeUrl(d.website_url), kind: 'vendor', biased: true }] : [],
  unknowns: ['Independent reviews', 'Verified pricing'],
});

r.post('/providers', requireAuth, limit('write'), async (req, res) => {
  const p = Provider.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: `${p.error.issues[0].path[0] || 'Form'}: ${p.error.issues[0].message}`, field: p.error.issues[0].path[0] });
  const base = toRow(p.data);
  const slug = `${base.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)}-${Date.now().toString(36).slice(-4)}`;
  const row = await q(db().from('tools').insert({ ...base, slug, status: 'pending', origin: 'provider', provider_id: req.user.id, price_known: false }).select('id,slug,name,status').single());
  res.json({ tool: row });
});

r.get('/providers/mine', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ tools: await q(db().from('tools').select('id,slug,name,category,status,updated_at').eq('provider_id', req.user.id).order('updated_at', { ascending: false })) });
});

r.put('/providers/:id', requireAuth, limit('write'), async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  const p = Provider.safeParse(req.body);
  if (!id.success || !p.success) return res.status(400).json({ error: 'Invalid submission' });
  const updated = await q(db().from('tools').update({ ...toRow(p.data), updated_at: new Date().toISOString() }).eq('id', id.data).eq('provider_id', req.user.id).eq('status', 'pending').select('id,status'));
  if (!updated.length) return res.status(404).json({ error: 'Only your own pending submissions can be edited.' });
  res.json({ tool: updated[0] });
});

export { enrichTool };
export default r;
