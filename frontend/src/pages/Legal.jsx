import { Link } from 'react-router-dom';
import { usePageTitle } from '@/lib/hooks';

const PAGES = {
  privacy: { title: 'Privacy', body: ['Your questionnaire answers stay in your browser until you sign in. After sign-in we store your answers, results, saved tools, guide progress and chat messages so you can come back to them. Only you can see them.', 'We use your Google name and email to sign you in. Public comments show only your first name and business type.', 'We contact you only on the channels you tick. You can untick them any time in Settings. Text messages are not sent at this time.', 'Placeholder: full privacy policy and data controller details will be added by the APEX team.'] },
  terms: { title: 'Terms', body: ['APEX suggests software based on a published scoring method and the information in our catalog. A recommendation is not an endorsement, guarantee or professional advice.', 'Prices, features and reviews come from third-party sources and may be out of date. Always check with the provider before paying.', 'There are no sponsored placements.', 'Placeholder: full terms of use will be added by the APEX team.'] },
  contact: { title: 'Contact', body: ['Placeholder: contact details will be added by the APEX team.', 'Tool providers can submit a listing from the “List your tool” page.'] },
};

export function Legal({ page }) {
  const p = PAGES[page];
  usePageTitle(p.title);
  return (
    <div className="if-container max-w-2xl py-14">
      <h1 className="text-3xl font-extrabold">{p.title}</h1>
      <div className="mt-6 space-y-4 text-[var(--ink-2)]">{p.body.map((b) => <p key={b}>{b}</p>)}</div>
    </div>
  );
}

export function NotFound() {
  usePageTitle('Page not found');
  return (
    <div className="if-container max-w-xl py-20" data-testid="not-found">
      <p className="font-display text-6xl font-extrabold text-[var(--brand)]/30">404</p>
      <h1 className="mt-2 text-3xl font-extrabold">We couldn’t find that page</h1>
      <div className="mt-6 flex gap-2"><Link to="/" className="if-btn-primary">Go home</Link><Link to="/tools" className="if-btn-ghost">Browse tools</Link></div>
    </div>
  );
}
