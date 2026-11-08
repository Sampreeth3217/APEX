import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    // Only a real 401 means signed out; network blips or a restarting server are retried, never treated as logout.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try { const d = await api('/auth/me'); setUser(d.user); break; } catch (e) {
        if (e.status === 401) { setUser(null); break; }
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Returning from Google: let AuthCallback exchange the session first.
    if (window.location.hash?.includes('session_id=')) { setLoading(false); return; }
    refresh();
  }, [refresh]);

  const logout = async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); setUser(null); };

  return <AuthCtx.Provider value={{ user, setUser, loading, refresh, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

export function startGoogleLogin(nextPath = '/auth/continue') {
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  sessionStorage.setItem('if_after_login', nextPath);
  const redirectUrl = window.location.origin + '/auth/continue';
  window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
}
