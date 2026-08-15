import { useEffect, useState } from 'react';
import BottomNav, { type Tab } from './components/BottomNav';
import { AppDataProvider } from './lib/useAppData';
import { ToastProvider } from './components/Toast';
import { initSession } from './lib/api';
import { backButtonApi } from './lib/telegram';
import Home from './views/Home';
import Plan from './views/Plan';
import Categories from './views/Categories';
import Goals from './views/Goals';
import Stats from './views/Stats';
import Analytics from './views/Analytics';
import Settings from './views/Settings';

type SessionState = 'loading' | 'ready' | 'error';

export default function App() {
  const [tab, setTab] = useState<Tab>(() => {
    const params = new URLSearchParams(window.location.search);
    const start = params.get('startapp') || params.get('tgWebAppStartParam');
    if (start === 'expense' || start === 'stats') return 'stats';
    if (start === 'plan') return 'plan';
    if (start === 'goals') return 'goals';
    return 'home';
  });
  const [session, setSession] = useState<SessionState>('loading');

  const startSession = () => {
    setSession('loading');
    initSession()
      .then(() => setSession('ready'))
      .catch(() => setSession('error'));
  };

  useEffect(() => {
    startSession();
  }, []);

  useEffect(() => {
    if (session !== 'ready') return;
    if (tab === 'home') {
      backButtonApi.hide();
    } else {
      backButtonApi.show(() => setTab('home'));
    }
    return () => backButtonApi.hide();
  }, [session, tab]);

  if (session === 'loading') return <LoadingScreen />;
  if (session === 'error') return <ErrorScreen onRetry={startSession} />;

  return (
    <ToastProvider>
    <AppDataProvider>
      <div className="min-h-screen bg-pagebg pb-24">
        {tab === 'home' && <Home onNavigate={setTab} />}
        {tab === 'plan' && <Plan />}
        {tab === 'categories' && <Categories onNavigate={setTab} />}
        {tab === 'goals' && <Goals />}
        {tab === 'stats' && <Stats />}
        {tab === 'analytics' && <Analytics />}
        {tab === 'settings' && <Settings />}
        <BottomNav tab={tab} onChange={setTab} />
      </div>
    </AppDataProvider>
    </ToastProvider>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-pagebg">
      <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-[24px] bg-rosytaupe text-3xl text-white">
        🍂
      </div>
      <p className="mt-4 font-medium text-muted">Budget App</p>
    </div>
  );
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-pagebg px-8">
      <p className="text-5xl">📡</p>
      <p className="mt-4 text-center text-lg font-semibold">Не удалось подключиться</p>
      <p className="mt-1 text-center text-sm text-muted">
        Проверьте интернет или повторите попытку. Откройте приложение из Telegram.
      </p>
      <button
        onClick={onRetry}
        className="mt-6 rounded-full bg-rosytaupe px-8 py-3 font-semibold text-white shadow-card"
      >
        Повторить
      </button>
    </div>
  );
}