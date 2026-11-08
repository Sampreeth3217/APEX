import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    load(false);
  }, [authLoading, user, nav, load]);

  const changeAnswers = async () => {
    try {
      const { profile } = await api('/profile/current');
      if (profile?.answers) saveAnswers({ ...profile.answers, step: 0, completed: false });
    } catch { /* keep local answers */ }
    nav('/start');
  };

  if (authLoading || !user) return null;
  return (
    <div className="if-container py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="if-eyebrow">Your results</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl" data-testid="dashboard-title">Tools that fit {user.business_name || 'your business'}</h1>
          {state.results?.summary && <p className="mt-3 text-[var(--ink-2)]" data-testid="dashboard-summary">{state.results.summary}</p>}
        </div>
        <div className="flex gap-2">
          <button type="button" className="if-btn-ghost" onClick={changeAnswers} data-testid="dashboard-change-answers-button"><PencilLine className="h-4 w-4" />Change my answers</button>
          <button type="button" className="if-btn-quiet" onClick={() => load(true)} disabled={state.loading} data-testid="dashboard-refresh-button"><RefreshCw className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />Refresh</button>
        </div>
      </div>
      <div className="mt-10">
        {state.loading && <SkeletonCards />}
        {state.error && <ErrorState error={state.error} onRetry={() => load(false)} />}
        {!state.loading && !state.error && !state.results && (
          <Empty title="No results yet">Answer the 10 questions and we’ll find your top tools. <Link to="/start" className="font-semibold text-[var(--brand)] hover:underline" data-testid="dashboard-start-link">Start now</Link></Empty>
        )}
        {!state.loading && state.results && <ResultsView results={state.results} savedSlugs={saved} onSave={save} />}
      </div>
    </div>
  );
}
