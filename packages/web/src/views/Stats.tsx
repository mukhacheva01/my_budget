import { useEffect, useMemo, useState } from 'react';
import { useAppData } from '../lib/useAppData';
import { api } from '../lib/api';
import MonthSwitcher from '../components/MonthSwitcher';
import ConfirmSheet from '../components/ConfirmSheet';
import { fmtDay, fmtMoney } from '../lib/format';
import { haptic, notifySuccess } from '../lib/telegram';
import type { Expense } from '../types';

export default function Stats() {
  const { view, refresh } = useAppData();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<Expense | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!view) return;
    const data = await api.get<Expense[]>('/expenses', { month: view.month, year: view.year });
    setExpenses(data);
  }

  useEffect(() => {
    load().catch(() => {});
  }, [view]);

  const filters = useMemo(() => {
    const map = new Map<string, string>();
    expenses.forEach((e) => {
      if (e.category) map.set(e.category.id, `${e.category.emoji} ${e.category.name}`);
    });
    return Array.from(map.entries());
  }, [expenses]);

  const visible = filter === 'all' ? expenses : expenses.filter((e) => e.categoryId === filter);
  const total = visible.reduce((a, e) => a + e.amount, 0);

  const groups = useMemo(() => {
    const map = new Map<string, Expense[]>();
    visible.forEach((e) => {
      const key = fmtDay(e.spentAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries());
  }, [visible]);

  async function remove(id: string) {
    if (busy) return;
    setBusy(true);
    const item = expenses.find((e) => e.id === id);
    await api.del(`/expenses/${id}`);
    haptic();
    setConfirmId(null);
    setDeleted(item ?? null);
    await refresh();
    setBusy(false);
  }

  async function undoDelete() {
    if (!deleted) return;
    setBusy(true);
    await api.post('/expenses', {
      amount: deleted.amount,
      categoryId: deleted.categoryId,
      comment: deleted.comment ?? undefined,
      spentAt: new Date(deleted.spentAt).toISOString(),
    });
    notifySuccess();
    setDeleted(null);
    await refresh();
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <h1 className="mb-3 text-2xl font-bold">Расходы</h1>
      <MonthSwitcher compact />
      <div className="mt-3 rounded-card bg-white p-5 shadow-card">
        <p className="text-xs text-muted">Потрачено за период</p>
        <p className="mt-1 text-3xl font-bold">{fmtMoney(total)}</p>
      </div>

      {filters.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${
              filter === 'all' ? 'bg-rosytaupe text-white' : 'bg-white text-ink/70 shadow-soft'
            }`}
          >
            Все
          </button>
          {filters.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${
                filter === id ? 'bg-rosytaupe text-white' : 'bg-white text-ink/70 shadow-soft'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-4">
        {groups.length === 0 && (
          <div className="rounded-card bg-white p-8 text-center shadow-soft">
            <p className="text-3xl">🌤</p>
            <p className="mt-2 font-medium">Расходов за период нет</p>
            <p className="mt-1 text-sm text-muted">Добавьте трату — и она появится здесь</p>
          </div>
        )}
        {groups.map(([day, items]) => (
          <section key={day}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{day}</p>
            <div className="flex flex-col gap-2">
              {items.map((e) => (
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
                    <p className="text-xs text-muted">
                      {new Date(e.spentAt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <p className="font-semibold">−{fmtMoney(e.amount)}</p>
                  <button onClick={() => setConfirmId(e.id)} className="text-sm text-muted">
                    🗑
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <ConfirmSheet
        open={!!confirmId}
        title="Удалить расход?"
        text="Запись будет удалена, и остатки по категориям и месяцу пересчитаются."
        busy={busy}
        onConfirm={() => confirmId && remove(confirmId)}
        onClose={() => setConfirmId(null)}
      />

      {deleted && (
        <div className="fixed inset-x-0 bottom-20 z-40 mx-auto flex max-w-md items-center justify-between px-5">
          <div className="flex items-center gap-3 rounded-full bg-ink px-5 py-3 text-white shadow-card">
            <span className="text-sm">Расход удалён</span>
            <button onClick={undoDelete} disabled={busy} className="font-semibold text-rosytaupe">
              Отменить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}