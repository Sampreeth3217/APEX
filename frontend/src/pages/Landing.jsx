import { Link } from 'react-router-dom';
import { ArrowRight, Scissors, UtensilsCrossed, Wrench, ShieldCheck, Clock, Plug, Wallet, Sparkles, FileSearch, ListChecks, MessageCircle, HelpCircle } from 'lucide-react';
import { useApi, usePageTitle } from '@/lib/hooks';

const SAMPLES = [
  { slug: 'salon', icon: Scissors, title: 'A small hair salon', text: 'Missed calls and no-shows. Low tech comfort, wants it running this week.' },
  { slug: 'restaurant', icon: UtensilsCrossed, title: 'A neighbourhood café', text: 'Over-ordering stock and not enough reviews. Uses Toast and QuickBooks.' },
  { slug: 'plumber', icon: Wrench, title: 'A plumbing & heating crew', text: 'Jobs on paper and invoices on weekends. Watching every dollar.' },
];

const CHECKS = [
  { icon: Sparkles, t: 'Business fit', d: 'Does it solve the headache you picked?' },
  { icon: Wallet, t: 'Budget', d: 'Real monthly prices, or “Not listed”.' },
  { icon: ListChecks, t: 'Ease', d: 'Can you set it up at your comfort level?' },
  { icon: Clock, t: 'Timing', d: 'Ready this week, or needs onboarding?' },
  { icon: Plug, t: 'Works with', d: 'Square, QuickBooks, Google and more.' },
  { icon: ShieldCheck, t: 'Evidence', d: 'Reviews and how complete the record is.' },
  { icon: FileSearch, t: 'Source quality', d: 'Company-written sources count for half.' },
];

function Preview() {
  const { data } = useApi('/demo/salon');
  const pick = data?.persona?.results?.picks?.[0];
  return (
    <div className="if-card if-rise if-d2 relative rotate-[0.4deg] p-5 sm:p-6" data-testid="hero-result-preview">
      <div className="flex items-center justify-between">
        <span className="if-eyebrow">Real result · sample salon</span>
        <span className="if-chip border-emerald-200 bg-emerald-50 text-emerald-800">{pick?.fit_label || 'Great match'}</span>
      </div>
      {pick ? (
        <>
          <p className="mt-4 font-display text-2xl font-extrabold">{pick.tool.name}</p>
          <p className="mt-1 text-[var(--ink-2)]">{pick.explanation?.one_line}</p>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-[var(--surface-warm)] p-3"><dt className="text-[var(--ink-3)]">Price</dt><dd className="font-semibold">{pick.tool.price_text}</dd></div>
            <div className="rounded-xl bg-[var(--surface-warm)] p-3"><dt className="text-[var(--ink-3)]">Time saved (rough)</dt><dd className="font-semibold">{pick.eta?.high ? `${pick.eta.low}–${pick.eta.high} h/week` : 'Not listed'}</dd></div>
            <div className="rounded-xl bg-[var(--surface-warm)] p-3"><dt className="text-[var(--ink-3)]">How well proven</dt><dd className="font-semibold">{pick.trust_label}</dd></div>
            <div className="rounded-xl bg-[var(--surface-warm)] p-3"><dt className="text-[var(--ink-3)]">Works with</dt><dd className="truncate font-semibold">{pick.tool.integrations?.slice(0, 2).join(', ') || 'Not listed'}</dd></div>
          </dl>
          <div className="mt-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/70 p-3 text-sm text-amber-900"><HelpCircle className="mr-1 inline h-4 w-4" />Unknown: {pick.unknowns?.slice(0, 2).join(' · ') || 'nothing major listed'}</div>
          <Link to="/demo/salon" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)] hover:underline" data-testid="hero-preview-link">See the full sample <ArrowRight className="h-4 w-4" /></Link>
        </>
      ) : <div className="mt-4 h-56 animate-pulse rounded-xl bg-[var(--surface-warm)]" />}
    </div>
  );
}

export default function Landing() {
  usePageTitle('');
  return (
    <div>
      <section className="if-warm-surface if-grain border-b border-[var(--line)]">
        <div className="if-container grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
          <div className="if-rise max-w-[620px]">
            <p className="if-eyebrow text-[var(--brand)]">For salons, cafés, trades, shops and more</p>
            <h1 className="mt-4 text-[clamp(2.6rem,5vw,5.2rem)] font-semibold leading-[0.96] tracking-[-0.06em] text-[var(--ink)]">
              Find the right AI tools for your business — <span className="text-[var(--brand)]">without wasting time or money.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[1.07rem] leading-7 text-[var(--ink-2)]">
              Answer 10 short questions. Get up to three tools that fit your budget, your software and your comfort with tech — with the evidence, the unknowns and a setup guide.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/start" className="if-btn-primary min-h-14 px-7 text-[1rem]" data-testid="hero-start-button">Find AI for my business <ArrowRight className="h-5 w-5" /></Link>
              <Link to="/demo" className="if-btn-ghost min-h-14 px-6 text-[1rem]" data-testid="hero-demo-button">Try a sample business</Link>
            </div>
            <p className="mt-4 text-sm text-[var(--ink-3)]">About 2 minutes. No sign-in until the end.</p>
          </div>
          <div className="if-rise if-d1">
            <Preview />
          </div>
        </div>
      </section>

      <section className="if-container py-20" aria-labelledby="how">
        <p className="if-eyebrow">How it works</p>
        <h2 id="how" className="mt-2 text-[clamp(2rem,3vw,2.8rem)] font-semibold leading-tight tracking-[-0.05em] text-[var(--ink)]">Three steps, plain words</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {[['Tell us about your business', 'Your headaches, budget, the software you use and how soon you need help.'], ['We check every tool the same way', 'A transparent scoring method ranks the tools. Missing information stays “not listed”.'], ['Pick, compare and set up', 'Save a tool, compare side by side, and follow a guide written for your comfort level.']].map(([t, d], i) => (
            <li key={t} className="if-card if-rise p-6" style={{ animationDelay: `${i * 0.08}s` }}>
              <span className="font-display text-[clamp(2.6rem,4vw,4rem)] font-semibold leading-none tracking-[-0.06em] text-[var(--brand)]/20">0{i + 1}</span>
              <p className="mt-4 text-[1.25rem] font-semibold tracking-[-0.04em] text-[var(--ink)]">{t}</p>
              <p className="mt-2 text-[0.98rem] leading-6 text-[var(--ink-2)]">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-[var(--line)] bg-white/80 py-20">
        <div className="if-container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="if-eyebrow">Sample businesses</p>
              <h2 className="mt-2 text-[clamp(2rem,3vw,2.8rem)] font-semibold leading-tight tracking-[-0.05em] text-[var(--ink)]">See real results, no account needed</h2>
            </div>
            <Link to="/demo" className="text-sm font-semibold text-[var(--brand)] hover:underline">All samples</Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {SAMPLES.map(({ slug, icon: Icon, title, text }) => (
              <Link key={slug} to={`/demo/${slug}`} className="if-card group p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_36px_-20px_rgba(17,24,39,0.2)]" data-testid={`landing-sample-${slug}`}>
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><Icon className="h-6 w-6" /></span>
                <p className="mt-4 text-[1.25rem] font-semibold tracking-[-0.04em] text-[var(--ink)]">{title}</p>
                <p className="mt-2 text-[0.96rem] leading-6 text-[var(--ink-2)]">{text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)]">See their top tools <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="if-container py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="if-eyebrow">How we judge a tool</p>
            <h2 className="mt-2 text-[clamp(2rem,3vw,2.8rem)] font-semibold leading-tight tracking-[-0.05em] text-[var(--ink)]">Seven checks. No paid placements.</h2>
            <p className="mt-4 max-w-md text-[1rem] leading-7 text-[var(--ink-2)]">Big, expensive tools built for large companies are kept out of the top three for small teams. When we don’t know something, we say so.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {CHECKS.map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex gap-3 rounded-[1.25rem] border border-[var(--line)] bg-white p-4 shadow-[0_8px_18px_-16px_rgba(15,23,42,0.18)]">
                <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[1rem] font-semibold text-[var(--ink)]">{t}</p>
                  <p className="mt-1 text-[0.85rem] leading-5 text-[var(--ink-2)]">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="if-container pb-20">
        <div className="if-card flex flex-col gap-6 bg-[linear-gradient(135deg,_#111827_0%,_#172033_40%,_#101828_100%)] p-8 text-white sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <h2 className="text-[clamp(2rem,3vw,2.8rem)] font-semibold leading-tight tracking-[-0.05em]">Ready when you are.</h2>
            <p className="mt-2 max-w-lg text-[0.98rem] leading-7 text-slate-300"><MessageCircle className="mr-2 inline h-4 w-4" />Your answers stay on your device until you sign in. We never sell your data and only contact you if you tick the box.</p>
          </div>
          <Link to="/start" className="if-btn min-h-14 bg-white px-7 text-[var(--ink)] hover:bg-slate-100" data-testid="cta-start-button">Find AI for my business</Link>
        </div>
      </section>
    </div>
  );
}
