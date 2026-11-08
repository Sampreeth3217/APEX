import { Link, useParams } from 'react-router-dom';
import { ArrowRight, FlaskConical, Scissors, UtensilsCrossed, Wrench } from 'lucide-react';
import { useApi, usePageTitle } from '@/lib/hooks';
import { ResultsView } from '@/components/dashboard/ResultsView';
import { SkeletonCards, ErrorState, Empty } from '@/components/feedback/States';
import { useChatPersona } from '@/components/chat/ChatWidget';

const ICON = { salon: Scissors, restaurant: UtensilsCrossed, plumber: Wrench };

const SampleBanner = () => (
  <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900" role="note" data-testid="demo-sample-banner">
    <FlaskConical className="h-4 w-4" />Sample data — a made-up business, scored with the real method and real catalog.
  </div>
);

export function DemoIndex() {
  usePageTitle('Sample businesses');
  const { data, error, loading, reload } = useApi('/demo');
  return (
    <div className="if-container py-12">
      <SampleBanner />
      <h1 className="mt-6 text-3xl font-extrabold sm:text-4xl">Try a sample business</h1>
      <p className="mt-2 max-w-2xl text-[var(--ink-2)]">No account needed. Each sample has answered the same 10 questions you would.</p>
      <div className="mt-10">
        {loading && <SkeletonCards />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && !data.personas.length && <Empty title="Samples are being prepared">Please check back in a moment.</Empty>}
        <div className="grid gap-5 md:grid-cols-3">
          {data?.personas.sort((a, b) => ['salon', 'restaurant', 'plumber'].indexOf(a.slug) - ['salon', 'restaurant', 'plumber'].indexOf(b.slug)).map((p) => {
            const Icon = ICON[p.slug] || FlaskConical;
            return (
              <Link key={p.slug} to={`/demo/${p.slug}`} className="if-card group flex flex-col p-6 transition-transform hover:-translate-y-1" data-testid={`demo-persona-${p.slug}`}>
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><Icon className="h-6 w-6" /></span>
                <p className="mt-4 font-display text-lg font-bold">{p.label}</p>
                <p className="mt-2 flex-1 text-[var(--ink-2)]">{p.summary}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)]">See results <ArrowRight className="h-4 w-4" /></span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function DemoPersona() {
  const { slug } = useParams();
  const { data, error, loading, reload } = useApi(`/demo/${slug}`);
  const p = data?.persona;
  usePageTitle(p?.label || 'Sample business');
  useChatPersona(slug);
  return (
    <div className="if-container py-10 sm:py-14">
      <SampleBanner />
      {loading && <div className="mt-8"><SkeletonCards /></div>}
      {error && <div className="mt-8"><ErrorState error={error} onRetry={reload} /></div>}
      {p && (
        <>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl"><p className="if-eyebrow">Sample results</p><h1 className="mt-2 text-3xl font-extrabold sm:text-4xl" data-testid="demo-persona-title">{p.label}</h1><p className="mt-3 text-[var(--ink-2)]">{p.summary}</p></div>
            <Link to="/start" className="if-btn-primary" data-testid="demo-start-own-button">Find tools for my business</Link>
          </div>
          <div className="mt-10"><ResultsView results={p.results} readOnly guideQuery={`?persona=${p.slug}`} /></div>
        </>
      )}
    </div>
  );
}
