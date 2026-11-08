import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Scissors, UtensilsCrossed, Wrench, Clock, UserX, BadgeCheck, MessageSquareText, ListChecks, Rocket,
  PhoneCall, CalendarCheck, Star, Receipt, Check, Eye, BookOpen, Sparkles, Lock,
} from 'lucide-react';
import { useApi, usePageTitle } from '@/lib/hooks';
import { Reveal, CountUp, prefersReducedMotion } from '@/lib/motion';

// Home page, inspired by Grassfeld: an inset gradient hero with floating product cards, a tabbed showcase on
// pastel panels, a big gradient number, and short, friendly copy throughout.

const SHOWCASE = [
  { slug: 'ai_receptionist', tab: 'Phone calls', icon: PhoneCall, tint: 'tint-teal', title: 'Never miss a customer call', text: 'An AI receptionist answers when you can’t, takes messages and books appointments.' },
  { slug: 'scheduling', tab: 'Bookings', icon: CalendarCheck, tint: 'tint-blue', title: 'Bookings that run themselves', text: 'Customers book online, get reminders, and no-shows drop.' },
  { slug: 'reviews_reputation', tab: 'Reviews', icon: Star, tint: 'tint-sand', title: 'More good reviews, less effort', text: 'Ask happy customers for reviews automatically and reply in seconds.' },
  { slug: 'bookkeeping', tab: 'Invoices', icon: Receipt, tint: 'tint-mint', title: 'Get your weekends back', text: 'Send invoices faster, chase payments and keep the books tidy.' },
];
const STEPS = [
  { icon: MessageSquareText, t: 'Answer 10 easy questions', d: 'About your business. No tech words.', tint: 'tint-teal' },
  { icon: ListChecks, t: 'Get your top 3 tools', d: 'Matched to your budget and needs.', tint: 'tint-blue' },
  { icon: Rocket, t: 'Set it up step by step', d: 'A simple guide for each tool.', tint: 'tint-sand' },
];
const SAMPLES = [
  { slug: 'salon', icon: Scissors, title: 'Hair salon', tint: 'tint-lilac' },
  { slug: 'restaurant', icon: UtensilsCrossed, title: 'Café', tint: 'tint-sand' },
  { slug: 'plumber', icon: Wrench, title: 'Plumber', tint: 'tint-teal' },
];
const PROMISES = [
  { icon: BadgeCheck, t: 'No paid rankings', d: 'Tools can’t pay to be recommended.' },
  { icon: Eye, t: 'Honest about gaps', d: 'If we don’t know a price, we say so.' },
  { icon: BookOpen, t: 'Plain English', d: 'Written for owners, not IT people.' },
  { icon: Lock, t: 'Private by default', d: 'Your answers stay on your device until you save them.' },
];

/* Floating product cards in the hero — built from the real sample result */
function HeroCards() {
  const { data } = useApi('/demo/salon');
  const pick = data?.persona?.results?.picks?.[0];
  const second = data?.persona?.results?.picks?.[1];
  return (
    <div className="relative mx-auto h-[27rem] w-full max-w-[29rem] sm:h-[27rem]" data-testid="hero-result-preview">
      <div className="if-card if-float if-pop-in if-floaty absolute inset-x-0 top-6 mx-auto w-[88%] p-5 sm:p-6" style={{ '--r': '-2deg', '--pd': '.15s' }}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-[var(--ink-3)]">Top pick for a hair salon</span>
          <span className="if-chip border-success-line bg-success-soft text-success">Great match</span>
        </div>
        {pick ? (
          <>
            <p className="mt-3 font-display text-2xl font-extrabold">{pick.tool.name}</p>
            <p className="mt-1 text-[var(--ink-2)]">{pick.explanation?.one_line}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[var(--surface-warm)] px-3 py-2"><p className="text-xs text-[var(--ink-3)]">Price</p><p className="font-semibold">{pick.tool.price_text}</p></div>
              <div className="rounded-xl bg-[var(--surface-warm)] px-3 py-2"><p className="text-xs text-[var(--ink-3)]">Time saved</p><p className="font-semibold">{pick.eta?.high ? `${pick.eta.low}–${pick.eta.high} hrs / wk` : 'Not sure yet'}</p></div>
            </div>
          </>
        ) : <div className="mt-3 h-36 animate-pulse rounded-xl bg-[var(--surface-warm)]" />}
      </div>
      {second && (
        <div className="if-card if-float if-pop-in if-floaty absolute left-0 bottom-2 flex w-56 max-w-[75%] items-center gap-3 p-3 sm:-left-8" style={{ '--r': '3deg', '--pd': '.45s', '--fd': '1.2s' }}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl tint-blue text-[var(--brand)]"><CalendarCheck className="h-5 w-5" /></span>
          <span className="min-w-0"><span className="block text-xs text-[var(--ink-3)]">Second pick</span><span className="block truncate font-semibold">{second.tool.name}</span></span>
        </div>
      )}
      <div className="if-card if-float if-pop-in if-floaty absolute right-0 bottom-16 flex items-center gap-2 px-3 py-2 sm:-right-6" style={{ '--r': '-3deg', '--pd': '.7s', '--fd': '2.4s' }}>
        <Sparkles className="h-4 w-4 text-[var(--brand)]" /><span className="text-sm font-semibold">Free trial available</span>
      </div>
    </div>
  );
}

/* An endless strip of real tool names, like Grassfeld's bank-logo row */
function ToolStrip() {
  const { data } = useApi('/tools?limit=24&sort=evidence');
  const items = data?.items || [];
  if (items.length < 4) return null;
  const row = [...items, ...items];
  return (
    <section className="py-10" aria-label="Some of the tools we compare">
      <p className="text-center text-sm font-medium text-[var(--ink-3)]">Some of the tools we compare</p>
      <div className="if-marquee-wrap mt-5 overflow-hidden">
        <ul className="if-marquee gap-3 pr-3">
          {row.map((t, i) => (
            <li key={`${t.slug}-${i}`} aria-hidden={i >= items.length}>
              <Link to={`/tools/${t.slug}`} tabIndex={i >= items.length ? -1 : 0} className="flex items-center gap-2.5 rounded-full border border-[var(--line)] bg-[var(--surface)] py-2 pl-2 pr-4 transition-colors hover:border-[var(--line-strong)]">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--brand-soft)] font-display text-sm font-extrabold text-[var(--brand)]">{t.name[0]}</span>
                <span className="whitespace-nowrap text-sm font-semibold">{t.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* Tabbed showcase on pastel panels, listing real tools from the catalog */
function Showcase() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto || prefersReducedMotion()) return undefined;
    const t = setInterval(() => setActive((i) => (i + 1) % SHOWCASE.length), 6000);
    return () => clearInterval(t);
  }, [auto]);
  const s = SHOWCASE[active];
  const { data } = useApi(`/tools?category=${s.slug}&limit=3&sort=evidence`, [s.slug]);
  const Icon = s.icon;
  return (
    <section className="if-container py-20" aria-labelledby="showcase">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="if-eyebrow">What APEX helps with</p>
        <h2 id="showcase" className="mt-3 text-[clamp(2rem,4vw,3.2rem)]">The busywork, handled</h2>
      </Reveal>
      <div className="-mx-4 mt-10 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:justify-center sm:px-0" role="tablist" aria-label="Problems APEX helps with">
        {SHOWCASE.map((x, i) => {
          const TabIcon = x.icon;
          return (
            <button key={x.slug} type="button" role="tab" aria-selected={i === active} onClick={() => { setAuto(false); setActive(i); }} data-testid={`showcase-tab-${x.slug}`}
              className={`relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-t-2xl rounded-b-md px-5 py-3 text-[0.95rem] font-semibold transition-colors ${i === active ? `${x.tint} text-[var(--ink)]` : 'bg-[var(--surface-warm)] text-[var(--ink-2)] hover:text-[var(--ink)]'}`}>
              <TabIcon className="h-4 w-4" />{x.tab}
              {auto && i === active && <span key={active} className="if-tab-progress" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      <div className={`${s.tint} mt-2 grid grid-cols-1 items-center gap-8 rounded-[1.9rem] p-5 transition-colors duration-500 sm:gap-10 sm:p-10 lg:grid-cols-2 lg:p-14`} role="tabpanel">
        <div key={s.slug} className="if-fade-up">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--surface)] text-[var(--brand)] if-float"><Icon className="h-7 w-7" /></span>
          <h3 className="mt-6 text-[clamp(1.7rem,3vw,2.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">{s.title}</h3>
          <p className="mt-3 max-w-md text-[1.05rem] text-[var(--ink-2)]">{s.text}</p>
          <div className="mt-7 grid grid-cols-1 gap-3 min-[400px]:flex min-[400px]:flex-wrap">
            <Link to="/start" className="if-btn-primary min-h-12 px-6">Find my tool <ArrowRight className="h-4 w-4" /></Link>
            <Link to={`/tools?category=${s.slug}`} className="if-btn min-h-12 bg-[var(--surface)] px-6 text-[var(--ink)] hover:bg-[var(--surface-hover)]">Browse tools</Link>
          </div>
        </div>
        <div key={`list-${s.slug}`} className="if-card if-float if-fade-up p-5 sm:p-6" style={{ '--d': '120ms' }}>
          <p className="text-sm text-[var(--ink-3)]">Popular {s.tab.toLowerCase()} tools</p>
          <ul className="mt-3 divide-y divide-[var(--line)]">
            {(data?.items || []).slice(0, 3).map((t, i) => (
              <li key={t.slug} className="if-fade-up" style={{ '--d': `${200 + i * 90}ms` }}>
                <Link to={`/tools/${t.slug}`} className="group flex items-center gap-3 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-warm)] font-display text-lg font-extrabold text-[var(--brand)]">{t.name[0]}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{t.name}</span><span className="block truncate text-sm text-[var(--ink-3)]">{t.price_text}</span></span>
                  {(t.has_free_plan || t.has_free_trial) && <span className="if-chip border-success-line bg-success-soft text-success">{t.has_free_plan ? 'Free plan' : 'Free trial'}</span>}
                  <ArrowUpRight className="h-4 w-4 text-[var(--ink-3)] group-hover:text-[var(--ink)]" />
                </Link>
              </li>
            ))}
            {!data && [0, 1, 2].map((k) => <li key={k} className="py-3"><div className="h-10 animate-pulse rounded-xl bg-[var(--surface-warm)]" /></li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Stat() {
  const { data } = useApi('/tools?limit=1');
  const n = data?.total;
  return (
    <section className="if-container pb-20">
      <Reveal className="if-sheet mx-0 bg-[var(--surface-warm)] px-6 py-16 text-center sm:mx-0 lg:mx-0">
        <p className="font-semibold text-[var(--ink-2)]">Tools we check for every owner</p>
        <p className="if-grad-anim mt-2 font-display text-[clamp(4.5rem,13vw,9rem)] font-extrabold leading-none tracking-[-0.04em]" data-testid="tool-count"><CountUp to={n} suffix="+" /></p>
        <p className="mx-auto mt-4 max-w-md text-[var(--ink-2)]">Every tool goes through the same checks — price, ease, reviews and what it works with.</p>
      </Reveal>
    </section>
  );
}

export default function Landing() {
  usePageTitle('');
  return (
    <div className="pt-2 sm:pt-3">
      {/* 1. Inset gradient hero */}
      <section className="if-sheet if-hero-panel relative overflow-hidden">
        <span className="if-blob if-blob-a -left-24 -top-24 h-[28rem] w-[28rem]" aria-hidden="true" />
        <span className="if-blob if-blob-b -bottom-32 right-[10%] h-[26rem] w-[26rem]" aria-hidden="true" />
        <span className="if-blob if-blob-c right-[-6rem] top-[-4rem] h-[20rem] w-[20rem]" aria-hidden="true" />
        <div className="if-container relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="max-w-xl">
            <p className="if-eyebrow if-rise">For salons, cafés, trades and shops</p>
            <h1 className="if-rise if-d1 mt-4 text-[clamp(2.7rem,5.6vw,4.9rem)]">Find the right AI tool for your business</h1>
            <p className="if-rise if-d2 mt-5 max-w-lg text-[1.15rem] leading-relaxed text-[var(--ink-2)]">Answer a few easy questions. We’ll suggest up to three tools that fit your budget — and show you how to set them up.</p>
            <div className="if-rise if-d3 mt-8 grid grid-cols-1 gap-3 min-[420px]:flex min-[420px]:flex-wrap min-[420px]:items-center">
              <Link to="/start" className="if-btn-primary if-press min-h-14 px-7 text-[1.05rem]" data-testid="hero-start-button">Get started — it’s free <ArrowRight className="h-5 w-5" /></Link>
              <Link to="/demo" className="if-btn-ghost min-h-14 px-6 text-[1rem]" data-testid="hero-demo-button">See an example</Link>
            </div>
            <ul className="if-rise if-d4 mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-[var(--ink-2)]">
              <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-[var(--brand)]" />Takes 2 minutes</li>
              <li className="flex items-center gap-2"><UserX className="h-4 w-4 text-[var(--brand)]" />No sign-up to start</li>
              <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-[var(--brand)]" />No paid rankings</li>
            </ul>
          </div>
          <HeroCards />
        </div>
      </section>

      <ToolStrip />

      {/* 2. How it works */}
      <section className="if-container py-20" aria-labelledby="how">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="if-eyebrow">How it works</p>
          <h2 id="how" className="mt-3 text-[clamp(2rem,4vw,3.2rem)]">Three simple steps</h2>
        </Reveal>
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, t, d, tint }, i) => (
            <Reveal as="li" key={t} delay={i} className={`${tint} if-lift rounded-[1.6rem] p-7`}>
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--surface)] text-[var(--brand)] if-float"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                <span className="font-display text-5xl font-extrabold leading-none text-[var(--ink)] opacity-10">{i + 1}</span>
              </div>
              <p className="mt-8 text-xl font-extrabold tracking-[-0.02em]">{t}</p>
              <p className="mt-1 text-[var(--ink-2)]">{d}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* 3. Tabbed showcase on pastel panels */}
      <Showcase />

      {/* 4. Big gradient number */}
      <Stat />

      {/* 5. Examples */}
      <section className="if-container pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="if-eyebrow">Try it without signing up</p><h2 className="mt-3 text-[clamp(2rem,4vw,3.2rem)]">See a business like yours</h2></div>
          <Link to="/demo" className="if-btn-ghost">All examples <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {SAMPLES.map(({ slug, icon: Icon, title, tint }, i) => (
            <Reveal key={slug} delay={i}><Link to={`/demo/${slug}`} className={`${tint} if-lift group relative flex h-full min-h-[12rem] flex-col justify-between rounded-[1.6rem] p-7`} data-testid={`landing-sample-${slug}`}>
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--surface)] text-[var(--brand)] if-float"><Icon className="h-7 w-7" /></span>
              <span className="flex items-center justify-between gap-3">
                <span className="text-2xl font-extrabold tracking-[-0.02em]">{title}</span>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--surface)] transition-transform group-hover:rotate-45"><ArrowUpRight className="h-5 w-5" /></span>
              </span>
            </Link></Reveal>
          ))}
        </div>
      </section>

      {/* 6. Promises */}
      <section className="if-container pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map(({ icon: Icon, t, d }, i) => (
            <Reveal key={t} delay={i} className="rounded-[1.4rem] border border-[var(--line)] p-6">
              <Icon className="h-6 w-6 text-[var(--brand)]" aria-hidden="true" />
              <p className="mt-4 text-lg font-extrabold tracking-[-0.01em]">{t}</p>
              <p className="mt-1 text-[var(--ink-2)]">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 7. Closing call to action */}
      <section className="if-sheet relative mb-3 overflow-hidden bg-inverse px-6 py-20 text-center">
        <span className="if-blob if-blob-a left-[10%] top-[-8rem] h-[22rem] w-[22rem] !opacity-30" aria-hidden="true" />
        <span className="if-blob if-blob-b bottom-[-10rem] right-[8%] h-[24rem] w-[24rem] !opacity-30" aria-hidden="true" />
        <Reveal className="relative">
        <h2 className="mx-auto max-w-2xl text-[clamp(2.2rem,5vw,4rem)] text-inverse-on">Ready to find your tool?</h2>
        <p className="mx-auto mt-4 max-w-md text-inverse-on2">Two minutes, ten easy questions, three clear answers.</p>
        <ul className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-inverse-on2">
          {['Free to use', 'No sign-up to start', 'No paid rankings'].map((x) => <li key={x} className="flex items-center gap-1.5"><Check className="h-4 w-4" />{x}</li>)}
        </ul>
        <Link to="/start" className="if-btn if-press mt-9 min-h-14 bg-[var(--surface)] px-8 text-[1.05rem] text-[var(--ink)] hover:bg-[var(--surface-hover)]" data-testid="cta-start-button">Get started <ArrowRight className="h-5 w-5" /></Link>
        </Reveal>
      </section>
    </div>
  );
}
