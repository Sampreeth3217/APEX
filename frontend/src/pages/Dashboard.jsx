import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { RefreshCw, PencilLine } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { usePageTitle } from '@/lib/hooks';
import { saveAnswers } from '@/lib/answers';
import { ResultsView } from '@/components/dashboard/ResultsView';
import { SkeletonCards, ErrorState, Empty } from '@/components/feedback/States';

export function useSavedSlugs(enabled) {
  const [saved, setSaved] = useState([]);
  useEffect(() => { if (enabled) api('/me').then((d) => setSaved(d.saved.filter((s) => s.status !== 'dropped').map((s) => s.tool.slug))).catch(() => {}); }, [enabled]);
  const save = async (slug) => {
    try { await api('/user-tools', { method: 'POST', body: { slug, status: 'considering' } }); setSaved((s) => [...new Set([...s, slug])]); toast.success('Saved to My tools'); } catch (e) { toast.error(e.message); }
  };
  return { saved, save };
}

export default function Dashboard() {
  usePageTitle('My results');
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const forceKey = location.state?.refresh;
  const [state, setState] = useState({ loading: true });
  const { saved, save } = useSavedSlugs(!!user);

  const load = useCallback(async (force) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      let d = force ? null : await api('/recommend/latest');
      if (force || (!d.results && d.needs_refresh) || d.needs_refresh) d = await api('/recommend', { method: 'POST' });
      setState({ loading: false, results: d.results });
    } catch (e) {
      if (e.status === 404) setState({ loading: false, results: null });
      else setState({ loading: false, error: e });
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { nav('/login', { replace: true }); return; }
    if (!user.onboarding_complete) { nav('/onboarding', { replace: true }); return; }
    load(!!forceKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id, user?.onboarding_complete, nav, load, forceKey]);

  const changeAnswers = async () => {
    try {
      const { profile } = await api('/profile/current');
      if (profile?.answers) saveAnswers({ ...profile.answers, step: 0, completed: false });
    } catch { /* keep local answers */ }
    nav('/start');
  };

  if (authLoading || !user) return null;
  return (
    <div className="if-container py-6 sm:py-8">
      <div className="if-hero-panel -mx-2 rounded-[1.9rem] px-6 py-10 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-[clamp(2rem,4vw,3rem)]" data-testid="dashboard-title">Your best matches{user.business_name ? <span className="text-[var(--ink-3)]"> for {user.business_name}</span> : ''}</h1>
          {state.results?.summary && <p className="mt-2 text-[var(--ink-2)]" data-testid="dashboard-summary">{state.results.summary}</p>}
        </div>
        <div className="flex gap-1">
          <button type="button" className="if-btn-quiet" onClick={changeAnswers} data-testid="dashboard-change-answers-button"><PencilLine className="h-4 w-4" />Change answers</button>
          <button type="button" className="if-btn-quiet" onClick={() => load(true)} disabled={state.loading} aria-label="Refresh results" title="Refresh results" data-testid="dashboard-refresh-button"><RefreshCw className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} /></button>
        </div>
        </div>
      </div>
      <div className="mt-8">
        {state.loading && <SkeletonCards />}
        {state.error && <ErrorState error={state.error} onRetry={() => load(false)} />}
        {!state.loading && !state.error && !state.results && (
          <Empty title="No results yet">Answer a few quick questions and we’ll find your best matches. <Link to="/start" className="font-semibold text-[var(--brand)] hover:underline" data-testid="dashboard-start-link">Start now</Link></Empty>
        )}
        {!state.loading && state.results && <ResultsView results={state.results} savedSlugs={saved} onSave={save} />}
      </div>
    </div>
  );
}
