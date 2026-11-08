import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { streamChat } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const PersonaCtx = createContext({ persona: null, setPersona: () => {} });
export function ChatPersonaProvider({ children }) {
  const [persona, setPersona] = useState(null);
  return <PersonaCtx.Provider value={{ persona, setPersona }}>{children}</PersonaCtx.Provider>;
}
export function useChatPersona(slug) {
  const { setPersona } = useContext(PersonaCtx);
  useEffect(() => { setPersona(slug); return () => setPersona(null); }, [slug, setPersona]);
}

const linkify = (text) => text.split(/(https?:\/\/[^\s)]+)/g).map((p, i) => (/^https?:/.test(p) ? <a key={i} href={p} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-[var(--brand)] underline">{p}</a> : p));

export function ChatWidget() {
  const { user } = useAuth();
  const { persona } = useContext(PersonaCtx);
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [extra, setExtra] = useState(null);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, open]);
  useEffect(() => { setMsgs([]); setExtra(null); }, [persona, user?.id]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim(); if (!text || busy) return;
    const history = [...msgs, { role: 'user', content: text }];
    setMsgs([...history, { role: 'assistant', content: '' }]); setInput(''); setBusy(true); setExtra(null);
    const append = (t) => setMsgs((m) => { const c = [...m]; c[c.length - 1] = { ...c[c.length - 1], content: c[c.length - 1].content + t }; return c; });
    try {
      await streamChat({ messages: history.slice(-10), ...(!user && persona ? { persona } : {}) }, (ev) => {
        if (ev.type === 'text') append(ev.text);
        if (ev.type === 'fallback') { append(ev.text); setExtra({ links: ev.links || [{ href: '/tools', label: 'Marketplace' }] }); }
        if (ev.type === 'action' && ev.action === 'refresh') setExtra({ refresh: true });
      });
    } catch (x) { append(x.message || 'The helper is busy right now.'); setExtra({ links: [{ href: '/tools', label: 'Marketplace' }] }); }
    setBusy(false);
  };

  return (
    <>
      {!open && (
        <button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-50 inline-flex min-h-14 items-center gap-2 rounded-2xl bg-[var(--ink)] px-5 font-semibold text-white shadow-xl transition-transform hover:-translate-y-0.5" data-testid="chat-launcher-button">
          <MessageCircle className="h-5 w-5" />Ask a question
        </button>
      )}
      {open && (
        <div className="fixed inset-x-3 bottom-3 z-50 flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-2xl sm:inset-x-auto sm:right-5 sm:w-[400px]" role="dialog" aria-label="APEX helper" data-testid="chat-panel">
          <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface-warm)] px-4 py-3">
            <div><p className="font-display font-bold">Helper</p><p className="text-xs text-[var(--ink-2)]">{persona && !user ? 'Talking about the sample business' : 'Answers from our tool catalog'}</p></div>
            <button type="button" onClick={() => setOpen(false)} className="if-btn-quiet min-h-10" aria-label="Close helper" data-testid="chat-close-button"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite" data-testid="chat-messages">
            {!msgs.length && <p className="rounded-xl bg-[var(--surface-warm)] p-3 text-sm text-[var(--ink-2)]">Hi! Ask me about tools — for example “Which booking tools have a free plan?” or “Does Jobber work with QuickBooks?”</p>}
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[0.95rem] ${m.role === 'user' ? 'ml-auto bg-[var(--brand)] text-white' : 'bg-[var(--surface-warm)]'}`} data-testid={`chat-message-${m.role}`}>
                {m.content ? linkify(m.content) : <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            ))}
            {extra?.links && <div className="flex flex-wrap gap-2">{extra.links.map((l) => <Link key={l.href} to={l.href} className="if-chip border-[var(--line)] bg-white" onClick={() => setOpen(false)}>{l.label}</Link>)}</div>}
            {extra?.refresh && user && <button type="button" className="if-btn-primary min-h-11 w-full" onClick={() => { setOpen(false); nav('/dashboard'); setTimeout(() => window.location.reload(), 50); }} data-testid="chat-refresh-results-button">Refresh my results</button>}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-[var(--line)] p-3">
            <input className="if-input min-h-11" value={input} onChange={(e) => setInput(e.target.value)} maxLength={1500} placeholder="Type your question" aria-label="Your question" data-testid="chat-input" />
            <button type="submit" className="if-btn-primary min-h-11 px-4" disabled={busy || !input.trim()} aria-label="Send" data-testid="chat-send-button"><Send className="h-4 w-4" /></button>
          </form>
          <p className="px-4 pb-3 text-[11px] text-[var(--ink-3)]">The helper can make mistakes. Tool pages list the sources.</p>
        </div>
      )}
    </>
  );
}
