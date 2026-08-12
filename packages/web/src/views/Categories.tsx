import { useState } from 'react';
import { useAppData } from '../lib/useAppData';
import { api } from '../lib/api';
import ProgressBar from '../components/ProgressBar';
import MonthSwitcher from '../components/MonthSwitcher';
import ConfirmSheet from '../components/ConfirmSheet';
import { fmtMoney, monthName } from '../lib/format';
import { haptic } from '../lib/telegram';
import type { Tab } from '../components/BottomNav';

export default function Categories({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const { view, refresh, month, year, isCurrentMonth } = useAppData();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!view) return null;
  const withLimit = view.categories.filter((c) => c.limit > 0);
  const withoutLimit = view.categories.filter((c) => c.limit === 0);

  async function archive(id: string) {
    if (busy) return;
    setBusy(true);
    await api.del(`/categories/${id}`);
    haptic();
    setConfirmId(null);
    await refresh();
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <h1 className="mb-3 text-2xl font-bold">Категории</h1>
      <MonthSwitcher compact />
      <p className="mt-2 text-sm text-muted">
        {monthName(month)} {year} · до конца месяца {view.daysLeft} дн.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {withLimit.map((item) => {
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
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{item.category.emoji}</span>
                  <div>
                    <p className="font-semibold">{item.category.name}</p>
                    <p className="text-xs text-muted">{item.count} опер.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('plan')}
                    className="rounded-full bg-pagebg px-3 py-1 text-xs font-medium text-muted"
                  >
                    ✎ лимит
                  </button>
                  {isCurrentMonth && (
                    <button
                      onClick={() => setConfirmId(item.category.id)}
                      className="text-sm text-muted"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
              <ProgressBar value={ratio} color={statusColor} />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted">
                  {fmtMoney(item.spent)} / {fmtMoney(item.limit)}
                </p>
                <p className="text-sm font-bold" style={{ color: statusColor }}>
                  осталось {fmtMoney(item.remaining)}
                </p>
              </div>
              {item.overrun > 0 && (
                <p className="mt-1.5 text-xs font-semibold text-smokyrose">
                  Лимит превышен на {fmtMoney(item.overrun)}
                </p>
              )}
            </div>
          );
        })}

        {withoutLimit.map((item) => (
          <div
            key={item.category.id}
            className="flex items-center justify-between rounded-card bg-white p-4 shadow-soft"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{item.category.emoji}</span>
              <div>
                <p className="font-semibold">{item.category.name}</p>
                <p className="text-xs text-muted">
                  {item.spent > 0 ? `Потрачено ${fmtMoney(item.spent)}` : 'Бюджет не установлен'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('plan')}
                className="rounded-full bg-pagebg px-3 py-1 text-xs font-medium text-muted"
              >
                задать
              </button>
              {isCurrentMonth && (
                <button onClick={() => setConfirmId(item.category.id)} className="text-sm text-muted">
                  🗑
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmSheet
        open={!!confirmId}
        title="Архивировать категорию?"
        text="Категория скроется из новых расчётов, но истории прошлых расходов сохранятся."
        confirmLabel="Архивировать"
        busy={busy}
        onConfirm={() => confirmId && archive(confirmId)}
        onClose={() => setConfirmId(null)}
      />
    </div>
  );
}