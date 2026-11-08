import { Router } from 'express';
import { z } from 'zod';
import { db, q } from '../db.js';
import { ensureUser, createSession, hashToken, tokenFrom, requireAuth, publicUser } from '../security/auth.js';
import { sanitizeText } from '../security/sanitize.js';

const r = Router();
const EMERGENT_SESSION_URL = 'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data';
const cookieOpts = { httpOnly: true, secure: true, sameSite: 'none', path: '/' };

r.post('/auth/session', async (req, res) => {
  const sessionId = z.string().min(8).max(500).safeParse(req.body?.session_id || req.headers['x-session-id']);
  if (!sessionId.success) return res.status(400).json({ error: 'Missing sign-in session.' });
  const resp = await fetch(EMERGENT_SESSION_URL, { headers: { 'X-Session-ID': sessionId.data } });
  if (!resp.ok) return res.status(401).json({ error: 'Sign-in expired. Please try again.' });
  const data = await resp.json();
  if (!data.email || !data.session_token) return res.status(401).json({ error: 'Sign-in failed. Please try again.' });
  const user = await ensureUser({ email: data.email, name: sanitizeText(data.name || '', 120), picture: data.picture });
  const expires = await createSession(user.id, data.session_token);
  res.cookie('session_token', data.session_token, { ...cookieOpts, expires });
  res.json({ user: publicUser(user) });
});

r.get('/auth/me', requireAuth, (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ user: publicUser(req.user) });
});

r.post('/auth/logout', async (req, res) => {
  const t = tokenFrom(req);
  if (t) await q(db().from('app_sessions').delete().eq('token_hash', hashToken(t)));
  res.clearCookie('session_token', cookieOpts);
  res.json({ ok: true });
});

export default r;
