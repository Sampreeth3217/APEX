import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, registerNavigate } from '@/lib/auth';
import { Header, Footer } from '@/components/layout/Shell';
import { ChatWidget, ChatPersonaProvider } from '@/components/chat/ChatWidget';
import Landing from '@/pages/Landing';
import Start from '@/pages/Start';
import Login from '@/pages/Login';
import AuthContinue from '@/pages/AuthContinue';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import { DemoIndex, DemoPersona } from '@/pages/Demo';
import Tools from '@/pages/Tools';
import ToolDetail from '@/pages/ToolDetail';
import Compare from '@/pages/Compare';
import Guide from '@/pages/Guide';
import { Me, Settings } from '@/pages/Me';
import ProviderNew from '@/pages/ProviderNew';
import { Admin, AdminLlm } from '@/pages/Admin';
import { Legal, NotFound } from '@/pages/Legal';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppRouter() {
  const nav = useNavigate();
  useEffect(() => { registerNavigate(nav); }, [nav]);
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/start" element={<Start />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/continue" element={<AuthContinue />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/demo" element={<DemoIndex />} />
      <Route path="/demo/:slug" element={<DemoPersona />} />
      <Route path="/tools" element={<Tools />} />
      <Route path="/tools/:slug" element={<ToolDetail />} />
      <Route path="/compare" element={<Compare />} />
      <Route path="/guide/:slug" element={<Guide />} />
      <Route path="/me" element={<Me />} />
      <Route path="/me/settings" element={<Settings />} />
      <Route path="/providers/new" element={<ProviderNew />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/llm" element={<AdminLlm />} />
      <Route path="/privacy" element={<Legal page="privacy" />} />
      <Route path="/terms" element={<Legal page="terms" />} />
      <Route path="/contact" element={<Legal page="contact" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatPersonaProvider>
          <ScrollTop />
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main id="main" className="flex-1"><AppRouter /></main>
            <Footer />
          </div>
          <ChatWidget />
          <Toaster position="top-center" richColors />
        </ChatPersonaProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
