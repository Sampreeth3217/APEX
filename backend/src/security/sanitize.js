// Strip control chars and system-like markers from untrusted text before it reaches a prompt or the DB.
export function sanitizeText(s, max = 1000) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<\/?\s*(untrusted|system|assistant|user|tool)[^>]*>/gi, '')
    .replace(/^\s*(system|assistant)\s*:/gim, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, max);
}

export const untrusted = (s, max = 2000) => `<untrusted>${sanitizeText(s, max)}</untrusted>`;

export const firstName = (name) => (sanitizeText(name || '', 80).split(/\s+/)[0] || 'An owner');

export const safeUrl = (u) => {
  if (!u) return null;
  try {
    const url = new URL(u);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch { return null; }
};

// Same-origin check for cookie-authenticated mutations (CSRF defence, since the cookie is SameSite=None).
export function originGuard(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (!req.cookies?.session_token) return next();
  const origin = req.headers.origin || req.headers.referer;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  try {
    if (origin && new URL(origin).host === host) return next();
  } catch { /* fallthrough */ }
  return res.status(403).json({ error: 'Request blocked for your safety. Please reload the page.' });
}
