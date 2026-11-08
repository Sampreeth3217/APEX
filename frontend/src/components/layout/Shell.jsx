import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Bookmark, Settings, Shield, Store } from 'lucide-react';
import { useAuth, startLogin } from '@/lib/auth';

export const Logo = () => (
  <Link to="/" className="flex items-center gap-2.5" data-testid="header-logo-link">
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--brand)] text-white shadow-sm">
      <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true"><path d="M9 23V9h14" stroke="currentColor" strokeWidth="3.2" fill="none" strokeLinecap="round" /><circle cx="21.5" cy="21.5" r="3.2" fill="#FBBF24" /></svg>
    </span>
    <span className="font-display text-lg font-extrabold tracking-tight">APEX</span>
  </Link>
);

const NAV = [
  { to: '/tools', label: 'Marketplace', id: 'nav-marketplace' },
  { to: '/demo', label: 'Sample businesses', id: 'nav-demo' },
  { to: '/compare', label: 'Compare', id: 'nav-compare' },
];

export function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const linkCls = ({ isActive }) => `rounded-lg px-3 py-2 text-[0.95rem] font-medium transition-colors ${isActive ? 'text-[var(--brand)] bg-[var(--brand-soft)]' : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-warm)]'}`;
  const doLogout = async () => { await logout(); setOpen(false); nav('/'); };
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(250,248,245,.88)] backdrop-blur-md">
      <div className="if-container flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => <NavLink key={n.to} to={n.to} className={linkCls} data-testid={n.id}>{n.label}</NavLink>)}
          {user && <NavLink to="/dashboard" className={linkCls} data-testid="nav-dashboard">My results</NavLink>}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link to="/me" className="if-btn-quiet" data-testid="nav-my-tools"><Bookmark className="h-4 w-4" />My tools</Link>
              {user.is_admin && <Link to="/admin" className="if-btn-quiet" data-testid="nav-admin"><Shield className="h-4 w-4" />Admin</Link>}
              <Link to="/me/settings" className="if-btn-quiet" aria-label="Settings" data-testid="nav-settings"><Settings className="h-4 w-4" /></Link>
              <button type="button" onClick={doLogout} className="if-btn-quiet" data-testid="nav-logout-button"><LogOut className="h-4 w-4" />Sign out</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => startLogin('/dashboard')} className="if-btn-quiet" data-testid="nav-signin-button">Sign in</button>
              <Link to="/start" className="if-btn-primary min-h-11" data-testid="nav-start-button">Find AI for my business</Link>
            </>
          )}
        </div>
        <button type="button" className="if-btn-quiet md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu" data-testid="nav-mobile-toggle">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-[var(--line)] bg-[var(--canvas)] md:hidden" data-testid="nav-mobile-menu">
          <div className="if-container flex flex-col gap-1 py-3" onClick={() => setOpen(false)}>
            {NAV.map((n) => <NavLink key={n.to} to={n.to} className={linkCls}>{n.label}</NavLink>)}
            {user ? (
              <>
                <NavLink to="/dashboard" className={linkCls}>My results</NavLink>
                <NavLink to="/me" className={linkCls}>My tools</NavLink>
                <NavLink to="/me/settings" className={linkCls}>Settings</NavLink>
                {user.is_admin && <NavLink to="/admin" className={linkCls}>Admin</NavLink>}
                <button type="button" onClick={doLogout} className="if-btn-ghost mt-2">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/start" className="if-btn-primary mt-2">Find AI for my business</Link>
                <button type="button" onClick={() => startLogin('/dashboard')} className="if-btn-ghost">Sign in</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--line)] bg-[var(--surface-warm)]">
      <div className="if-container grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-sm text-[var(--ink-2)]">Recommendations come from a transparent scoring method, not from payments. Nothing here is an endorsement or a guarantee. No sponsored placements.</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="if-eyebrow">Explore</p>
          <Link to="/tools" className="block text-[var(--ink-2)] hover:text-[var(--ink)]" data-testid="footer-marketplace-link"><Store className="mr-1 inline h-4 w-4" />Marketplace</Link>
          <Link to="/demo" className="block text-[var(--ink-2)] hover:text-[var(--ink)]">Sample businesses</Link>
          <Link to="/providers/new" className="block text-[var(--ink-2)] hover:text-[var(--ink)]" data-testid="footer-provider-link">List your tool</Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="if-eyebrow">About</p>
          <Link to="/privacy" className="block text-[var(--ink-2)] hover:text-[var(--ink)]" data-testid="footer-privacy-link">Privacy</Link>
          <Link to="/terms" className="block text-[var(--ink-2)] hover:text-[var(--ink)]" data-testid="footer-terms-link">Terms</Link>
          <Link to="/contact" className="block text-[var(--ink-2)] hover:text-[var(--ink)]" data-testid="footer-contact-link">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
