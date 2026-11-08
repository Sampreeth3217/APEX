import { Fragment } from 'react';

// Minimal, safe markdown renderer for guides: headings, numbered/bullet lists, links, bold. No raw HTML.
function inline(text, key) {
  const parts = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s)]+)|\*\*([^*]+)\*\*/g;
  let last = 0; let m; let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<a key={`${key}-${i++}`} href={m[2]} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-[var(--brand)] underline-offset-2 hover:underline break-all">{m[1]}</a>);
    else if (m[3]) parts.push(<a key={`${key}-${i++}`} href={m[3]} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-[var(--brand)] underline-offset-2 hover:underline break-all">{m[3]}</a>);
    else parts.push(<strong key={`${key}-${i++}`}>{m[4]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function parseGuide(md) {
  const sections = []; let cur = null;
  for (const line of md.split('\n')) {
    const h = line.match(/^#{2,3}\s+(.*)/);
    if (h) { cur = { title: h[1].trim(), lines: [] }; sections.push(cur); continue; }
    if (!cur) { cur = { title: '', lines: [] }; sections.push(cur); }
    cur.lines.push(line);
  }
  return sections;
}

export function GuideBody({ md, completed = [], onToggle, readOnly }) {
  const sections = parseGuide(md);
  let stepIdx = -1;
  return (
    <div className="space-y-6">
      {sections.map((s, si) => {
        const isSteps = /^steps$/i.test(s.title);
        return (
          <section key={si} className={s.title ? 'if-card p-6' : ''} data-testid={s.title ? `guide-section-${si}` : undefined}>
            {s.title && <h2 className="font-display text-xl font-bold">{s.title}</h2>}
            <div className="mt-3 space-y-2 text-[1rem] leading-relaxed">
              {s.lines.map((l, li) => {
                const k = `${si}-${li}`;
                const num = l.match(/^\s*\d+[.)]\s+(.*)/);
                const bul = l.match(/^\s*[-*]\s+(.*)/);
                if (num && isSteps) {
                  stepIdx += 1; const idx = stepIdx; const done = completed.includes(idx);
                  return (
                    <label key={k} className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${done ? 'border-success-line bg-success-soft' : 'border-[var(--line)] bg-surface hover:bg-[var(--surface-warm)]'}`}>
                      <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[var(--brand)]" checked={done} disabled={readOnly} onChange={() => onToggle?.(idx)} data-testid={`guide-step-checkbox-${idx}`} />
                      <span className={done ? 'text-[var(--ink-2)] line-through decoration-success' : ''}><span className="mr-1 font-bold">{idx + 1}.</span>{inline(num[1], k)}</span>
                    </label>
                  );
                }
                if (num) return <p key={k} className="pl-2"><span className="mr-1 font-semibold">{l.match(/^\s*(\d+)/)[1]}.</span>{inline(num[1], k)}</p>;
                if (bul) return <p key={k} className="flex gap-2 pl-1"><span aria-hidden="true">•</span><span>{inline(bul[1], k)}</span></p>;
                if (!l.trim()) return <Fragment key={k} />;
                return <p key={k}>{inline(l, k)}</p>;
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
