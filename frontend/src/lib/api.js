// Same-origin by default (Vite proxies /api to the local API). Set VITE_BACKEND_URL to call a different host.
const BASE = `${import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL || ''}/api`;

export class ApiError extends Error {
  constructor(message, status, field) { super(message); this.status = status; this.field = field; }
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  const opts = { method, signal, credentials: 'include', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined };
  let res;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    res = await fetch(`${BASE}${path}`, opts);
    if (![502, 503, 504].includes(res.status) || (method !== 'GET' && attempt > 0)) break;
    await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Something went wrong. Please try again.', res.status, data.field);
  return data;
}

// Server-sent events reader for the chat helper.
export async function streamChat(body, onEvent, signal) {
  const res = await fetch(`${BASE}/chat`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  if (!res.ok || !res.body) {
    const d = await res.json().catch(() => ({}));
    throw new ApiError(d.error || 'The helper is busy right now.', res.status);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split('\n\n');
    buf = parts.pop();
    for (const p of parts) {
      const line = p.split('\n').find((l) => l.startsWith('data:'));
      if (line) { try { onEvent(JSON.parse(line.slice(5))); } catch { /* skip malformed */ } }
    }
  }
}
