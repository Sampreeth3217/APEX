import crypto from 'node:crypto';
import OpenAI from 'openai';
import { env, llmConfigured, dbConfigured } from '../env.js';
import { db, q } from '../db.js';

export const TASKS = {
  enrich: { tier: 'cheap', maxTokens: 600, temperature: 0 },
  profile: { tier: 'cheap', maxTokens: 500, temperature: 0 },
  explain: { tier: 'cheap', maxTokens: 900, temperature: 0.3 },
  chat: { tier: 'cheap', maxTokens: 400, temperature: 0.4 },
  tag_comment: { tier: 'cheap', maxTokens: 150, temperature: 0 },
  compare: { tier: 'cheap', maxTokens: 300, temperature: 0.2 },
  guide: { tier: 'mid', maxTokens: 1800, temperature: 0.3 },
};

let client = null;
export function llmClient() {
  if (!client) client = new OpenAI({ apiKey: env.OPENROUTER_API_KEY, baseURL: 'https://openrouter.ai/api/v1', timeout: 30_000, maxRetries: 1 });
  return client;
}
export const modelFor = (tier) => (tier === 'mid' ? env.LLM_MODEL_MID : env.LLM_MODEL_CHEAP);
export const hashKey = (...parts) => crypto.createHash('sha256').update(JSON.stringify(parts)).digest('hex');

export async function logUsage(row) {
  if (!dbConfigured()) return;
  try { await q(db().from('llm_usage').insert(row)); } catch (e) { console.error('llm_usage log failed', e.message); }
}

export async function spend() {
  const since = new Date(); since.setUTCHours(0, 0, 0, 0);
  const rows = await q(db().from('llm_usage').select('est_cost_usd,created_at').gt('est_cost_usd', 0).limit(100000));
  const total = rows.reduce((s, r) => s + Number(r.est_cost_usd || 0), 0);
  const today = rows.filter((r) => new Date(r.created_at) >= since).reduce((s, r) => s + Number(r.est_cost_usd || 0), 0);
  return { today, total };
}

export async function budgetStatus() {
  const s = await spend();
  return { ...s, daily_cap: env.LLM_DAILY_BUDGET_USD, total_cap: env.LLM_TOTAL_BUDGET_USD, blocked: s.today >= env.LLM_DAILY_BUDGET_USD || s.total >= env.LLM_TOTAL_BUDGET_USD };
}

function parseJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  return JSON.parse(m ? m[0] : text);
}

// Cheap tier: thinking off so the output budget goes to the answer. Mid tier models may require thinking:
// give it a small fixed budget on top of the task's output cap.
const REASONING_BUDGET = 1024;
export const reasoningOpts = (cfg) => (cfg.tier === 'mid'
  ? { max_tokens: cfg.maxTokens + REASONING_BUDGET, reasoning: { max_tokens: REASONING_BUDGET, exclude: true } }
  : { max_tokens: cfg.maxTokens, reasoning: { enabled: false } });

const costOf = (usage) => Number(usage?.cost ?? 0);

// The single wrapper for all LLM traffic. Returns { ok, result, fallback, reason }.
export async function callLLM({ task, messages, schema, cacheKey, userId, validate, json = !!schema }) {
  const cfg = TASKS[task];
  const base = { task, model: modelFor(cfg.tier) || null, user_id: userId || null };
  if (!llmConfigured()) { await logUsage({ ...base, fallback_used: true }); return { ok: false, fallback: true, reason: 'off' }; }
  if (cacheKey) {
    const hit = await q(db().from('llm_cache').select('result').eq('cache_key', cacheKey).maybeSingle());
    if (hit) { await logUsage({ ...base, cache_hit: true }); return { ok: true, result: hit.result, cached: true }; }
  }
  const budget = await budgetStatus();
  if (budget.blocked) { await logUsage({ ...base, fallback_used: true }); return { ok: false, fallback: true, reason: 'budget' }; }

  let msgs = [...messages];
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let resp;
    try {
      resp = await llmClient().chat.completions.create({
        model: base.model, messages: msgs, temperature: cfg.temperature, ...reasoningOpts(cfg),
        ...(json ? { response_format: { type: 'json_object' } } : {}), usage: { include: true },
      });
    } catch (e) {
      console.error(`llm ${task} provider error: ${e.status || ''} ${e.message?.slice(0, 120)}`);
      await logUsage({ ...base, fallback_used: true });
      return { ok: false, fallback: true, reason: 'provider' };
    }
    const text = resp.choices?.[0]?.message?.content || '';
    await logUsage({ ...base, input_tokens: resp.usage?.prompt_tokens, output_tokens: resp.usage?.completion_tokens, est_cost_usd: costOf(resp.usage) });
    try {
      let result = json ? parseJson(text) : text;
      if (schema) result = schema.parse(result);
      if (validate) { const err = validate(result); if (err) throw new Error(err); }
      if (cacheKey) await q(db().from('llm_cache').upsert({ cache_key: cacheKey, task, result: json ? result : { text: result } }));
      return { ok: true, result: json ? result : { text: result } };
    } catch (e) {
      msgs = [...messages, { role: 'assistant', content: text.slice(0, 4000) }, { role: 'user', content: `That output was invalid: ${String(e.message).slice(0, 400)}. Return a corrected answer only.` }];
    }
  }
  await logUsage({ ...base, fallback_used: true });
  return { ok: false, fallback: true, reason: 'invalid' };
}
