import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { usePageTitle } from '@/lib/hooks';
import { Loading, ErrorState, Empty } from '@/components/feedback/States';

const val = (v) => (v === true ? 'Yes' : v === false ? 'No' : 'Not listed');
const ROWS = [
  ['Price', (t) => t.price_text],
  ['Free plan', (t) => val(t.has_free_plan)],
  ['Free trial', (t) => val(t.has_free_trial)],
  ['Setup effort (estimated)', (t) => (t.setup_complexity ? ['', 'Sign up and start', 'Easy', 'Some setup', 'Takes effort', 'Needs expert help'][t.setup_complexity] : 'Not listed')],
  ['Who it suits', (t) => t.best_for || 'Not listed'],
  ['Works with', (t) => (t.integrations?.length ? t.integrations.join(', ') : 'Not listed')],
  ['How well proven', (t) => t.trust_label],
  ['Reviews', (t) => (t.reviews?.length ? t.reviews.map((r) => `${r.source.toUpperCase()} ${r.rating}/5`).join(', ') : 'Not listed')],
  ['Size fit', (t) => (t.smb_fit_flag === 'good' ? 'Fine for small teams' : 'Built for bigger businesses')],
  ['Unknowns', (t) => (t.unknowns?.length ? t.unknowns.join(', ') : 'None listed')],
];

function Picker({ onAdd, exclude }) {
  const [q, setQ] = useState(''); const [items, setItems] = useState([]);
  useEffect(() => { if (q.length < 2) { setItems([]); return undefined; } const h = setTimeout(() => api(`/tools?q=${encodeURIComponent(q)}&limit=6`).then((d) => setItems(d.items)).catch(() => {}), 250); return () => clearTimeout(h); }, [q]);
  return (
    <div className="relative max-w-md">
      <input className="if-input" placeholder="Add a tool by name…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Add a tool to compare" data-testid="compare-add-input" />
      {items.length > 0 && (
        <ul className="if-card absolute z-10 mt-1 w-full overflow-hidden" role="listbox">
          {items.filter((i) => !exclude.includes(i.slug)).map((i) => <li key={i.slug}><button type="button" className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-[var(--surface-hover)]" onClick={() => { onAdd(i.slug); setQ(''); }} data-testid={`compare-add-option-${i.slug}`}><Plus className="h-4 w-4" />{i.name}</button></li>)}
        </ul>
      )}
    </div>
  );
}

export default function Compare() {
  usePageTitle('Compare tools');
  const [sp, setSp] = useSearchParams();
  const slugs = (sp.get('tools') || '').split(',').filter(Boolean).slice(0, 3);
  const [state, setState] = useState({ loading: false });
  const key = slugs.join(',');
  useEffect(() => {
    if (slugs.length < 2) { setState({ loading: false }); return; }
    setState({ loading: true });
    api('/compare', { method: 'POST', body: { slugs } }).then((d) => setState({ loading: false, data: d })).catch((e) => setState({ loading: false, error: e }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const setSlugs = (s) => setSp(s.length ? { tools: s.join(',') } : {});
  const tools = state.data?.tools || [];
  const differs = (fn) => new Set(tools.map(fn)).size > 1;
  return (
    <div className="if-container py-10 sm:py-14">
      <p className="if-eyebrow">Compare</p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Side by side</h1>
      <p className="mt-2 text-[var(--ink-2)]">Pick two or three tools. Rows where they differ are highlighted. There is no “winner” — it depends on you.</p>
      <div className="mt-6 flex flex-wrap items-center gap-2" data-testid="compare-selected">
        {slugs.map((s) => <span key={s} className="if-chip min-h-10 border-[var(--line)] bg-white px-3">{tools.find((t) => t.slug === s)?.name || s}<button type="button" onClick={() => setSlugs(slugs.filter((x) => x !== s))} aria-label={`Remove ${s}`} data-testid={`compare-remove-${s}`}><X className="h-4 w-4" /></button></span>)}
      </div>
      {slugs.length < 3 && <div className="mt-4"><Picker exclude={slugs} onAdd={(s) => setSlugs([...slugs, s])} /></div>}
      <div className="mt-8">
        {slugs.length < 2 && <Empty title="Add at least two tools">Search above, or use the Compare button on any recommendation or tool page. <Link className="font-semibold text-[var(--brand)] hover:underline" to="/tools">Browse tools</Link></Empty>}
        {state.loading && <Loading />}
        {state.error && <ErrorState error={state.error} />}
        {tools.length >= 2 && (
          <>
            <div className="if-card overflow-x-auto" data-testid="compare-table">
              <table className="w-full min-w-[640px] text-left text-[0.95rem]">
                <thead><tr className="border-b border-[var(--line)]"><th className="w-48 p-4" />{tools.map((t) => <th key={t.slug} className="p-4 font-display text-lg font-bold"><Link to={`/tools/${t.slug}`} className="hover:underline">{t.name}</Link></th>)}</tr></thead>
                <tbody>
                  {ROWS.map(([label, fn]) => (
                    <tr key={label} className={`border-b border-[var(--line)] last:border-0 ${differs(fn) ? 'bg-[var(--brand-soft)]/50' : ''}`}>
                      <th scope="row" className="p-4 align-top text-sm font-semibold text-[var(--ink-2)]">{label}{differs(fn) && <span className="block text-xs font-normal text-[var(--brand)]">Differs</span>}</th>
                      {tools.map((t) => <td key={t.slug} className={`p-4 align-top ${fn(t) === 'Not listed' ? 'italic text-[var(--ink-3)]' : ''}`}>{fn(t)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <section className="if-card mt-6 p-6" data-testid="compare-tradeoffs">
              <h2 className="font-display text-lg font-bold">The main tradeoffs</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">{state.data.tradeoffs.sentences.map((s) => <li key={s}>{s}</li>)}</ul>
              <p className="mt-3 text-xs text-[var(--ink-3)]">{state.data.tradeoffs.fallback ? 'Built directly from the tool records.' : 'Written by AI from the tool records above. Check the sources on each tool page.'}</p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
