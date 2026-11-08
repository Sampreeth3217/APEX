import { llmClient, modelFor, budgetStatus, logUsage, TASKS } from '../llm/call.js';
import { prompts } from '../llm/prompts.js';
import { llmConfigured } from '../env.js';
import { liveTools, db, q } from '../db.js';
import { publicTool, priceText } from './format.js';
import { CATEGORY_SLUGS } from '../data/categories.js';
import { untrusted } from '../security/sanitize.js';

export const CHAT_FUNCTIONS = [
  { type: 'function', function: { name: 'search_tools', description: 'Find up to 5 tools in a category.', parameters: { type: 'object', properties: { category: { type: 'string', enum: CATEGORY_SLUGS }, max_price_per_month: { type: ['number', 'null'] }, free_only: { type: 'boolean' } }, required: ['category'] } } },
  { type: 'function', function: { name: 'get_tool', description: 'Full record for one tool, with unknowns and sources.', parameters: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] } } },
  { type: 'function', function: { name: 'compare_tools', description: 'Side-by-side data for 2 or 3 tools.', parameters: { type: 'object', properties: { slugs: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 3 } }, required: ['slugs'] } } },
  { type: 'function', function: { name: 'update_needs', description: "Update the owner's needs (1-2 category slugs).", parameters: { type: 'object', properties: { needs: { type: 'array', items: { type: 'string', enum: CATEGORY_SLUGS }, minItems: 1, maxItems: 2 } }, required: ['needs'] } } },
];

const summaryOf = (t) => ({ slug: t.slug, name: t.name, category: t.category, best_for: t.best_for, price: priceText(t), has_free_plan: t.has_free_plan, has_free_trial: t.has_free_trial });
const detailOf = (t) => { const p = publicTool(t); return { ...summaryOf(t), summary: p.summary, pricing_notes: p.pricing_notes, ai_features: p.ai_features, integrations: p.integrations, unknowns: p.unknowns, sources: p.sources, help_url: p.help_url, website_url: p.website_url, smb_fit_flag: p.smb_fit_flag }; };

export async function runFunction(name, args, ctx) {
  const tools = await liveTools();
  if (name === 'search_tools') {
    if (!CATEGORY_SLUGS.includes(args.category)) return { error: 'unknown category' };
    let list = tools.filter((t) => t.category === args.category);
    if (args.free_only) list = list.filter((t) => t.has_free_plan === true || t.has_free_trial === true);
    if (typeof args.max_price_per_month === 'number') list = list.filter((t) => t.has_free_plan === true || (t.price_min_month !== null && Number(t.price_min_month) <= args.max_price_per_month));
    return { tools: list.slice(0, 5).map(summaryOf) };
  }
  if (name === 'get_tool') { const t = tools.find((x) => x.slug === String(args.slug)); return t ? detailOf(t) : { error: 'not found' }; }
  if (name === 'compare_tools') {
    const slugs = (Array.isArray(args.slugs) ? args.slugs : []).slice(0, 3);
    return { tools: slugs.map((s) => tools.find((x) => x.slug === s)).filter(Boolean).map(detailOf) };
  }
  if (name === 'update_needs') {
    const needs = (Array.isArray(args.needs) ? args.needs : []).filter((n) => CATEGORY_SLUGS.includes(n)).slice(0, 2);
    if (!needs.length) return { error: 'no valid needs' };
    if (!ctx.userId) return { ok: false, message: 'This is a sample business, so needs cannot be saved. Suggest the owner start their own search.' };
    const cur = await q(db().from('profiles').select('*').eq('user_id', ctx.userId).eq('is_current', true).maybeSingle());
    if (!cur) return { ok: false, message: 'No saved profile yet.' };
    const structured = { ...cur.structured, primary_needs: needs, hours_per_week: Object.fromEntries(needs.map((n) => [n, cur.structured.hours_per_week?.[n] ?? 3])) };
    await q(db().from('profiles').update({ is_current: false }).eq('id', cur.id));
    await q(db().from('profiles').insert({ user_id: ctx.userId, answers: { ...cur.answers, needs }, structured, summary: cur.summary, version: cur.version + 1, is_current: true }));
    return { ok: true, needs, message: 'Needs updated. Offer to refresh recommendations on the dashboard.', refresh: true };
  }
  return { error: 'unknown function' };
}

// Streams events to `send`: {type:'text', text} | {type:'action', ...} | {type:'done'}
export async function streamChat({ history, profile, top3, userId, send }) {
  const fallback = () => { send({ type: 'fallback', text: 'The helper is busy right now. You can still browse your results and the marketplace.', links: [{ href: '/dashboard', label: 'My results' }, { href: '/tools', label: 'Marketplace' }] }); };
  if (!llmConfigured()) { await logUsage({ task: 'chat', user_id: userId || null, fallback_used: true }); return fallback(); }
  if ((await budgetStatus()).blocked) { await logUsage({ task: 'chat', user_id: userId || null, fallback_used: true }); return fallback(); }
  const messages = [{ role: 'system', content: prompts.chatSystem(profile, top3) },
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.role === 'user' ? untrusted(m.content, 1500) : m.content.slice(0, 2000) }))];
  const model = modelFor('cheap');
  let full = '';
  for (let round = 0; round < 3; round += 1) {
    let stream;
    try {
      stream = await llmClient().chat.completions.create({ model, messages, tools: CHAT_FUNCTIONS, tool_choice: round === 2 ? 'none' : 'auto', stream: true, max_tokens: TASKS.chat.maxTokens, temperature: TASKS.chat.temperature, usage: { include: true }, reasoning: { enabled: false } });
    } catch (e) {
      console.error('chat provider error', e.status || '', e.message?.slice(0, 120));
      await logUsage({ task: 'chat', model, user_id: userId || null, fallback_used: true });
      if (!full) fallback();
      return full;
    }
    const calls = {};
    let usage = null;
    for await (const chunk of stream) {
      if (chunk.usage) usage = chunk.usage;
      const d = chunk.choices?.[0]?.delta;
      if (!d) continue;
      if (d.content) { full += d.content; send({ type: 'text', text: d.content }); }
      for (const tc of d.tool_calls || []) {
        const c = (calls[tc.index] ||= { id: '', name: '', args: '' });
        if (tc.id) c.id = tc.id;
        if (tc.function?.name) c.name += tc.function.name;
        if (tc.function?.arguments) c.args += tc.function.arguments;
      }
    }
    await logUsage({ task: 'chat', model, user_id: userId || null, input_tokens: usage?.prompt_tokens, output_tokens: usage?.completion_tokens, est_cost_usd: Number(usage?.cost ?? 0) });
    const list = Object.values(calls).filter((c) => c.name);
    if (!list.length) break;
    messages.push({ role: 'assistant', content: null, tool_calls: list.map((c) => ({ id: c.id, type: 'function', function: { name: c.name, arguments: c.args || '{}' } })) });
    for (const c of list) {
      let args = {};
      try { args = JSON.parse(c.args || '{}'); } catch { /* invalid args */ }
      const result = await runFunction(c.name, args, { userId });
      if (c.name === 'update_needs' && result.refresh) send({ type: 'action', action: 'refresh', needs: result.needs });
      messages.push({ role: 'tool', tool_call_id: c.id, content: JSON.stringify(result).slice(0, 8000) });
    }
  }
  if (!full) fallback();
  return full;
}
