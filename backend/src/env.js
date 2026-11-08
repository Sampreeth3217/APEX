import fs from 'node:fs';
import { z } from 'zod';

const envPath = new URL('../.env', import.meta.url);
if (fs.existsSync(envPath)) {
  try { process.loadEnvFile(envPath); } catch { /* already loaded by parent */ }
}

const schema = z.object({
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  SUPABASE_DB_URL: z.string().min(10).optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  LLM_MODEL_CHEAP: z.string().optional(),
  LLM_MODEL_MID: z.string().optional(),
  LLM_DISABLED: z.string().optional(),
  EMBED_MODEL: z.string().default('none'),
  LLM_DAILY_BUDGET_USD: z.coerce.number().default(3),
  LLM_TOTAL_BUDGET_USD: z.coerce.number().default(20),
  CRON_SECRET: z.string().optional(),
  ADMIN_EMAILS: z.string().default(''),
  DEMO_MODE: z.string().default('true'),
  APP_URL: z.string().optional(),
  PORT: z.coerce.number().default(8002),
});

export const env = schema.parse(process.env);
// The owner asked us to pick the models ("whatever is best"); any value that is not a model id falls back to these.
const isModelId = (v) => !!v && /^[~\w.-]+\/[\w.:-]+$/.test(v);
env.LLM_MODEL_CHEAP = isModelId(env.LLM_MODEL_CHEAP) ? env.LLM_MODEL_CHEAP : process.env.LLM_DEFAULT_MODEL_CHEAP;
env.LLM_MODEL_MID = isModelId(env.LLM_MODEL_MID) ? env.LLM_MODEL_MID : process.env.LLM_DEFAULT_MODEL_MID;
export const adminEmails = env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
export const dbConfigured = () => !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
export const llmConfigured = () => !!(env.OPENROUTER_API_KEY && env.LLM_MODEL_CHEAP && env.LLM_MODEL_MID) && env.LLM_DISABLED !== 'true';
