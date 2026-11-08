import { AlertCircle, Loader2, Inbox } from 'lucide-react';

export const Loading = ({ label = 'Loading…' }) => (
  <div className="flex items-center gap-3 py-16 text-[var(--ink-2)]" role="status" aria-live="polite" data-testid="loading-state">
    <Loader2 className="h-5 w-5 animate-spin text-[var(--brand)]" />{label}
  </div>
);

export const SkeletonCards = ({ n = 3 }) => (
  <div className="grid gap-5 md:grid-cols-3" aria-hidden="true">
    {Array.from({ length: n }).map((_, i) => <div key={i} className="if-card h-64 animate-pulse bg-[var(--surface-warm)]" />)}
  </div>
);

export const ErrorState = ({ error, onRetry }) => (
  <div className="if-card flex flex-col items-start gap-3 border-danger-line bg-danger-soft p-6" role="alert" data-testid="error-state">
    <p className="flex items-center gap-2 font-semibold text-danger"><AlertCircle className="h-5 w-5" />{error?.message || 'Something went wrong.'}</p>
    {onRetry && <button type="button" className="if-btn-ghost" onClick={onRetry} data-testid="error-retry-button">Try again</button>}
  </div>
);

export const Empty = ({ title, children }) => (
  <div className="if-card flex flex-col items-start gap-2 p-8" data-testid="empty-state">
    <Inbox className="h-6 w-6 text-[var(--ink-3)]" />
    <p className="font-display text-lg font-bold">{title}</p>
    <div className="text-[var(--ink-2)]">{children}</div>
  </div>
);

export const NotListed = () => <span className="italic text-[var(--ink-3)]">Not listed</span>;
