import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { startGoogleLogin } from '@/lib/auth';
import { usePageTitle } from '@/lib/hooks';

export default function Login() {
  usePageTitle('Sign in');
  return (
    <div className="if-container max-w-md py-16">
      <div className="if-card p-8">
        <h1 className="text-3xl font-extrabold">Sign in</h1>
        <p className="mt-2 text-[var(--ink-2)]">Save your results, keep a list of tools, and get setup guides made for you.</p>
        <button type="button" onClick={() => startGoogleLogin(sessionStorage.getItem('if_after_login') || '/dashboard')} className="if-btn-ghost mt-8 w-full min-h-14 text-base" data-testid="login-google-button">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z" /><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" /><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" /><path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" /></svg>
          Continue with Google
        </button>
        <p className="mt-6 flex gap-2 text-sm text-[var(--ink-3)]"><ShieldCheck className="h-4 w-4 shrink-0" />We only use your name and email. We never post anything or contact you unless you say so.</p>
        <p className="mt-4 text-sm">Just looking? <Link to="/demo" className="font-semibold text-[var(--brand)] hover:underline">Try a sample business</Link></p>
      </div>
    </div>
  );
}
