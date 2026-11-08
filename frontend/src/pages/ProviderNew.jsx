import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth, startLogin } from '@/lib/auth';
import { useApi, useMeta, usePageTitle } from '@/lib/hooks';

const init = { name: '', category: '', best_for: '', summary: '', website_url: '', help_url: '', contact_email: '', pricing_notes: '', has_free_plan: null, has_free_trial: null, ai_features: '', integrations: '' };
const tri = (v) => (v === null ? '' : String(v));
const fromTri = (v) => (v === '' ? null : v === 'true');

export default function ProviderNew() {
  usePageTitle('List your tool');
  const { user } = useAuth();
  const meta = useMeta();
  const mine = useApi(user ? '/providers/mine' : null);
  const [f, setF] = useState(init); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  if (!user) return (
    <div className="if-container max-w-xl py-14"><div className="if-card p-8"><h1 className="text-2xl font-extrabold">List your AI tool</h1><p className="mt-2 text-[var(--ink-2)]">Sign in to submit a listing. Every listing is reviewed by our team before it appears.</p><button type="button" className="if-btn-primary mt-6" onClick={() => startLogin('/providers/new')} data-testid="provider-signin-button">Sign in to continue</button></div></div>
  );
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    const list = (s) => s.split(/[;,\n]/).map((x) => x.trim()).filter(Boolean);
    try {
      await api('/providers', { method: 'POST', body: { ...f, has_free_plan: fromTri(tri(f.has_free_plan)), has_free_trial: fromTri(tri(f.has_free_trial)), ai_features: list(f.ai_features), integrations: list(f.integrations), help_url: f.help_url || '' } });
      toast.success('Submitted for review'); setF(init); mine.reload();
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  const L = ({ label, req, children }) => <label className="block"><span className="font-semibold">{label}{req && <span className="text-danger"> *</span>}</span><div className="mt-1.5">{children}</div></label>;
  return (
    <div className="if-container max-w-2xl py-12">
      <h1 className="text-3xl font-extrabold">List your AI tool</h1>
      <p className="mt-2 text-[var(--ink-2)]">Your listing starts as <strong>pending</strong>. Only our admins can publish it. Your own website counts as a company-written source.</p>
      <form onSubmit={submit} className="if-card mt-8 space-y-5 p-6 sm:p-8">
        <L label="Tool name" req><input className="if-input" required value={f.name} onChange={set('name')} data-testid="provider-name-input" /></L>
        <L label="Category" req><select className="if-input" required value={f.category} onChange={set('category')} data-testid="provider-category-select"><option value="">Choose…</option>{meta?.categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select></L>
        <L label="Short description" req><textarea className="if-input min-h-24 py-3" required minLength={10} maxLength={1000} value={f.summary} onChange={set('summary')} data-testid="provider-summary-input" /></L>
        <L label="Best for"><input className="if-input" maxLength={300} value={f.best_for} onChange={set('best_for')} data-testid="provider-bestfor-input" /></L>
        <div className="grid gap-5 sm:grid-cols-2">
          <L label="Website" req><input className="if-input" type="url" required placeholder="https://" value={f.website_url} onChange={set('website_url')} data-testid="provider-website-input" /></L>
          <L label="Help / support page"><input className="if-input" type="url" placeholder="https://" value={f.help_url} onChange={set('help_url')} data-testid="provider-help-input" /></L>
        </div>
        <L label="Contact email" req><input className="if-input" type="email" required value={f.contact_email} onChange={set('contact_email')} data-testid="provider-email-input" /></L>
        <L label="Pricing in plain words"><input className="if-input" maxLength={500} placeholder="e.g. From $29 per month" value={f.pricing_notes} onChange={set('pricing_notes')} data-testid="provider-pricing-input" /></L>
        <div className="grid gap-5 sm:grid-cols-2">
          <L label="Free plan?"><select className="if-input" value={tri(f.has_free_plan)} onChange={(e) => setF({ ...f, has_free_plan: fromTri(e.target.value) })} data-testid="provider-freeplan-select"><option value="">Not sure</option><option value="true">Yes</option><option value="false">No</option></select></L>
          <L label="Free trial?"><select className="if-input" value={tri(f.has_free_trial)} onChange={(e) => setF({ ...f, has_free_trial: fromTri(e.target.value) })} data-testid="provider-trial-select"><option value="">Not sure</option><option value="true">Yes</option><option value="false">No</option></select></L>
        </div>
        <L label="AI features (separate with commas)"><input className="if-input" value={f.ai_features} onChange={set('ai_features')} data-testid="provider-features-input" /></L>
        <L label="Works with (separate with commas)"><input className="if-input" value={f.integrations} onChange={set('integrations')} data-testid="provider-integrations-input" /></L>
        {err && <p className="font-medium text-danger" role="alert" data-testid="provider-error">{err}</p>}
        <button type="submit" className="if-btn-primary w-full" disabled={busy} data-testid="provider-submit-button">{busy ? 'Submitting…' : 'Submit for review'}</button>
      </form>
      {mine.data?.tools?.length > 0 && (
        <section className="mt-10"><h2 className="font-display text-lg font-bold">Your submissions</h2>
          <ul className="mt-3 space-y-2">{mine.data.tools.map((t) => <li key={t.id} className="if-card flex justify-between p-4" data-testid={`provider-submission-${t.slug}`}><span>{t.name}</span><span className="if-chip border-[var(--line)] bg-[var(--surface-warm)] capitalize">{t.status}</span></li>)}</ul></section>
      )}
    </div>
  );
}
