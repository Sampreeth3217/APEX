import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useMeta, usePageTitle } from '@/lib/hooks';
import { loadAnswers, saveAnswers, emptyAnswers } from '@/lib/answers';
import { useAuth, startGoogleLogin } from '@/lib/auth';
import { Loading } from '@/components/feedback/States';

const TEAM = [['just_me', 'Just me'], ['2-9', '2–9 people'], ['10-49', '10–49 people']];
const BUDGET = [['free_only', 'Free only'], ['under_50', 'Under $50 a month'], ['50_150', '$50–150 a month'], ['150_500', '$150–500 a month'], ['500_plus', '$500+ a month']];
const TECH = [[1, 'I only use email and texts'], [2, 'I use a few apps'], [3, 'I’m okay with new apps'], [4, 'I set up apps sometimes'], [5, 'I set up apps myself all the time']];
const URG = [['this_week', 'This week'], ['this_month', 'This month'], ['no_rush', 'No rush']];
const PRI = [['cost', 'Low cost'], ['ease', 'Easy to use'], ['speed', 'Up and running fast'], ['results', 'Best results']];

const Choice = ({ selected, onClick, children, testid, multi }) => (
  <button type="button" onClick={onClick} aria-pressed={selected} data-testid={testid}
    className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-base font-medium transition-[background-color,border-color] duration-150 ${selected ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--ink)]' : 'border-[var(--line)] bg-white hover:bg-[var(--surface-hover)]'}`}>
    <span>{children}</span>
    <span className={`grid h-6 w-6 shrink-0 place-items-center ${multi ? 'rounded-md' : 'rounded-full'} border ${selected ? 'border-[var(--brand)] bg-[var(--brand)] text-white' : 'border-stone-300'}`}>{selected && <Check className="h-4 w-4" />}</span>
  </button>
);

export default function Start() {
  usePageTitle('Find AI for my business');
  const meta = useMeta();
  const nav = useNavigate();
  const { user } = useAuth();
  const [a, setA] = useState(loadAnswers);
  const [error, setError] = useState('');
  useEffect(() => { saveAnswers(a); }, [a]);
  const set = (patch) => { setError(''); setA((x) => ({ ...x, ...patch })); };
  const toggle = (key, v, max) => {
    const cur = a[key];
    if (cur.includes(v)) return set({ [key]: cur.filter((x) => x !== v) });
    if (max && cur.length >= max) return setError(`Pick up to ${max}.`);
    set({ [key]: [...cur, v] });
  };
  const cats = meta?.categories || [];
  const outcomeOptions = useMemo(() => cats.filter((c) => a.needs.includes(c.slug)).flatMap((c) => c.outcomes), [cats, a.needs]);

  if (!meta) return <div className="if-container"><Loading /></div>;
  const needCount = a.needs.length + (a.something_else ? 1 : 0);

  const steps = [
    { q: 'What kind of business is it?', valid: a.business_type && a.team_size_band, body: (
      <div className="space-y-6">
        <div className="grid gap-2 sm:grid-cols-2">{Object.entries(meta.business_types).map(([k, v]) => <Choice key={k} selected={a.business_type === k} onClick={() => set({ business_type: k })} testid={`q1-type-${k}`}>{v.label}</Choice>)}</div>
        <div><p className="mb-2 font-semibold">How many people work there?</p><div className="grid gap-2 sm:grid-cols-3">{TEAM.map(([k, l]) => <Choice key={k} selected={a.team_size_band === k} onClick={() => set({ team_size_band: k })} testid={`q1-team-${k}`}>{l}</Choice>)}</div></div>
      </div>) },
    { q: 'What is the biggest headache right now?', hint: 'Pick up to two.', valid: needCount >= 1 && needCount <= 2, body: (
      <div className="grid gap-2">
        {cats.map((c) => <Choice key={c.slug} multi selected={a.needs.includes(c.slug)} onClick={() => (a.needs.includes(c.slug) || needCount < 2 ? toggle('needs', c.slug) : setError('Pick up to 2.'))} testid={`q2-need-${c.slug}`}>“{c.pain}”</Choice>)}
        <Choice multi selected={a.something_else} onClick={() => (a.something_else || needCount < 2 ? set({ something_else: !a.something_else }) : setError('Pick up to 2.'))} testid="q2-need-something-else">Something else</Choice>
        {a.something_else && <p className="text-sm text-[var(--ink-2)]">Tell us about it in the last question. If we can’t match it to one of the areas above, we’ll ask you to pick one.</p>}
      </div>) },
    { q: 'About how many hours a week does each headache cost you?', valid: true, skip: a.needs.length === 0, body: (
      <div className="space-y-6">{a.needs.map((n) => { const c = cats.find((x) => x.slug === n); const v = a.hours[n] ?? 3; return (
        <label key={n} className="block"><span className="font-semibold">{c.label}</span>
          <div className="mt-2 flex items-center gap-4"><input type="range" min="0" max="20" value={v} onChange={(e) => set({ hours: { ...a.hours, [n]: Number(e.target.value) } })} className="h-2 w-full accent-[var(--brand)]" data-testid={`q3-hours-${n}`} aria-valuetext={`${v} hours a week`} /><span className="w-24 text-right font-display text-xl font-bold">{v} h</span></div>
        </label>); })}</div>) },
    { q: 'What would “fixed” look like?', hint: 'Pick any that matter.', valid: true, skip: a.needs.length === 0, body: (
      <div className="grid gap-2 sm:grid-cols-2">{outcomeOptions.map(([k, l]) => <Choice key={k} multi selected={a.outcomes.includes(k)} onClick={() => toggle('outcomes', k)} testid={`q4-outcome-${k}`}>{l}</Choice>)}</div>) },
    { q: 'What is your monthly budget for this tool?', valid: !!a.budget, body: (
      <div className="grid gap-2">{BUDGET.map(([k, l]) => <Choice key={k} selected={a.budget === k} onClick={() => set({ budget: k })} testid={`q5-budget-${k}`}>{l}</Choice>)}</div>) },
    { q: 'What software do you already use?', hint: 'Pick any. Skip if none.', valid: true, body: (
      <div className="grid gap-2 sm:grid-cols-2">{meta.software.map((s) => <Choice key={s} multi selected={a.software.includes(s)} onClick={() => toggle('software', s)} testid={`q6-software-${s.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{s}</Choice>)}</div>) },
    { q: 'How comfortable are you with technology?', valid: !!a.tech_comfort, body: (
      <div className="grid gap-2">{TECH.map(([k, l]) => <Choice key={k} selected={a.tech_comfort === k} onClick={() => set({ tech_comfort: k })} testid={`q7-tech-${k}`}><span className="mr-2 font-display font-bold text-[var(--brand)]">{k}</span>{l}</Choice>)}</div>) },
    { q: 'How soon do you want it running?', valid: !!a.urgency, body: (
      <div className="grid gap-2 sm:grid-cols-3">{URG.map(([k, l]) => <Choice key={k} selected={a.urgency === k} onClick={() => set({ urgency: k })} testid={`q8-urgency-${k}`}>{l}</Choice>)}</div>) },
    { q: 'What matters most?', valid: !!a.priority, body: (
      <div className="grid gap-2 sm:grid-cols-2">{PRI.map(([k, l]) => <Choice key={k} selected={a.priority === k} onClick={() => set({ priority: k })} testid={`q9-priority-${k}`}>{l}</Choice>)}</div>) },
    { q: 'Anything else we should know?', hint: 'Optional.', valid: true, body: (
      <div><textarea className="if-input min-h-36 py-3" maxLength={1000} value={a.free_text} onChange={(e) => set({ free_text: e.target.value })} placeholder="For example: we close at 6pm but customers call until 9pm." data-testid="q10-free-text" aria-label="Anything else we should know" /><p className="mt-1 text-right text-xs text-[var(--ink-3)]">{a.free_text.length}/1000</p></div>) },
  ];

  const i = Math.min(a.step, steps.length - 1);
  const step = steps[i];
  const move = (dir) => {
    let n = i + dir;
    while (steps[n]?.skip) n += dir;
    if (n < 0) return;
    if (n >= steps.length) { set({ completed: true }); return finish(); }
    set({ step: n });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const next = () => (step.valid ? move(1) : setError(i === 1 ? 'Pick at least one headache.' : 'Please choose an answer to continue.'));
  const finish = () => {
    saveAnswers({ ...a, completed: true });
    sessionStorage.setItem('if_submit_answers', '1');
    if (user) nav(user.onboarding_complete ? '/auth/continue' : '/onboarding');
    else startGoogleLogin('/auth/continue');
  };
  const pct = Math.round(((i + 1) / steps.length) * 100);

  return (
    <div className="if-container max-w-2xl py-10 sm:py-14" onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') next(); }}>
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-[var(--ink-2)]"><span data-testid="questionnaire-progress-label">Question {i + 1} of {steps.length}</span><span>{Math.max(1, Math.ceil((steps.length - i) * 0.2))} min left</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-hover)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-300" style={{ width: `${pct}%` }} /></div>
      </div>
      <section key={i} className="if-rise" aria-live="polite">
        <h1 className="text-2xl font-extrabold sm:text-3xl" data-testid="questionnaire-question">{step.q}</h1>
        {step.hint && <p className="mt-1 text-[var(--ink-2)]">{step.hint}</p>}
        <div className="mt-6">{step.body}</div>
        {error && <p className="mt-4 font-medium text-red-700" role="alert" data-testid="questionnaire-error">{error}</p>}
      </section>
      <div className="mt-10 flex items-center justify-between gap-3">
        <button type="button" className="if-btn-ghost" onClick={() => move(-1)} disabled={i === 0} data-testid="questionnaire-back-button"><ArrowLeft className="h-4 w-4" />Back</button>
        <button type="button" className="if-btn-primary min-w-40" onClick={next} data-testid="questionnaire-continue-button">{i === steps.length - 1 ? (user ? 'See my results' : 'Continue with Google') : 'Continue'}<ArrowRight className="h-4 w-4" /></button>
      </div>
      {i === steps.length - 1 && !user && <p className="mt-3 text-right text-sm text-[var(--ink-3)]">We ask you to sign in only now, so your results are saved.</p>}
      <button type="button" className="mt-8 text-sm text-[var(--ink-3)] underline-offset-2 hover:underline" onClick={() => { if (window.confirm('Clear all answers and start over?')) setA(emptyAnswers()); }} data-testid="questionnaire-reset-button">Start over</button>
    </div>
  );
}
