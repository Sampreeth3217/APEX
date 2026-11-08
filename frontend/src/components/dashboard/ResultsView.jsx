import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { RecCard } from './RecCard';
import { QuadrantChart } from './QuadrantChart';

const lvl = { Strong: 'text-success', Okay: 'text-warning', Weak: 'text-danger', 'Not listed': 'text-[var(--ink-3)] italic' };

function WhyThese({ picks }) {
  return (
    <div data-testid="why-these-three">
      <p className="text-[0.95rem] text-[var(--ink-2)]">Every tool gets the same checks. A computer does the ranking — AI only writes the short descriptions.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[460px] text-sm">
          <thead><tr className="text-left text-[var(--ink-3)]"><th className="py-2 pr-3 font-medium">Check</th>{picks.map((p) => <th key={p.tool.slug} className="py-2 pr-3 font-medium text-[var(--ink)]">{p.tool.name}</th>)}</tr></thead>
          <tbody>
            {(picks[0].dimensions || []).map((d, i) => (
              <tr key={d.key} className="border-t border-[var(--line)]">
                <td className="py-2 pr-3">{d.label}</td>
                {picks.map((p) => <td key={p.tool.slug} className={`py-2 pr-3 font-medium ${lvl[p.dimensions[i].level]}`}>{p.dimensions[i].level}</td>)}
              </tr>
            ))}
            <tr className="border-t border-[var(--line)]"><td className="py-2 pr-3">Reviews</td>{picks.map((p) => <td key={p.tool.slug} className="py-2 pr-3 font-medium">{p.trust_label}</td>)}</tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ResultsView({ results, savedSlugs = [], onSave, readOnly, guideQuery = '' }) {
  const { picks, shortfall, chart } = results;
  const slugs = picks.map((p) => p.tool.slug);
  const [how, setHow] = useState(false);
  return (
    <div className="space-y-8">
      {shortfall?.length > 0 && (
        <div className="flex gap-3 rounded-2xl border border-warning-line bg-warning-soft p-4" role="status" data-testid="shortfall-notice">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div><p className="font-semibold text-warning">{picks.length === 0 ? 'Nothing matched well enough to recommend.' : `We found ${picks.length} good match${picks.length === 1 ? '' : 'es'}.`}</p>
            <ul className="mt-1 space-y-0.5 text-[0.95rem] text-warning">{shortfall.map((s) => <li key={s}>{s}</li>)}</ul></div>
        </div>
      )}
      <div className="grid items-start gap-5 lg:grid-cols-3">
        {picks.map((p, i) => (
          <RecCard key={p.tool.slug} pick={p} idx={i} saved={savedSlugs.includes(p.tool.slug)} onSave={onSave} readOnly={readOnly}
            compareHref={`/compare?tools=${[p.tool.slug, ...slugs.filter((s) => s !== p.tool.slug)].slice(0, 3).join(',')}`}
            guideHref={`/guide/${p.tool.slug}${guideQuery}`} />
        ))}
      </div>
      {picks.length > 0 && (
        <section className="if-card" data-testid="how-we-picked">
          <button type="button" className="flex w-full items-center justify-between gap-3 p-5 text-left" onClick={() => setHow(!how)} aria-expanded={how} data-testid="why-these-toggle">
            <span><span className="font-semibold">How we picked these</span><span className="block text-sm text-[var(--ink-3)]">We compared {results.considered} tools against your answers.</span></span>
            <ChevronDown className={`h-5 w-5 shrink-0 text-[var(--ink-3)] transition-transform ${how ? 'rotate-180' : ''}`} />
          </button>
          {how && (
            <div className="if-fade-up grid gap-6 border-t border-[var(--line)] p-5 lg:grid-cols-[1fr_1.3fr]">
              <QuadrantChart points={chart || []} />
              <div className="space-y-4">
                <WhyThese picks={picks} />
                <p className="text-sm text-[var(--ink-3)]">Time saved is a rough estimate, not a promise. We don’t take money to rank tools.</p>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
