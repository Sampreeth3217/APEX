import { Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, Columns3, Wrench, Clock, HelpCircle, Plug, Tag, ShieldCheck, ThumbsDown, SearchCheck } from 'lucide-react';

const fitTone = { top_pick: 'bg-emerald-50 text-emerald-800 border-emerald-200', thin_evidence: 'bg-amber-50 text-amber-800 border-amber-200' };

const Row = ({ icon: Icon, label, children, testid }) => (
  <div className="flex gap-3" data-testid={testid}>
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ink-3)]" aria-hidden="true" />
    <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-3)]">{label}</p><div className="text-[0.95rem] text-[var(--ink)]">{children}</div></div>
  </div>
);

export function RecCard({ pick, onSave, saved, compareHref, guideHref, readOnly, idx = 0 }) {
  const t = pick.tool; const e = pick.explanation || {}; const eta = pick.eta;
  const free = [t.has_free_plan === true && 'Free plan', t.has_free_trial === true && 'Free trial'].filter(Boolean);
  return (
    <article className={`if-card if-rise if-d${idx + 1} flex flex-col overflow-hidden`} data-testid={`rec-card-${pick.rank}`}>
      <div className="border-b border-[var(--line)] bg-[var(--surface-warm)]/60 p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="font-display text-4xl font-extrabold leading-none text-[var(--brand)]/80">{pick.rank}</span>
          <span className={`if-chip ${fitTone[pick.quadrant] || 'bg-slate-50 text-slate-700 border-slate-200'}`} data-testid={`rec-fit-label-${pick.rank}`}>{pick.fit_label}</span>
        </div>
        <h3 className="mt-3 font-display text-xl font-bold"><Link to={`/tools/${t.slug}`} className="hover:underline" data-testid={`rec-tool-link-${pick.rank}`}>{t.name}</Link></h3>
        <p className="text-sm text-[var(--ink-2)]">{pick.category_label} · <ShieldCheck className="inline h-3.5 w-3.5" /> {pick.trust_label}</p>
        <p className="mt-3 font-medium" data-testid={`rec-one-line-${pick.rank}`}>{e.one_line}</p>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="text-[0.95rem] leading-relaxed text-[var(--ink-2)]" data-testid={`rec-why-${pick.rank}`}>{e.why_it_fits}</p>
        <Row icon={ThumbsDown} label="Not for">{e.not_for}</Row>
        <Row icon={SearchCheck} label="Check first">{e.check_first}</Row>
        <Row icon={Tag} label="Price" testid={`rec-price-${pick.rank}`}>{t.price_text === 'Not listed' ? <span className="italic text-[var(--ink-3)]">Not listed</span> : t.price_text}{free.length > 0 && <span className="ml-2 text-sm text-emerald-700">{free.join(' · ')}</span>}</Row>
        <Row icon={Plug} label="Works with">{t.integrations?.length ? t.integrations.slice(0, 6).join(', ') : <span className="italic text-[var(--ink-3)]">Not listed</span>}</Row>
        <Row icon={Clock} label="Time you might save (rough estimate)" testid={`rec-eta-${pick.rank}`}>
          {eta?.high ? <>About {eta.low}–{eta.high} hours a week after setup <span className="block text-sm text-[var(--ink-2)]">First month: {eta.first_month.low}–{eta.first_month.high} hours a week</span></> : <span className="italic text-[var(--ink-3)]">Not enough information</span>}
        </Row>
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-3" data-testid={`rec-unknowns-${pick.rank}`}>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900"><HelpCircle className="h-4 w-4" />What we don’t know yet</p>
          <p className="mt-1 text-sm text-amber-900/80">{pick.unknowns?.length ? pick.unknowns.join(' · ') : 'Nothing major listed. Still confirm price before paying.'}</p>
        </div>
        {e.fallback && <p className="text-xs text-[var(--ink-3)]">This explanation was built from the tool record directly.</p>}
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          {!readOnly && <button type="button" className="if-btn-ghost min-h-11 px-4" onClick={() => onSave?.(t.slug)} data-testid={`rec-save-${pick.rank}`}>{saved ? <BookmarkCheck className="h-4 w-4 text-[var(--brand)]" /> : <Bookmark className="h-4 w-4" />}{saved ? 'Saved' : 'Save'}</button>}
          <Link to={compareHref} className="if-btn-ghost min-h-11 px-4" data-testid={`rec-compare-${pick.rank}`}><Columns3 className="h-4 w-4" />Compare</Link>
          <Link to={guideHref} className="if-btn-primary min-h-11 px-4" data-testid={`rec-guide-${pick.rank}`}><Wrench className="h-4 w-4" />How do I set this up?</Link>
        </div>
      </div>
    </article>
  );
}
