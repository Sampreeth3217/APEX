const buckets = new Map();

// Fixed-window counter. Process-local, which is enough for a single-instance deployment.
export function hit(key, limit, windowMs) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.start > windowMs) { buckets.set(key, { start: now, n: 1 }); return true; }
  b.n += 1;
  return b.n <= limit;
}

const DAY = 864e5;
export const LIMITS = {
  chat: { user: 30, ip: 60, window: DAY },
  recommend: { user: 10, ip: 30, window: DAY },
  write: { user: 60, ip: 120, window: 3600e3 },
};

export const clientIp = (req) => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';

export function limit(kind) {
  return (req, res, next) => {
    const l = LIMITS[kind];
    const okIp = hit(`${kind}:ip:${clientIp(req)}`, l.ip, l.window);
    const okUser = req.user ? hit(`${kind}:u:${req.user.id}`, l.user, l.window) : true;
    if (!okIp || !okUser) return res.status(429).json({ error: 'You have reached today’s limit for this. Please try again tomorrow.' });
    next();
  };
}

export const resetLimits = () => buckets.clear();
