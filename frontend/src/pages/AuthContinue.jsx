import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Post-sign-in routing: onboarding, pending questionnaire submit, or the page the visitor came from.
export default function AuthContinue() {
  const nav = useNavigate();
  const { setUser } = useAuth();
  const done = useRef(-1);
  const [error, setError] = useState(null);

  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (done.current === attempt) return;
    done.current = attempt;
    setError(null);
    (async () => {
      try {
        const user = (await api('/auth/me')).user; setUser(user);
        const wantsSubmit = sessionStorage.getItem('if_submit_answers') === '1' && loadAnswers().completed;
        if (!user.onboarding_complete) return nav('/onboarding', { replace: true });
        if (wantsSubmit) { await submitAnswers(); return nav('/dashboard', { replace: true }); }
        const next = sessionStorage.getItem('if_after_login');
        sessionStorage.removeItem('if_after_login');
        nav(next && next.startsWith('/') && !next.startsWith('//') && next !== '/auth/continue' ? next : '/dashboard', { replace: true });
      } catch (e) {
        if (e.status === 401) return nav('/login', { replace: true });
        // A 400 about the answers means a question needs fixing: send the owner back to the questionnaire, still signed in.
        if (e.status === 400 && e.field === 'needs') { sessionStorage.removeItem('if_submit_answers'); return nav('/start', { replace: true, state: { error: e.message, step: 1 } }); }
        setError(e);
      }
    })();
  }, [attempt, nav, setUser]);

  return <div className="if-container max-w-xl py-16">{error ? <ErrorState error={error} onRetry={() => setAttempt((n) => n + 1)} /> : <Loading label="Getting your results ready…" />}</div>;
}
