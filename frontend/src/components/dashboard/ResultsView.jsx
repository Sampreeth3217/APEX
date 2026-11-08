import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { RecCard } from './RecCard';
import { QuadrantChart } from './QuadrantChart';

const lvl = { Strong: 'text-emerald-700', Okay: 'text-amber-700', Weak: 'text-red-700', 'Not listed': 'text-[var(--ink-3)] italic' };

function WhyThese({ picks, considered }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="if-card" data-testid="why-these-three">
      <button type="button" className="flex w-full items-center justify-between gap-3 p-5 text-left" onClick={() => setOpen(!open)} aria-expanded={open} data-testid="why-these-toggle">
        <span><span className="font-display font-bold">Why these {picks.length === 1 ? 'one' : picks.length === 2 ? 'two' : 'three'}?</span><span className="block text-sm text-[var(--ink-2)]">We checked {considered} tools in your areas against your answers.</span></span>
        <ChevronDown className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-5 border-t border-[var(--line)] p-5">
          <p className="text-[0.95rem] text-[var(--ink-2)]">Every tool gets the same five checks. What matters most to you counts a little more. Then we look at how well proven it is: customer reviews, how complete its information is, and how many independent sources mention it. Sources written by the company itself count for less. A computer program does the ranking — the AI only writes the explanations.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead><tr className="text-left text-[var(--ink-3)]"><th className="py-2 pr-3 font-semibold">Check</th>{picks.map((p) => <th key={p.tool.slug} className="py-2 pr-3 font-semibold text-[var(--ink)]">{p.tool.name}</th>)}</tr></thead>
              <tbody>
                {picks[0].dimensions.map((d, i) => (
                  <tr key={d.key} className="border-t border-[var(--line)]">
                    <td className="py-2 pr-3">{d.label}<span className="block text-xs text-[var(--ink-3)]">counts {d.weight}%</span></td>
                    {picks.map((p) => <td key={p.tool.slug} className={`py-2 pr-3 font-medium ${lvl[p.dimensions[i].level]}`}>{p.dimensions[i].level}</td>)}
                  </tr>
                ))}
                <tr className="border-t border-[var(--line)]"><td className="py-2 pr-3">How well proven</td>{picks.map((p) => <td key={p.tool.slug} className="py-2 pr-3 font-medium">{p.trust_label}</td>)}</tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export function ResultsView({ results, savedSlugs = [], onSave, readOnly, guideQuery = '' }) {
  const { picks, shortfall, chart } = results;
  const slugs = picks.map((p) => p.tool.slug);
  return (
    <div className="space-y-8">
      {shortfall?.length > 0 && (
        <div className="if-card flex gap-3 border-amber-200 bg-amber-50/70 p-5" role="status" data-testid="shortfall-notice">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div><p className="font-semibold text-amber-900">{picks.length === 0 ? 'No tools matched well enough to recommend.' : `We found ${picks.length} good match${picks.length === 1 ? '' : 'es'}, not three.`}</p>
            <ul className="mt-1 list-disc pl-5 text-[0.95rem] text-amber-900/90">{shortfall.map((s) => <li key={s}>{s}</li>)}</ul></div>
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-3">
        {picks.map((p, i) => (
          <RecCard key={p.tool.slug} pick={p} idx={i} saved={savedSlugs.includes(p.tool.slug)} onSave={onSave} readOnly={readOnly}
            compareHref={`/compare?tools=${[p.tool.slug, ...slugs.filter((s) => s !== p.tool.slug)].slice(0, 3).join(',')}`}
            guideHref={`/guide/${p.tool.slug}${guideQuery}`} />
        ))}
      </div>
      {picks.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
          <QuadrantChart points={chart || []} />
          <div className="space-y-5">
            <WhyThese picks={picks} considered={results.considered} />
            <p className="text-sm text-[var(--ink-3)]">Time savings are rough estimates based on placeholder assumptions for each kind of tool, not measured results. A recommendation is not an endorsement.</p>
          </div>
        </div>
      )}
    </div>
  );
}
