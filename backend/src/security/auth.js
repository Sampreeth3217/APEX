import crypto from 'node:crypto';
import { db, q } from '../db.js';
import { adminEmails } from '../env.js';

export const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');
const SESSION_DAYS = 7;

export function tokenFrom(req) {
  if (req.cookies?.session_token) return req.cookies.session_token;
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

export async function createSession(userId, token) {
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  await q(db().from('app_sessions').upsert({ token_hash: hashToken(token), user_id: userId, expires_at: expires.toISOString() }));
  return expires;
}

// Find or create the Supabase auth user (the canonical trigger then creates public.users).
export async function ensureUser({ email, name, picture }) {
  const lower = email.toLowerCase();
  const existing = await q(db().from('users').select('*').ilike('email', lower).maybeSingle());
  if (existing) {
    const patch = {};
    if (!existing.avatar_url && picture) patch.avatar_url = picture;
    if (!existing.name && name) patch.name = name;
    if (Object.keys(patch).length) await q(db().from('users').update(patch).eq('id', existing.id));
    return { ...existing, ...patch };
  }
  const { data, error } = await db().auth.admin.createUser({ email: lower, email_confirm: true, user_metadata: { full_name: name, avatar_url: picture } });
  let authId = data?.user?.id;
  if (error) {
    const { data: list } = await db().auth.admin.listUsers({ page: 1, perPage: 1000 });
    authId = list?.users?.find((u) => u.email?.toLowerCase() === lower)?.id;
    if (!authId) throw error;
  }
  await q(db().from('users').upsert({ id: authId, email: lower, name, avatar_url: picture }, { onConflict: 'id', ignoreDuplicates: true }));
  return q(db().from('users').select('*').eq('id', authId).single());
}

export async function userFromRequest(req) {
  const token = tokenFrom(req);
  if (!token) return null;
  const s = await q(db().from('app_sessions').select('user_id,expires_at').eq('token_hash', hashToken(token)).maybeSingle());
  if (!s || new Date(s.expires_at) < new Date()) return null;
  return q(db().from('users').select('*').eq('id', s.user_id).maybeSingle());
}

export const isAdmin = (user) => !!user?.email && adminEmails.includes(user.email.toLowerCase());

export const optionalAuth = async (req, _res, next) => {
  try { req.user = await userFromRequest(req); next(); } catch (e) { next(e); }
};

export const requireAuth = async (req, res, next) => {
  try {
    req.user = await userFromRequest(req);
    if (!req.user) return res.status(401).json({ error: 'Please sign in to continue.' });
    next();
  } catch (e) { next(e); }
};

export const requireAdmin = async (req, res, next) => {
  try {
    req.user = await userFromRequest(req);
    if (!req.user) return res.status(401).json({ error: 'Please sign in to continue.' });
    if (!isAdmin(req.user)) return res.status(403).json({ error: 'Admins only.' });
    next();
  } catch (e) { next(e); }
};

export const publicUser = (u) => u && ({
  id: u.id, name: u.name, email: u.email, avatar_url: u.avatar_url, phone: u.phone, location: u.location,
  business_name: u.business_name, onboarding_complete: u.onboarding_complete, is_admin: isAdmin(u),
});
