export type Tab =
  | 'home'
  | 'plan'
  | 'categories'
  | 'goals'
  | 'stats'
  | 'analytics'
  | 'settings';

const ICONS: Record<Tab, string> = {
  home: '🏠',
  plan: '🧮',
  categories: '🗂️',
  goals: '🎯',
  stats: '📊',
  analytics: '📈',
  settings: '⚙️',
};

const LABELS: Record<Tab, string> = {
  home: 'Главная',
  plan: 'Бюджет',
  categories: 'Категории',
  goals: 'Цели',
  stats: 'Расходы',
  analytics: 'Аналитика',
  settings: 'Настройки',
};

export default function BottomNav({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur border-t border-ink/5">
      <div className="mx-auto max-w-md grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {(['home', 'stats', 'goals', 'analytics', 'settings'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={`flex flex-col items-center gap-1 py-2.5 transition-colors ${
              tab === t ? 'text-rosytaupe' : 'text-muted'
            }`}
          >
            <span className="text-xl leading-none">{ICONS[t]}</span>
            <span className="text-[10px] font-medium">{LABELS[t]}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}