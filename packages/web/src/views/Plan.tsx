import { useEffect, useMemo, useState } from 'react';
import { useAppData } from '../lib/useAppData';
import { api } from '../lib/api';
import Sheet from '../components/Sheet';
import MonthSwitcher from '../components/MonthSwitcher';
import AmountInput from '../components/AmountInput';
import { kopecksToInput, toKopecks, fmtMoney } from '../lib/format';
import { haptic, mainButtonApi, notifyError, notifySuccess } from '../lib/telegram';

const EMOJIS = ['🍂', '🛒', '🍜', '🚇', '🎬', '💊', '🏠', '🛍️', '🎁', '✈️', '💼', '📚', '🍺', '🧸', '🐾', '💇', '☕', '⚡'];
const COLORS = ['#CEDFD9', '#B09398', '#9B6A6C', '#5F5449', '#EBFCFB', '#D9A441'];

export default function Plan() {
  const { view, categories, goals, loading, error, refresh, isCurrentMonth, month, year } =
    useAppData();
  const [income, setIncome] = useState('');
  const [limits, setLimits] = useState<Record<string, string>>({});
  const [goalAmounts, setGoalAmounts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!view) return;
    setIncome(view.income ? kopecksToInput(view.income) : '');
    const lim: Record<string, string> = {};
    view.categories.forEach((c) => (lim[c.category.id] = kopecksToInput(c.limit)));
    setLimits(lim);
    const map: Record<string, string> = {};
    view.goals.forEach((g) => (map[g.goal.id] = kopecksToInput(g.amount)));
    setGoalAmounts(map);
  }, [view]);

  const incomeK = toKopecks(income);
  const distributed = useMemo(
    () =>
      categories
        .filter((c) => (limits[c.id] ?? '').trim() !== '')
        .reduce((acc, c) => acc + toKopecks(limits[c.id]), 0),
    [categories, limits],
  );
  const plannedGoals = useMemo(
    () =>
      goals
        .filter((g) => g.status === 'active')
        .reduce((acc, g) => acc + toKopecks(goalAmounts[g.id]), 0),
    [goals, goalAmounts],
  );
  const unallocated = incomeK - distributed - plannedGoals;
  const exceed = unallocated < 0;

  async function handleSave() {
    if (incomeK <= 0 || exceed || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.post('/budgets/current', {
        month,
        year,
        income: incomeK,
        categories: categories
          .filter((c) => toKopecks(limits[c.id]) > 0)
          .map((c) => ({ categoryId: c.id, limit: toKopecks(limits[c.id]) })),
        goals: goals
          .filter((g) => g.status === 'active' && toKopecks(goalAmounts[g.id]) > 0)
          .map((g) => ({ goalId: g.id, amount: toKopecks(goalAmounts[g.id]) })),
      });
      notifySuccess();
      haptic();
      await refresh();
      setMessage('План сохранён');
    } catch (e) {
      notifyError();
      setMessage(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    setMessage(null);
    try {
      const prev = new Date(year, month - 2, 1);
      await api.post('/budgets/copy', {
        month,
        year,
        sourceMonth: prev.getMonth() + 1,
        sourceYear: prev.getFullYear(),
      });
      notifySuccess();
      await refresh();
      setMessage('План скопирован из прошлого месяца');
    } catch (e) {
      notifyError();
      setMessage(e instanceof Error ? e.message : 'Не удалось скопировать');
    }
  }

  useEffect(() => {
    if (incomeK > 0 && !exceed && !saving && view) {
      mainButtonApi.show('Сохранить план', handleSave);
    } else {
      mainButtonApi.hide();
    }
    return () => mainButtonApi.hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomeK, exceed, saving, view, distributed, plannedGoals, income, limits, goalAmounts]);

  if (loading && !view) return <PlanSkeleton />;
  if (error && !view) return <PlanError onRetry={() => refresh()} />;
  if (!view) return null;

  const activeGoals = goals.filter((g) => g.status === 'active');

  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <h1 className="mb-3 text-2xl font-bold">Планирование</h1>
      <MonthSwitcher compact />

      {!isCurrentMonth && (
        <div className="mt-3 rounded-2xl bg-smokyrose/10 px-4 py-2.5 text-xs font-medium text-smokyrose">
          Вы планируете {view.month > new Date().getMonth() + 1 ? 'будущий' : 'прошлый'} месяц.
          Изменения в прошлом не повлияют на текущий бюджет.
        </div>
      )}

      {message && (
        <div className="mt-3 rounded-2xl bg-palemist px-4 py-2.5 text-sm font-medium text-ink">
          {message}
        </div>
      )}

      {!view.budget && (
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-soft">
          <p className="text-sm text-muted">Взять за основу прошлый месяц</p>
          <button
            onClick={handleCopy}
            className="rounded-full bg-rosytaupe px-4 py-1.5 text-sm font-semibold text-white"
          >
            Скопировать
          </button>
        </div>
      )}

      <section className="mt-4 rounded-card bg-white p-5 shadow-card">
        <p className="text-xs font-medium text-muted">Доход в этом месяце</p>
        <AmountInput big value={income} onChange={setIncome} />
      </section>

      {activeGoals.length > 0 && (
        <section className="mt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Запланировать на цели
          </p>
          <div className="flex flex-col gap-2">
            {activeGoals.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-3 rounded-card bg-white px-4 py-3 shadow-soft"
              >
                <span className="text-2xl">{g.emoji}</span>
                <span className="flex-1 font-medium">{g.name}</span>
                <AmountInput value={goalAmounts[g.id] ?? ''} onChange={(v) => setGoalAmounts((p) => ({ ...p, [g.id]: v }))} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Категории</p>
          <button
            onClick={() => {
              haptic();
              setAddOpen(true);
            }}
            className="rounded-full bg-rosytaupe/15 px-3 py-1 text-xs font-semibold text-rosytaupe"
          >
            + добавить
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-card bg-white px-4 py-3 shadow-soft"
            >
              <span className="text-2xl">{c.emoji}</span>
              <p className="flex-1 font-medium">{c.name}</p>
              <AmountInput value={limits[c.id] ?? ''} onChange={(v) => setLimits((p) => ({ ...p, [c.id]: v }))} />
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-muted">Нет категорий — добавьте первую</p>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-card bg-white p-5 shadow-card">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Доход</span>
          <span className="font-semibold">{fmtMoney(incomeK)}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-muted">Распределено</span>
          <span className="font-semibold">{fmtMoney(distributed + plannedGoals)}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-muted">Нераспределено</span>
          <span className={`font-bold ${exceed ? 'text-smokyrose' : 'text-success'}`}>
            {fmtMoney(Math.max(0, unallocated))}
          </span>
        </div>
        {exceed && (
          <div className="mt-3 rounded-2xl bg-smokyrose/10 px-4 py-2.5 text-sm font-medium text-smokyrose">
            Превышение: {fmtMoney(Math.abs(unallocated))}. Распределено больше дохода.
          </div>
        )}
      </section>

      <AddCategorySheet open={addOpen} onClose={() => setAddOpen(false)} onAdded={() => refresh()} />
    </div>
  );
}

function PlanSkeleton() {
  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <div className="h-6 w-40 animate-pulse rounded bg-ink/10" />
      <div className="mt-4 h-24 animate-pulse rounded-card bg-ink/10" />
      <div className="mt-3 h-16 animate-pulse rounded-card bg-ink/10" />
    </div>
  );
}

function PlanError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 pt-20 text-center">
      <p className="text-4xl">😕</p>
      <p className="mt-3 font-semibold">Не получилось загрузить план</p>
      <button onClick={onRetry} className="mt-4 rounded-full bg-rosytaupe px-6 py-2.5 font-semibold text-white">
        Повторить
      </button>
    </div>
  );
}

function AddCategorySheet({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.post('/categories', { name: name.trim(), emoji, color });
      notifySuccess();
      haptic();
      setName('');
      onAdded();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Новая категория">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Название, например «Кофе»"
        className="mb-4 w-full rounded-card bg-pagebg px-5 py-3.5 text-sm outline-none placeholder:text-muted/50"
      />
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Эмодзи</p>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            className={`shrink-0 rounded-full px-3 py-2 text-xl ${emoji === e ? 'bg-rosytaupe' : 'bg-pagebg'}`}
          >
            {e}
          </button>
        ))}
      </div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Цвет</p>
      <div className="mb-4 flex gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`h-8 w-8 rounded-full border-2 ${color === c ? 'border-ink' : 'border-transparent'}`}
            style={{ background: c }}
          />
        ))}
      </div>
      {error && (
        <div className="mb-3 rounded-2xl bg-smokyrose/10 px-4 py-2.5 text-sm text-smokyrose">{error}</div>
      )}
      <button
        onClick={handleAdd}
        disabled={!name.trim()}
        className="w-full rounded-card bg-rosytaupe py-3.5 font-semibold text-white disabled:opacity-40"
      >
        Добавить
      </button>
    </Sheet>
  );
}