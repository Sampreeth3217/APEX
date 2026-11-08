import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, FlaskConical, ExternalLink, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth, startGoogleLogin } from '@/lib/auth';
import { usePageTitle } from '@/lib/hooks';
import { GuideBody } from '@/components/guides/GuideBody';
import { Loading, ErrorState } from '@/components/feedback/States';

const DISCLAIMER = "This guide was written by AI. Check it against the provider's own instructions.";

export default function Guide() {
  const { slug } = useParams();
  const [sp] = useSearchParams();
  const persona = sp.get('persona');
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState({ loading: true });
  const [progress, setProgress] = useState({ completed_steps: [], helpful: null });
  usePageTitle(state.data ? `Set up ${state.data.tool.name}` : 'Setup guide');

  useEffect(() => {
    if (authLoading) return;
    if (!user && !persona) { setState({ loading: false, needLogin: true }); return; }
    setState({ loading: true });
    api('/guide', { method: 'POST', body: { slug, ...(user ? {} : { persona }) } })
      .then((d) => { setState({ loading: false, data: d }); if (d.progress) setProgress(d.progress); })
      .catch((e) => setState({ loading: false, error: e }));
  }, [slug, user, persona, authLoading]);

  const saveProgress = async (patch) => {
    const next = { ...progress, ...patch };
    setProgress(next);
    try { await api(`/guide-progress/${slug}`, { method: 'PUT', body: patch }); } catch (e) { toast.error(e.message); }
  };
  const toggle = (i) => saveProgress({ completed_steps: progress.completed_steps.includes(i) ? progress.completed_steps.filter((x) => x !== i) : [...progress.completed_steps, i] });

  if (state.loading) return <div className="if-container max-w-3xl"><Loading label="Writing your setup guide… this can take a few seconds." /></div>;
  if (state.needLogin) return (
    <div className="if-container max-w-xl py-14"><div className="if-card p-8"><h1 className="text-2xl font-extrabold">Get a guide made for you</h1><p className="mt-2 text-[var(--ink-2)]">Sign in so we can match the guide to your comfort with technology and save your progress.</p>
      <div className="mt-6 flex flex-wrap gap-2"><button type="button" className="if-btn-primary" onClick={() => startGoogleLogin(`/guide/${slug}`)} data-testid="guide-signin-button">Continue with Google</button><Link to={`/tools/${slug}`} className="if-btn-ghost">Back to the tool</Link></div></div></div>
  );
  if (state.error) return <div className="if-container max-w-3xl py-12"><ErrorState error={state.error} /></div>;
  const { guide, tool, tech_level: tech, read_only: readOnly } = state.data;
  const md = guide.body_md.replace(DISCLAIMER, '').trim();
  const total = (md.split(/##\s+Steps/i)[1] || '').split(/\n##\s/)[0].split('\n').filter((l) => /^\s*\d+[.)]\s/.test(l)).length;
  return (
    <div className="if-container max-w-3xl py-10 sm:py-14">
      {readOnly && <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900" data-testid="guide-demo-banner"><FlaskConical className="h-4 w-4" />Sample guide (read-only), written for tech comfort {tech} of 5.</div>}
      <Link to={`/tools/${tool.slug}`} className="text-sm text-[var(--ink-2)] hover:underline">← {tool.name}</Link>
      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl" data-testid="guide-title">Set up {tool.name}</h1>
      <p className="mt-2 text-[var(--ink-2)]">Written for tech comfort {tech} of 5.{!readOnly && total > 0 && <span data-testid="guide-progress-count"> {progress.completed_steps.length} of {total} steps done.</span>}</p>
      {guide.is_fallback && <p className="mt-3 rounded-xl bg-[var(--surface-warm)] p-3 text-sm text-[var(--ink-2)]" data-testid="guide-fallback-note">A detailed guide isn’t available right now, so this is a short checklist with the provider’s links.</p>}
      <div className="mt-8"><GuideBody md={md} completed={progress.completed_steps} onToggle={toggle} readOnly={readOnly} /></div>
      <p className="mt-6 flex gap-2 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm font-medium text-indigo-900" data-testid="guide-disclaimer"><Bot className="h-5 w-5 shrink-0" />{DISCLAIMER}</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {(tool.help_url || tool.website_url) && <a href={tool.help_url || tool.website_url} target="_blank" rel="noopener noreferrer" className="if-btn-ghost" data-testid="guide-provider-help-link"><ExternalLink className="h-4 w-4" />Get help from the provider</a>}
        {!readOnly && (
          <div className="flex items-center gap-2 sm:ml-auto" role="group" aria-label="Was this guide helpful?">
            <span className="text-sm text-[var(--ink-2)]">Was this helpful?</span>
            <button type="button" className={`if-btn-quiet ${progress.helpful === true ? 'bg-emerald-50 text-emerald-700' : ''}`} onClick={() => saveProgress({ helpful: progress.helpful === true ? null : true })} aria-pressed={progress.helpful === true} data-testid="guide-helpful-yes"><ThumbsUp className="h-4 w-4" />Yes</button>
            <button type="button" className={`if-btn-quiet ${progress.helpful === false ? 'bg-red-50 text-red-700' : ''}`} onClick={() => saveProgress({ helpful: progress.helpful === false ? null : false })} aria-pressed={progress.helpful === false} data-testid="guide-helpful-no"><ThumbsDown className="h-4 w-4" />No</button>
          </div>
        )}
      </div>
    </div>
  );
}
