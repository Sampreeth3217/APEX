import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, BookmarkX, CheckCircle2, CircleDashed, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useApi, usePageTitle } from '@/lib/hooks';
import { Loading, ErrorState, Empty } from '@/components/feedback/States';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ProfileForm } from './Onboarding';

const STATUS = { considering: ['Considering', CircleDashed, 'text-[var(--ink-2)]'], using: ['Using', CheckCircle2, 'text-emerald-700'], dropped: ['Dropped', BookmarkX, 'text-stone-500'] };

function useGuard() {
  const { user, loading } = useAuth(); const nav = useNavigate();
  useEffect(() => { if (!loading && !user) nav('/login', { replace: true }); }, [loading, user, nav]);
  return user;
}

function UsingDialog({ tool, onClose, onDone }) {
  const [comment, setComment] = useState(''); const [hours, setHours] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await api('/user-tools', { method: 'POST', body: { slug: tool.slug, status: 'using', hours_saved_reported: hours === '' ? null : Number(hours), comment } });
      toast.success('Marked as using'); onDone();
    } catch (x) { toast.error(x.message); } finally { setBusy(false); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid="using-dialog">
        <DialogHeader><DialogTitle>You’re using {tool.name}</DialogTitle><DialogDescription>Both answers are optional and help other owners.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <label className="block"><span className="text-sm font-semibold">One line about it (optional, shown with your first name)</span><input className="if-input mt-1" maxLength={200} value={comment} onChange={(e) => setComment(e.target.value)} data-testid="using-comment-input" /></label>
          <label className="block"><span className="text-sm font-semibold">Hours it really saves you each week (optional)</span><input className="if-input mt-1" type="number" min="0" max="80" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} data-testid="using-hours-input" /></label>
          <button type="submit" className="if-btn-primary w-full" disabled={busy} data-testid="using-submit-button">Save</button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Me() {
  usePageTitle('My tools');
  const user = useGuard();
  const { data, error, loading, reload } = useApi(user ? '/me' : null);
  const [using, setUsing] = useState(null);
  const setStatus = async (slug, status) => {
    if (status === 'dropped' && !window.confirm('Mark this tool as dropped?')) return;
    try { await api('/user-tools', { method: 'POST', body: { slug, status } }); reload(); } catch (e) { toast.error(e.message); }
  };
  const markRead = async (id) => { await api(`/notifications/${id}/read`, { method: 'POST' }).catch(() => {}); reload(); };
  if (!user) return null;
  return (
    <div className="if-container py-10 sm:py-14">
      <h1 className="text-3xl font-extrabold sm:text-4xl">My tools</h1>
      {loading && !data && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <section aria-labelledby="saved-h">
            <h2 id="saved-h" className="font-display text-lg font-bold">Saved tools</h2>
            {!data.saved.length && <div className="mt-3"><Empty title="Nothing saved yet">Save tools from <Link to="/dashboard" className="font-semibold text-[var(--brand)] hover:underline">your results</Link> or the <Link to="/tools" className="font-semibold text-[var(--brand)] hover:underline">marketplace</Link>.</Empty></div>}
            <ul className="mt-3 space-y-3">
              {data.saved.map((s) => { const [label, Icon, cls] = STATUS[s.status]; return (
                <li key={s.tool.slug} className="if-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between" data-testid={`saved-tool-${s.tool.slug}`}>
                  <div><Link to={`/tools/${s.tool.slug}`} className="font-display text-lg font-bold hover:underline">{s.tool.name}</Link>
                    <p className={`flex items-center gap-1.5 text-sm ${cls}`} data-testid={`saved-status-${s.tool.slug}`}><Icon className="h-4 w-4" />{label} · saved {new Date(s.updated_at).toLocaleDateString()}{s.hours_saved_reported !== null && s.hours_saved_reported !== undefined && ` · saves ${s.hours_saved_reported} h/week`}</p></div>
                  <div className="flex flex-wrap gap-2">
                    {s.status !== 'using' && <button type="button" className="if-btn-ghost min-h-11 px-3" onClick={() => setUsing(s.tool)} data-testid={`saved-using-${s.tool.slug}`}>I’m using this</button>}
                    {s.status !== 'dropped' && <button type="button" className="if-btn-quiet" onClick={() => setStatus(s.tool.slug, 'dropped')} data-testid={`saved-drop-${s.tool.slug}`}>Dropped it</button>}
                    <Link to={`/guide/${s.tool.slug}`} className="if-btn-quiet"><Wrench className="h-4 w-4" />Guide</Link>
                  </div>
                </li>); })}
            </ul>
          </section>
          <section aria-labelledby="notes-h">
            <h2 id="notes-h" className="flex items-center gap-2 font-display text-lg font-bold"><Bell className="h-5 w-5" />Alerts</h2>
            {!data.notifications.length && <p className="mt-3 text-[var(--ink-2)]">No alerts yet. If a better tool appears for something you saved, we’ll tell you here (at most once a week).</p>}
            <ul className="mt-3 space-y-3">
              {data.notifications.map((n) => (
                <li key={n.id} className={`if-card p-4 ${n.read_at ? 'opacity-70' : 'border-indigo-200'}`} data-testid="notification-item">
                  <p className="font-medium">{n.reason}</p>
                  <p className="mt-1 text-xs text-[var(--ink-3)]">{new Date(n.created_at).toLocaleString()}</p>
                  <div className="mt-2 flex gap-3 text-sm">{n.tool && <Link to={`/tools/${n.tool.slug}`} className="font-semibold text-[var(--brand)] hover:underline" onClick={() => markRead(n.id)}>See {n.tool.name}</Link>}{!n.read_at && <button type="button" className="text-[var(--ink-2)] hover:underline" onClick={() => markRead(n.id)} data-testid="notification-mark-read">Mark as read</button>}</div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
      {using && <UsingDialog tool={using} onClose={() => setUsing(null)} onDone={() => { setUsing(null); reload(); }} />}
    </div>
  );
}

export function Settings() {
  usePageTitle('Settings');
  const user = useGuard();
  const { setUser } = useAuth();
  const { data } = useApi(user ? '/me' : null);
  if (!user || !data) return user ? <div className="if-container"><Loading /></div> : null;
  const c = Object.fromEntries(data.consents.map((x) => [x.channel, x.granted]));
  const init = { name: user.name || '', business_name: user.business_name || '', location: user.location || '', phone: user.phone || '', email_consent: !!c.email, sms_consent: !!c.sms };
  const onSubmit = async (f) => { const d = await api('/me/settings', { method: 'PUT', body: f }); setUser(d.user); toast.success('Settings saved'); };
  return (
    <div className="if-container max-w-lg py-12">
      <h1 className="text-3xl font-extrabold">Settings</h1>
      <p className="mt-2 text-[var(--ink-2)]">Signed in as {user.email}. Untick a box any time to stop updates.</p>
      <div className="if-card mt-8 p-6 sm:p-8"><ProfileForm initial={init} submitLabel="Save settings" onSubmit={onSubmit} testPrefix="settings" /></div>
    </div>
  );
}
