import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { usePageTitle } from '@/lib/hooks';
import { loadAnswers } from '@/lib/answers';
import { submitAnswers } from './AuthContinue';

export const CONSENT = { email: 'Email me about updates to my search', sms: 'Text me about updates to my search' };

const Field = ({ label, optional, error, children, hint }) => (
  <label className="block">
    <span className="font-semibold">{label} {optional ? <span className="font-normal text-[var(--ink-3)]">(optional)</span> : <span className="text-red-700" aria-hidden="true">*</span>}</span>
    {hint && <span className="block text-sm text-[var(--ink-2)]">{hint}</span>}
    <div className="mt-1.5">{children}</div>
    {error && <span className="mt-1 block text-sm font-medium text-red-700" role="alert">{error}</span>}
  </label>
);

export function ProfileForm({ initial, submitLabel, onSubmit, testPrefix, showName = true }) {
  const [f, setF] = useState(initial);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { setF(initial); }, [initial]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (showName && !f.name?.trim()) er.name = 'Please add your name.';
    if (f.sms_consent && !f.phone?.trim()) er.phone = 'Add a phone number to get text updates.';
    setErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try { await onSubmit(f); } catch (x) { setErr({ [x.field || 'form']: x.message }); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {showName && <Field label="Your name" error={err.name}><input className="if-input" value={f.name || ''} onChange={set('name')} autoComplete="name" data-testid={`${testPrefix}-name-input`} /></Field>}
      <Field label="Business name" optional><input className="if-input" value={f.business_name || ''} onChange={set('business_name')} data-testid={`${testPrefix}-business-input`} /></Field>
      <Field label="City or ZIP" optional><input className="if-input" value={f.location || ''} onChange={set('location')} autoComplete="postal-code" data-testid={`${testPrefix}-location-input`} /></Field>
      <Field label="Phone" optional hint="Only needed if you want text updates." error={err.phone}><input className="if-input" type="tel" value={f.phone || ''} onChange={set('phone')} autoComplete="tel" data-testid={`${testPrefix}-phone-input`} /></Field>
      <fieldset className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-warm)]/50 p-4">
        <legend className="px-1 text-sm font-semibold">Updates (both optional)</legend>
        <label className="flex min-h-11 items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--brand)]" checked={!!f.email_consent} onChange={set('email_consent')} data-testid={`${testPrefix}-email-consent`} /><span>{CONSENT.email}</span></label>
        <label className="flex min-h-11 items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--brand)]" checked={!!f.sms_consent} onChange={set('sms_consent')} data-testid={`${testPrefix}-sms-consent`} /><span>{CONSENT.sms}</span></label>
      </fieldset>
      {err.form && <p className="font-medium text-red-700" role="alert" data-testid={`${testPrefix}-error`}>{err.form}</p>}
      <button type="submit" className="if-btn-primary w-full min-h-14" disabled={busy} data-testid={`${testPrefix}-submit-button`}>{busy ? 'Saving…' : submitLabel}</button>
    </form>
  );
}

export default function Onboarding() {
  usePageTitle('A few details');
  const { user, setUser, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !user) nav('/login', { replace: true }); }, [loading, user, nav]);
  if (!user) return null;
  const init = { name: user.name || '', business_name: user.business_name || '', location: user.location || '', phone: user.phone || '', email_consent: false, sms_consent: false };
  const onSubmit = async (f) => {
    const d = await api('/onboarding', { method: 'POST', body: { ...f, phone: f.phone.trim() } });
    setUser(d.user);
    if (loadAnswers().completed) { await submitAnswers(); nav('/dashboard', { replace: true }); } else nav('/start', { replace: true });
  };
  return (
    <div className="if-container max-w-lg py-12">
      <h1 className="text-3xl font-extrabold">Nice to meet you{user.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
      <p className="mt-2 text-[var(--ink-2)]">A few details, then your results.</p>
      <div className="if-card mt-8 p-6 sm:p-8"><ProfileForm initial={init} submitLabel="Show my results" onSubmit={onSubmit} testPrefix="onboarding" /></div>
    </div>
  );
}
