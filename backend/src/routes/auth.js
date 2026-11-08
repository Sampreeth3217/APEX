import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { Router } from 'express';
import { z } from 'zod';
import { db, q } from '../db.js';
import { ensureUser, createSession, hashToken, tokenFrom, requireAuth, publicUser } from '../security/auth.js';
import { sanitizeText } from '../security/sanitize.js';
import { hit, clientIp } from '../security/rateLimit.js';

// Self-hosted email + password sign-in. Passwords are hashed with scrypt and stored in
// app_credentials (server-only table, see supabase/migrations/007_local_auth.sql).
const r = Router();
const scrypt = promisify(crypto.scrypt);
const secure = process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true';
const cookieOpts = { httpOnly: true, secure, sameSite: 'lax', path: '/' };

async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}
async function verifyPassword(pw, stored) {
  const [alg, saltHex, keyHex] = String(stored || '').split('$');
  if (alg !== 'scrypt' || !saltHex || !keyHex) return false;
  const key = await scrypt(pw, Buffer.from(saltHex, 'hex'), 64);
  const want = Buffer.from(keyHex, 'hex');
  return want.length === key.length && crypto.timingSafeEqual(want, key);
}

async function startSession(res, user) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = await createSession(user.id, token);
  res.cookie('session_token', token, { ...cookieOpts, expires });
}

const authLimit = (req, res, next) => {
  if (!hit(`auth:ip:${clientIp(req)}`, 20, 15 * 60e3)) return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
  next();
};

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(8, 'Use at least 8 characters.').max(200);

r.post('/auth/register', authLimit, async (req, res) => {
  const p = z.object({ name: z.string().trim().min(1).max(120), email, password }).safeParse(req.body || {});
  if (!p.success) {
    const f = p.error.issues[0];
    return res.status(400).json({ error: f?.path?.[0] === 'password' ? 'Use a password with at least 8 characters.' : 'Please enter your name and a valid email.', field: f?.path?.[0] });
  }
  const existing = await q(db().from('app_credentials').select('user_id').eq('email', p.data.email).maybeSingle());
  if (existing) return res.status(409).json({ error: 'An account with this email already exists. Please sign in.', field: 'email' });
  const user = await ensureUser({ email: p.data.email, name: sanitizeText(p.data.name, 120) });
  await q(db().from('app_credentials').insert({ user_id: user.id, email: p.data.email, password_hash: await hashPassword(p.data.password) }));
  await startSession(res, user);
  res.json({ user: publicUser(user) });
});

r.post('/auth/login', authLimit, async (req, res) => {
  const p = z.object({ email, password: z.string().min(1).max(200) }).safeParse(req.body || {});
  if (!p.success) return res.status(400).json({ error: 'Please enter your email and password.' });
  const cred = await q(db().from('app_credentials').select('user_id,password_hash').eq('email', p.data.email).maybeSingle());
  const ok = cred && await verifyPassword(p.data.password, cred.password_hash);
  if (!ok) return res.status(401).json({ error: 'Email or password is incorrect.' });
  const user = await q(db().from('users').select('*').eq('id', cred.user_id).maybeSingle());
  if (!user) return res.status(401).json({ error: 'Email or password is incorrect.' });
  await startSession(res, user);
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
