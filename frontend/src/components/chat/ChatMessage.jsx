import { Fragment } from 'react';
import { Link } from 'react-router-dom';

// Renders the helper's replies as clean, professional text: section headings, bullet and numbered lists,
// bold tool names and links — without ever showing raw Markdown symbols like ** or ##.

const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|\[[^\]]+\]\([^)\s]+\)|https?:\/\/[^\s)]*[^\s).,;:!?'\"]|`[^`]+`|\*[^*\s][^*]*\*)/g;

function LinkTo({ href, children }) {
  if (href.startsWith('/')) return <Link to={href} className="font-medium text-[var(--brand)] underline-offset-2 hover:underline">{children}</Link>;
  return <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="break-all font-medium text-[var(--brand)] underline-offset-2 hover:underline">{children}</a>;
}

export function inline(text, keyBase = 'i') {
  return String(text).split(INLINE).filter((p) => p !== '').map((p, i) => {
    const k = `${keyBase}-${i}`;
    if (/^(\*\*|__).+(\*\*|__)$/.test(p)) return <strong key={k} className="font-semibold text-[var(--ink)]">{inline(p.slice(2, -2), k)}</strong>;
    const md = p.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (md) return <LinkTo key={k} href={md[2]}>{md[1]}</LinkTo>;
    if (/^https?:\/\//.test(p)) return <LinkTo key={k} href={p}>{p}</LinkTo>;
    if (/^`.+`$/.test(p)) return <code key={k} className="rounded bg-surface px-1 text-[0.9em]">{p.slice(1, -1)}</code>;
    if (/^\*[^*].*\*$/.test(p)) return <em key={k}>{p.slice(1, -1)}</em>;
    return <Fragment key={k}>{p.replace(/\*\*/g, '')}</Fragment>;
  });
}

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBER = /^\s*(\d+)[.)]\s+(.*)$/;
const HEADING = /^\s*#{1,6}\s+(.*)$/;
const BOLD_LINE = /^\s*\*\*([^*]+)\*\*\s*:?\s*$/; // a line that is only bold text acts as a heading

export function parseBlocks(text) {
  const blocks = [];
  let list = null;
  let para = [];
  const flushPara = () => { if (para.length) { blocks.push({ type: 'p', text: para.join(' ') }); para = []; } };
  const flushList = () => { if (list) { blocks.push(list); list = null; } };
  for (const raw of String(text).replace(/\r/g, '').split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushPara(); flushList(); continue; }
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { flushPara(); flushList(); continue; }
    let m;
    if ((m = line.match(HEADING)) || (m = line.match(BOLD_LINE))) { flushPara(); flushList(); blocks.push({ type: 'h', text: m[1].replace(/\*\*/g, '').replace(/:\s*$/, '') }); continue; }
    if ((m = line.match(BULLET))) { flushPara(); if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; } list.items.push(m[1]); continue; }
    if ((m = line.match(NUMBER))) { flushPara(); if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; } list.items.push(m[2]); continue; }
    if (list && /^\s{2,}\S/.test(raw)) { list.items[list.items.length - 1] += ` ${line.trim()}`; continue; }
    flushList(); para.push(line.trim());
  }
  flushPara(); flushList();
  return blocks;
}

export function ChatMessage({ content }) {
  const blocks = parseBlocks(content);
  return (
    <div className="space-y-2.5 leading-relaxed">
      {blocks.map((b, i) => {
        if (b.type === 'h') return <p key={i} className="if-highlight pt-1 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[var(--brand)] first:pt-0">{inline(b.text, `h${i}`)}</p>;
        if (b.type === 'ul') return (
          <ul key={i} className="space-y-1.5">
            {b.items.map((it, j) => <li key={j} className="relative pl-4 before:absolute before:left-0 before:top-[0.6em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[var(--brand)]">{inline(it, `u${i}-${j}`)}</li>)}
          </ul>
        );
        if (b.type === 'ol') return (
          <ol key={i} className="space-y-1.5">
            {b.items.map((it, j) => <li key={j} className="flex gap-2"><span className="if-highlight mt-[0.1em] grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--brand-soft)] text-[0.7rem] font-semibold text-[var(--brand)]">{j + 1}</span><span>{inline(it, `o${i}-${j}`)}</span></li>)}
          </ol>
        );
        return <p key={i}>{inline(b.text, `p${i}`)}</p>;
      })}
    </div>
  );
}
