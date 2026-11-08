import { Router } from 'express';
import { z } from 'zod';
import { db, q } from '../db.js';
import { requireAuth, publicUser } from '../security/auth.js';
import { sanitizeText } from '../security/sanitize.js';
import { publicTool } from '../features/format.js';

const r = Router();
export const CONSENT_WORDING = { email: 'Email me about updates to my search', sms: 'Text me about updates to my search' };
export const CONSENT_VERSION = 'v1';

const phoneRe = /^\+?[0-9 ()-]{7,20}$/;
const Settings = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  business_name: z.string().trim().max(160).optional().default(''),
  location: z.string().trim().max(120).optional().default(''),
  phone: z.string().trim().max(20).optional().default('').refine((p) => !p || phoneRe.test(p), 'Enter a valid phone number'),
  email_consent: z.boolean().default(false),
  sms_consent: z.boolean().default(false),
}).refine((s) => !s.sms_consent || !!s.phone, { message: 'Add a phone number to get text updates', path: ['phone'] });

async function saveConsents(userId, s) {
  const rows = ['email', 'sms'].map((ch) => ({ user_id: userId, channel: ch, granted: !!s[`${ch}_consent`], wording: CONSENT_WORDING[ch], wording_version: CONSENT_VERSION, granted_at: new Date().toISOString() }));
  await q(db().from('consents').upsert(rows, { onConflict: 'user_id,channel' }));
}

async function saveSettings(req, res, complete) {
  const p = Settings.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0].message, field: p.error.issues[0].path[0] });
  const s = p.data;
  const patch = { business_name: sanitizeText(s.business_name, 160) || null, location: sanitizeText(s.location, 120) || null, phone: s.phone || null };
  if (s.name) patch.name = sanitizeText(s.name, 120);
  if (complete) patch.onboarding_complete = true;
  const user = await q(db().from('users').update(patch).eq('id', req.user.id).select('*').single());
  await saveConsents(req.user.id, s);
  res.json({ user: publicUser(user) });
}

r.post('/onboarding', requireAuth, (req, res) => saveSettings(req, res, true));
r.put('/me/settings', requireAuth, (req, res) => saveSettings(req, res, false));

r.get('/me', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const uid = req.user.id;
  const [consents, saved, notes] = await Promise.all([
    q(db().from('consents').select('channel,granted,wording,wording_version,granted_at').eq('user_id', uid)),
    q(db().from('user_tools').select('status,fit_at_pick,final_at_pick,hours_saved_reported,updated_at,tools(*)').eq('user_id', uid).order('updated_at', { ascending: false })),
    q(db().from('notifications').select('id,type,reason,created_at,read_at,tool:tools!notifications_tool_id_fkey(slug,name),replaces:tools!notifications_replaces_tool_id_fkey(slug,name)').eq('user_id', uid).order('created_at', { ascending: false }).limit(20)),
  ]);
  res.json({
    user: publicUser(req.user), consents,
    saved: saved.map((s) => ({ status: s.status, hours_saved_reported: s.hours_saved_reported, updated_at: s.updated_at, tool: publicTool(s.tools) })),
    notifications: notes,
  });
});

r.post('/notifications/:id/read', requireAuth, async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ error: 'Bad id' });
  await q(db().from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id.data).eq('user_id', req.user.id));
  res.json({ ok: true });
});

export default r;
