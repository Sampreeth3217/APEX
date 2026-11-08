import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';

const AuthCtx = createContext(null);
const CACHE = 'apex_user';
const readCache = () => { try { return JSON.parse(sessionStorage.getItem(CACHE) || 'null'); } catch { return null; } };
const writeCache = (u) => { try { if (u) sessionStorage.setItem(CACHE, JSON.stringify(u)); else sessionStorage.removeItem(CACHE); } catch { /* ignore */ } };

export function AuthProvider({ children }) {
  // Start from the last known user so a reload or a slow server never flashes "signed out".
  const [user, setUserState] = useState(readCache);
  const [loading, setLoading] = useState(true);
  const setUser = useCallback((u) => { writeCache(u); setUserState(u); }, []);

  const refresh = useCallback(async () => {
    // Only a real 401 means signed out. Server restarts / network blips keep the current user and retry quietly.
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try { const d = await api('/auth/me'); setUser(d.user); break; } catch (e) {
        if (e.status === 401) { setUser(null); break; }
        if (attempt === 1) setLoading(false); // stop blocking the page; keep retrying in the background
        await new Promise((r) => setTimeout(r, Math.min(800 * (attempt + 1), 4000)));
      }
    }
    setLoading(false);
  }, [setUser]);

  useEffect(() => { refresh(); }, [refresh]);

  const logout = async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); setUser(null); };

  return <AuthCtx.Provider value={{ user, setUser, loading, refresh, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

// Sends the visitor to the sign-in page, remembering where to go afterwards.
let navigateFn = null;
export const registerNavigate = (fn) => { navigateFn = fn; };
export function startLogin(nextPath = '/auth/continue') {
  sessionStorage.setItem('if_after_login', nextPath);
  if (window.location.pathname === '/login') return;
  if (navigateFn) navigateFn('/login'); else window.location.assign('/login');
}
