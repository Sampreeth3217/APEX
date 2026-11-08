import { createElement, useEffect, useRef, useState } from 'react';

// Small, dependency-free motion helpers. Everything respects "reduce motion" in the OS settings.
export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Calls back once when the element scrolls into view.
export function useInView(options = { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return undefined;
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) { setSeen(true); return undefined; }
    // Shown once it enters the screen — or if it has already been scrolled past (fast flicks, jump links).
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting || e.boundingClientRect.bottom < 0) { setSeen(true); io.disconnect(); } }, options);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen]);
  return [ref, seen];
}

// <Reveal> fades and lifts its content in when it scrolls into view. `delay` is in steps of 80ms.
export function Reveal({ as = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, seen] = useInView();
  return createElement(as, { ref, className: `reveal ${seen ? 'is-visible' : ''} ${className}`, style: { '--d': `${delay * 80}ms`, ...(rest.style || {}) }, ...rest }, children);
}

// Counts up to `to` once visible.
export function CountUp({ to, suffix = '', duration = 1400, className = '' }) {
  const [ref, seen] = useInView({ threshold: 0.4 });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!seen || !to) return undefined;
    if (prefersReducedMotion()) { setN(to); return undefined; }
    let raf; const t0 = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - t0) / duration); setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, duration]);
  return <span ref={ref} className={className}>{to ? n : '—'}{to ? suffix : ''}</span>;
}
