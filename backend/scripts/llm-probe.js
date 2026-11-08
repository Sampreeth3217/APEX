import { llmClient } from '../src/llm/call.js';
import { env } from '../src/env.js';
const r = await llmClient().chat.completions.create({ model: env.LLM_MODEL_CHEAP, max_tokens: 600, temperature: 0, response_format: { type: 'json_object' }, usage: { include: true },
  messages: [{ role: 'system', content: 'Return JSON {"a": number}' }, { role: 'user', content: 'a=1' }] }).catch((e) => ({ err: e.status + ' ' + e.message }));
console.log(JSON.stringify(r).slice(0, 1500));
