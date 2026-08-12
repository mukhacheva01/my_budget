import { useMemo } from 'react';
import { useAppData } from '../lib/useAppData';
import MonthSwitcher from '../components/MonthSwitcher';
import { fmtMoney, shortMoneyKopecks } from '../lib/format';

export default function Analytics() {
  const { view } = useAppData();
  const data = useMemo(() => {
    if (!view) return [];
    return view.categories
      .filter((c) => c.limit > 0 || c.spent > 0)
      .sort((a, b) => b.spent - a.spent);
  }, [view]);

  if (!view) return null;

  const max = Math.max(1, ...data.map((d) => d.spent));
  const budgetUsedPct = view.income > 0 ? (view.spentTotal / view.income) * 100 : 0;
  const avgPerDay = view.daysLeft > 0 ? Math.floor(view.spentTotal / Math.max(1, 30 - view.daysLeft)) : 0;

  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <h1 className="mb-3 text-2xl font-bold">Аналитика</h1>
      <MonthSwitcher compact />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-card bg-white p-4 shadow-soft">
          <p className="text-xs text-muted">Потрачено</p>
          <p className="mt-1 text-xl font-bold">{fmtMoney(view.spentTotal)}</p>
        </div>
        <div className="rounded-card bg-white p-4 shadow-soft">
          <p className="text-xs text-muted">Накоплено (факт)</p>
          <p className="mt-1 text-xl font-bold text-smokyrose">{fmtMoney(view.savedToGoals)}</p>
        </div>
        <div className="rounded-card bg-white p-4 shadow-soft">
          <p className="text-xs text-muted">Израсходовано дохода</p>
          <p className="mt-1 text-xl font-bold">{budgetUsedPct.toFixed(0)}%</p>
        </div>
        <div className="rounded-card bg-white p-4 shadow-soft">
          <p className="text-xs text-muted">В среднем в день</p>
          <p className="mt-1 text-xl font-bold">{fmtMoney(avgPerDay)}</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="mt-5 rounded-card bg-white p-8 text-center shadow-soft">
          <p className="text-3xl">📊</p>
          <p className="mt-2 font-medium">Нет данных для анализа</p>
          <p className="mt-1 text-sm text-muted">Добавьте расходы, чтобы увидеть статистику</p>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {data.map((d) => (
            <div key={d.category.id} className="rounded-card bg-white p-4 shadow-soft">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium">
                  <span>{d.category.emoji}</span>
                  {d.category.name}
                </span>
                <span className="text-sm font-semibold">{fmtMoney(d.spent)}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink/5">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(d.spent / max) * 100}%`, background: d.category.color }}
                />
              </div>
              {d.limit > 0 ? (
                <p className="mt-1.5 text-xs text-muted">
                  {d.spent > d.limit
                    ? `Превышен лимит на ${fmtMoney(d.overrun)}`
                    : `Лимит ${shortMoneyKopecks(d.limit)}`}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-muted">Без лимита</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}