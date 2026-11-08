import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { loadAnswers, toPayload } from '@/lib/answers';
import { Loading, ErrorState } from '@/components/feedback/States';

// Posts the locally stored questionnaire answers once, then builds recommendations.
export async function submitAnswers() {
  const a = loadAnswers();
  if (!a.completed) return false;
  await api('/profile', { method: 'POST', body: { answers: toPayload(a) } });
  await api('/recommend', { method: 'POST' });
  sessionStorage.removeItem('if_submit_answers');
  return true;
}

// Handles both the Google return (#session_id=…) and the post-sign-in routing.
export default function AuthContinue() {
  const location = useLocation();
  const nav = useNavigate();
  const { setUser } = useAuth();
  const done = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    (async () => {
      try {
        let user;
        const m = location.hash.match(/session_id=([^&]+)/);
        if (m) {
          const d = await api('/auth/session', { method: 'POST', body: { session_id: decodeURIComponent(m[1]) } });
          user = d.user; setUser(user);
          window.history.replaceState(null, '', '/auth/continue');
        } else {
          user = (await api('/auth/me')).user; setUser(user);
        }
        const wantsSubmit = sessionStorage.getItem('if_submit_answers') === '1' && loadAnswers().completed;
        if (!user.onboarding_complete) return nav('/onboarding', { replace: true });
        if (wantsSubmit) { await submitAnswers(); return nav('/dashboard', { replace: true }); }
        const next = sessionStorage.getItem('if_after_login');
        sessionStorage.removeItem('if_after_login');
        nav(next && next.startsWith('/') && !next.startsWith('//') && next !== '/auth/continue' ? next : '/dashboard', { replace: true });
      } catch (e) {
        if (e.status === 401) return nav('/login', { replace: true });
        setError(e);
      }
    })();
  }, [location.hash, nav, setUser]);

  return <div className="if-container max-w-xl py-16">{error ? <ErrorState error={error} onRetry={() => window.location.assign('/login')} /> : <Loading label="Getting your results ready…" />}</div>;
}
