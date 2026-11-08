import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Bookmark, Settings, Shield, Store, MoonStar, SunMedium } from 'lucide-react';
import { useAuth, startLogin } from '@/lib/auth';

export const Logo = () => (
  <Link to="/" className="flex items-center gap-2.5" data-testid="header-logo-link">
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[linear-gradient(135deg,_#635bff,_#3478f6)] text-white shadow-[0_10px_26px_-12px_rgba(99,91,255,0.8)]">
      <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true"><path d="M9 23V9h14" stroke="currentColor" strokeWidth="3.2" fill="none" strokeLinecap="round" /><circle cx="21.5" cy="21.5" r="3.2" fill="#F8D07A" /></svg>
    </span>
    <span className="font-display text-[1.1rem] font-semibold tracking-[-0.06em] text-[var(--ink)]">APEX</span>
  </Link>
);

const NAV = [
  { to: '/tools', label: 'Marketplace', id: 'nav-marketplace' },
  { to: '/demo', label: 'Sample businesses', id: 'nav-demo' },
  { to: '/compare', label: 'Compare', id: 'nav-compare' },
];

export function Header() {
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const isDark = resolvedTheme === 'dark';
  const linkCls = ({ isActive }) => `rounded-full px-3 py-2 text-[0.92rem] font-medium transition-all ${isActive ? 'bg-[var(--brand-soft)] text-[var(--brand)] shadow-[inset_0_0_0_1px_rgba(99,91,255,0.08)]' : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-warm)]'}`;
  const doLogout = async () => { await logout(); setOpen(false); nav('/'); };
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color:var(--header-bg)] backdrop-blur-xl">
      <div className="if-container flex h-20 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 rounded-full border border-[var(--line)] bg-[color:var(--surface)]/80 p-1 shadow-[0_8px_18px_-12px_rgba(15,23,42,0.18)] md:flex" aria-label="Main">
          {NAV.map((n) => <NavLink key={n.to} to={n.to} className={linkCls} data-testid={n.id}>{n.label}</NavLink>)}
          {user && <NavLink to="/dashboard" className={linkCls} data-testid="nav-dashboard">My results</NavLink>}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            className="if-btn-quiet"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            data-testid="theme-toggle"
          >
            {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
            <span className="hidden lg:inline">{isDark ? 'Light' : 'Dark'}</span>
          </button>
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
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            className="if-btn-quiet"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            data-testid="theme-toggle-mobile"
          >
            {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </button>
          <button type="button" className="if-btn-quiet" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu" data-testid="nav-mobile-toggle">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
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
