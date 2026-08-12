import { useEffect, useState } from 'react';
import { useAppData } from '../lib/useAppData';
import { api } from '../lib/api';
import ExpenseSheet from '../components/ExpenseSheet';
import ProgressBar from '../components/ProgressBar';
import MonthSwitcher from '../components/MonthSwitcher';
import { fmtDay, fmtMoney } from '../lib/format';
import { haptic } from '../lib/telegram';
import type { Expense, User } from '../types';
import type { Tab } from '../components/BottomNav';

export default function Home({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const { view, categories, goals, loading, error, refresh } = useAppData();
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    api
      .get<User>('/users/me')
      .then(setUser)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!view) return;
    api
      .get<Expense[]>('/expenses', { month: view.month, year: view.year })
      .then(setExpenses)
      .catch(() => {});
  }, [view]);

  if (loading && !view) return <HomeSkeleton />;
  if (error) return <HomeError onRetry={() => refresh()} />;
  if (!view) return null;

  const mainGoal =
    goals.find((g) => g.status === 'active' && g.savedAmount < g.targetAmount) ?? goals[0];
  const activeBudgetCategories = view.categories.filter((c) => c.limit > 0);
  const topCategories = [...activeBudgetCategories]
    .sort((a, b) => b.spent / Math.max(b.limit, 1) - a.spent / Math.max(a.limit, 1))
    .slice(0, 4);
  const perDay = view.daysLeft > 0 ? Math.floor(view.availableToSpend / view.daysLeft) : 0;

  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Привет, {user?.firstName ?? 'друг'} 👋</p>
        </div>
        <button onClick={() => onNavigate('settings')} className="text-xl">
          ⚙️
        </button>
      </header>

      <div className="mt-3">
        <MonthSwitcher />
      </div>

      {mainGoal && mainGoal.status === 'active' && (
        <button
          onClick={() => onNavigate('goals')}
          className="relative mt-4 flex w-full items-center gap-4 overflow-hidden rounded-card bg-stonebrown px-5 py-5 text-white shadow-card"
        >
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-12 right-16 h-24 w-24 rounded-full bg-white/5" />
          <span className="text-3xl">{mainGoal.emoji}</span>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-xs text-white/70">Моя цель</p>
            <p className="truncate font-semibold">{mainGoal.name}</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white"
                style={{
                  width: `${Math.min(100, (mainGoal.savedAmount / Math.max(mainGoal.targetAmount, 1)) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-1.5 text-xs text-white/80">
              {fmtMoney(mainGoal.savedAmount)} из {fmtMoney(mainGoal.targetAmount)}
            </p>
          </div>
        </button>
      )}

      <section
        className={`relative mt-4 overflow-hidden rounded-card p-5 text-white shadow-card ${
          view.availableToSpend < 0 ? 'bg-smokyrose' : 'bg-rosytaupe'
        }`}
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/15" />
        <div className="pointer-events-none absolute -bottom-14 right-24 h-32 w-32 rounded-full bg-white/10" />
        <p className="text-sm font-medium text-white/85">Доступно до конца месяца</p>
        <p className="mt-1 text-4xl font-bold">{fmtMoney(view.availableToSpend)}</p>
        <p className="mt-1 text-sm text-white/85">
          {view.daysLeft > 0 ? `≈ ${fmtMoney(perDay)} в день` : 'месяц заканчивается'} · осталось {view.daysLeft} дн.
        </p>
      </section>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniCard label="Доход" value={fmtMoney(view.income)} />
        <MiniCard label="Потрачено" value={fmtMoney(view.spentTotal)} />
        <MiniCard label="Распределено" value={fmtMoney(view.distributed)} />
      </div>

      {!view.budget ? (
        <button
          onClick={() => onNavigate('plan')}
          className="mt-4 w-full rounded-card bg-rosytaupe px-6 py-5 text-left text-white shadow-card"
        >
          <p className="text-lg font-bold">Спланировать бюджет</p>
          <p className="mt-1 text-sm text-white/85">Распределите доход по категориям и мечте</p>
        </button>
      ) : (
        <>
          <button
            onClick={() => onNavigate('plan')}
            className="mt-4 w-full rounded-card bg-rosytaupe px-6 py-4 text-left text-white shadow-card transition-transform active:scale-[0.98]"
          >
            <p className="font-semibold">Планирование бюджета</p>
            <p className="mt-0.5 text-sm text-white/85">
              {view.unallocated > 0
                ? `Нераспределено: ${fmtMoney(view.unallocated)}`
                : 'Доход распределён полностью'}
            </p>
          </button>
          {view.unallocated > 0 && (
            <div className="mt-3 rounded-card bg-palemist px-5 py-4 shadow-soft">
              <p className="text-sm font-semibold text-ink">Не распределено</p>
              <p className="mt-1 text-2xl font-bold text-ink">{fmtMoney(view.unallocated)}</p>
              <button
                onClick={() => onNavigate('plan')}
                className="mt-2 text-sm font-semibold text-rosytaupe"
              >
                Распределить →
              </button>
            </div>
          )}
        </>
      )}

      {topCategories.length > 0 && (
        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Категории</h2>
            <button onClick={() => onNavigate('categories')} className="text-sm text-rosytaupe">
              Все
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {topCategories.map((item) => {
              const ratio = item.spent / Math.max(item.limit, 1);
              const statusColor =
                item.spent > item.limit
                  ? '#9B6A6C'
                  : item.remaining < item.limit * 0.3
                  ? '#D9A441'
                  : '#4DBA83';
              return (
                <div key={item.category.id} className="rounded-card bg-white p-4 shadow-soft">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.category.emoji}</span>
                      <span className="font-medium">{item.category.name}</span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: statusColor }}>
                      {fmtMoney(item.remaining)}
                    </span>
                  </div>
                  <ProgressBar value={ratio} color={statusColor} />
                  <p className="mt-1.5 text-xs text-muted">
                    {fmtMoney(item.spent)} из {fmtMoney(item.limit)} · {item.count} опер.
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {expenses.length > 0 && (
        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Последние расходы</h2>
            <button onClick={() => onNavigate('stats')} className="text-sm text-rosytaupe">
              Все
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {expenses.slice(0, 4).map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                  style={{ background: `${e.category?.color ?? '#B09398'}22` }}
                >
                  {e.category?.emoji ?? '🤔'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{e.comment || e.category?.name}</p>
                  <p className="text-xs text-muted">{fmtDay(e.spentAt)}</p>
                </div>
                <p className="font-semibold">−{fmtMoney(e.amount)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <button
        onClick={() => {
          haptic();
          setSheetOpen(true);
        }}
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-rosytaupe text-3xl text-white shadow-card"
        aria-label="Добавить расход"
      >
        +
      </button>

      <ExpenseSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        categories={categories}
        onSaved={() => refresh()}
      />
    </div>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3 shadow-soft">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-bold">{value}</p>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <div className="h-5 w-32 animate-pulse rounded bg-ink/10" />
      <div className="mt-4 h-24 animate-pulse rounded-card bg-ink/10" />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-ink/10" />
        ))}
      </div>
      <div className="mt-4 h-20 animate-pulse rounded-card bg-ink/10" />
    </div>
  );
}

function HomeError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 pt-20 text-center">
      <p className="text-4xl">😕</p>
      <p className="mt-3 font-semibold">Не получилось загрузить данные</p>
      <button
        onClick={onRetry}
        className="mt-4 rounded-full bg-rosytaupe px-6 py-2.5 font-semibold text-white"
      >
        Повторить
      </button>
    </div>
  );
}