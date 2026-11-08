import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, X, BellRing, Gauge, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useApi, usePageTitle } from '@/lib/hooks';
import { Loading, ErrorState, Empty } from '@/components/feedback/States';

const Denied = () => <div className="if-container py-14"><Empty title="Admins only">This page is only for APEX admins.</Empty></div>;

export function Admin() {
  usePageTitle('Admin');
  const { user, loading: al } = useAuth();
  const pending = useApi(user?.is_admin ? '/admin/pending' : null);
  const [busy, setBusy] = useState('');
  const [log, setLog] = useState(null);
  if (al) return <div className="if-container"><Loading /></div>;
  if (!user?.is_admin) return <Denied />;
  const run = async (key, path, body, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(key);
    try { const d = await api(path, { method: 'POST', body }); setLog(d); toast.success('Done'); pending.reload(); } catch (e) { toast.error(e.message); } finally { setBusy(''); }
  };
  return (
    <div className="if-container py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4"><h1 className="text-3xl font-extrabold">Admin</h1><Link to="/admin/llm" className="if-btn-ghost" data-testid="admin-llm-link"><Gauge className="h-4 w-4" />AI usage</Link></div>
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">Pending submissions</h2>
        {pending.loading && <Loading />}
        {pending.error && <ErrorState error={pending.error} onRetry={pending.reload} />}
        {pending.data && !pending.data.tools.length && <p className="mt-2 text-[var(--ink-2)]">Nothing waiting for review.</p>}
        <ul className="mt-3 space-y-3">
          {pending.data?.tools.map((t) => (
            <li key={t.id} className="if-card p-5" data-testid={`admin-pending-${t.slug}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-2xl"><p className="font-display text-lg font-bold">{t.name}</p><p className="text-sm text-[var(--ink-2)]">{t.category} · {t.contact_email}</p><p className="mt-2">{t.summary}</p>
                  <p className="mt-2 text-sm">Price: {t.pricing_notes || 'Not listed'} · Website: {t.website_url ? <a className="text-[var(--brand)] hover:underline" href={t.website_url} target="_blank" rel="noopener noreferrer nofollow">{t.website_url}</a> : 'Not listed'}</p></div>
                <div className="flex gap-2">
                  <button type="button" className="if-btn-primary min-h-11" disabled={!!busy} onClick={() => run(t.id, '/admin/approve', { id: t.id, decision: 'approve' }, `Publish ${t.name}? It will go live, be labelled and alerts will run.`)} data-testid={`admin-approve-${t.slug}`}><Check className="h-4 w-4" />Approve</button>
                  <button type="button" className="if-btn-ghost min-h-11" disabled={!!busy} onClick={() => run(t.id, '/admin/approve', { id: t.id, decision: 'reject' }, `Reject ${t.name}?`)} data-testid={`admin-reject-${t.slug}`}><X className="h-4 w-4" />Reject</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="if-card mt-10 border-amber-300 p-6">
        <p className="if-eyebrow text-amber-800">Demo / test mode</p>
        <h2 className="mt-1 font-display text-lg font-bold">Add a better tool and run alerts</h2>
        <p className="mt-1 text-[var(--ink-2)]">Adds a clearly labelled sample booking tool, then runs the better-tool check. Alerts appear in-app only — no emails or texts are sent.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="if-btn-primary" disabled={!!busy} onClick={() => run('demo', '/admin/demo-better-tool', {}, 'Add the sample tool and run alerts?')} data-testid="admin-demo-better-tool-button"><BellRing className="h-4 w-4" />Add sample tool & run alerts</button>
          <button type="button" className="if-btn-ghost" disabled={!!busy} onClick={() => run('rm', '/admin/demo-better-tool/remove', {}, 'Remove the sample tool from the catalog?')} data-testid="admin-demo-remove-button">Remove sample tool</button>
          <button type="button" className="if-btn-ghost" disabled={!!busy} onClick={() => run('rematch', '/jobs/rematch', {})} data-testid="admin-rematch-button"><RefreshCw className="h-4 w-4" />Run alerts only</button>
          <button type="button" className="if-btn-ghost" disabled={!!busy} onClick={() => run('regen', '/admin/regenerate-demo', {}, 'Regenerate the three sample businesses? This may use AI credit.')} data-testid="admin-regenerate-demo-button">Regenerate samples</button>
        </div>
        {busy && <Loading label="Working…" />}
        {log && <pre className="mt-4 overflow-x-auto rounded-xl bg-[var(--surface-warm)] p-4 text-xs" data-testid="admin-action-result">{JSON.stringify(log, null, 2)}</pre>}
      </section>
    </div>
  );
}

export function AdminLlm() {
  usePageTitle('AI usage');
  const { user, loading: al } = useAuth();
  const { data, error, loading, reload } = useApi(user?.is_admin ? '/admin/llm' : null);
  if (al) return <div className="if-container"><Loading /></div>;
  if (!user?.is_admin) return <Denied />;
  const $ = (n) => `$${Number(n || 0).toFixed(4)}`;
  return (
    <div className="if-container py-10 sm:py-14">
      <Link to="/admin" className="text-sm text-[var(--ink-2)] hover:underline">← Admin</Link>
      <h1 className="mt-2 text-3xl font-extrabold">AI usage today</h1>
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[['Spend today', `${$(data.budget.today)} of $${data.budget.daily_cap}`, 'llm-spend-today'], ['Total spend', `${$(data.budget.total)} of $${data.budget.total_cap}`, 'llm-spend-total'], ['Cache hit rate', `${Math.round(data.cache_hit_rate * 100)}%`, 'llm-cache-rate'], ['Fallbacks today', data.fallbacks_today, 'llm-fallbacks']].map(([l, v, id]) => (
              <div key={l} className="if-card p-5" data-testid={id}><p className="text-sm text-[var(--ink-2)]">{l}</p><p className="mt-1 font-display text-2xl font-extrabold">{v}</p></div>
            ))}
          </div>
          <p className={`mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-semibold ${data.budget.blocked ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`} data-testid="llm-budget-status">{data.budget.blocked ? 'Budget guard ACTIVE — AI calls use fallbacks' : 'Budget guard on — within budget'}{!data.llm_enabled && ' · AI is switched off'}</p>
          <div className="if-card mt-6 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm" data-testid="llm-by-task-table">
              <thead><tr className="border-b border-[var(--line)]">{['Task', 'Calls', 'Spend', 'Cache hits', 'Fallbacks'].map((h) => <th key={h} className="p-3 font-semibold">{h}</th>)}</tr></thead>
              <tbody>{data.by_task.map((t) => <tr key={t.task} className="border-b border-[var(--line)] last:border-0"><td className="p-3 font-medium">{t.task}</td><td className="p-3">{t.calls}</td><td className="p-3">{$(t.cost)}</td><td className="p-3">{t.cache_hits}</td><td className="p-3">{t.fallbacks}</td></tr>)}
                {!data.by_task.length && <tr><td className="p-3 text-[var(--ink-2)]" colSpan={5}>No AI calls yet today.</td></tr>}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
