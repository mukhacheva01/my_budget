import { useMemo } from 'react';
import { useAppData } from '../lib/useAppData';
import MonthSwitcher from '../components/MonthSwitcher';
import { fmtMoney, shortMoneyKopecks } from '../lib/format';
import { downloadCsv } from '../lib/api';
import { haptic } from '../lib/telegram';
import { useToast } from '../components/Toast';

export default function Analytics() {
  const { view, month, year } = useAppData();
  const { toast } = useToast();

  const data = useMemo(() => {
    if (!view) return [];
    return view.categories
      .filter((c) => c.limit > 0 || c.spent > 0)
      .sort((a, b) => b.spent - a.spent);
  }, [view]);

  if (!view) return null;

  const max = Math.max(1, ...data.map((d) => d.spent));
  const totalSpent = view.spentTotal;
  const budgetUsedPct = view.income > 0 ? (totalSpent / view.income) * 100 : 0;
  const daysElapsed = Math.max(1, 30 - view.daysLeft);
  const avgPerDay = Math.floor(totalSpent / daysElapsed);
  const savingsRate = view.income > 0 ? Math.round((view.savedToGoals / view.income) * 100) : 0;

  // Pie chart segments
  const pieData = data.filter((d) => d.spent > 0);
  const pieTotal = pieData.reduce((s, d) => s + d.spent, 0);

  function handleExport() {
    haptic();
    downloadCsv(`/expenses/export.csv?month=${month}&year=${year}`)
      .then(() => toast('CSV \u0441\u043a\u0430\u0447\u0430\u043d', 'success'))
      .catch(() => toast('\u041e\u0448\u0438\u0431\u043a\u0430 \u044d\u043a\u0441\u043f\u043e\u0440\u0442\u0430', 'error'));
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-white">\u0410\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0430</h1>
        <button onClick={handleExport} className="rounded-full bg-palebg px-3 py-1.5 text-xs font-semibold text-rosytaupe dark:bg-zinc-700">
          \u042d\u043a\u0441\u043f\u043e\u0440\u0442 CSV
        </button>
      </div>
      <div className="mt-3">
        <MonthSwitcher compact />
      </div>

      {/* Summary cards */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <SummaryCard label="\u041f\u043e\u0442\u0440\u0430\u0447\u0435\u043d\u043e" value={fmtMoney(totalSpent)} />
        <SummaryCard label="\u041d\u0430\u043a\u043e\u043f\u043b\u0435\u043d\u043e" value={fmtMoney(view.savedToGoals)} color="text-smokyrose" />
        <SummaryCard label="\u0418\u0437\u0440\u0430\u0441\u0445\u043e\u0434\u043e\u0432\u0430\u043d\u043e" value={`${budgetUsedPct.toFixed(0)}%`} />
        <SummaryCard label="\u0421\u0440\u0435\u0434\u043d\u0435\u0435 \u0432 \u0434\u0435\u043d\u044c" value={fmtMoney(avgPerDay)} />
        <SummaryCard label="\u0414\u043e\u043b\u044f \u043d\u0430\u043a\u043e\u043f\u043b\u0435\u043d\u0438\u0439" value={`${savingsRate}%`} />
        <SummaryCard label="\u041e\u043f\u0435\u0440\u0430\u0446\u0438\u0439" value={String(data.reduce((s, d) => s + d.count, 0))} />
      </div>

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div className="mt-5 flex items-center justify-center">
          <PieChart segments={pieData.map((d) => ({ color: d.category.color, value: d.spent / pieTotal }))} />
        </div>
      )}

      {/* Category bars */}
      {data.length === 0 ? (
        <div className="mt-5 rounded-card bg-white p-8 text-center shadow-soft dark:bg-zinc-800">
          <p className="text-3xl">\ud83d\udcca</p>
          <p className="mt-2 font-medium dark:text-white">\u041d\u0435\u0442 \u0434\u0430\u043d\u043d\u044b\u0445 \u0434\u043b\u044f \u0430\u043d\u0430\u043b\u0438\u0437\u0430</p>
          <p className="mt-1 text-sm text-muted">\u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u0440\u0430\u0441\u0445\u043e\u0434\u044b</p>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {data.map((d) => {
            const pct = pieTotal > 0 ? Math.round((d.spent / pieTotal) * 100) : 0;
            return (
              <div key={d.category.id} className="rounded-card bg-white p-4 shadow-soft dark:bg-zinc-800">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium dark:text-white">
                    <span>{d.category.emoji}</span>
                    {d.category.name}
                    <span className="text-xs text-muted">{pct}%</span>
                  </span>
                  <span className="text-sm font-semibold dark:text-white">{fmtMoney(d.spent)}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink/5 dark:bg-zinc-700">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(d.spent / max) * 100}%`, background: d.category.color }}
                  />
                </div>
                {d.limit > 0 ? (
                  <p className="mt-1.5 text-xs text-muted">
                    {d.spent > d.limit
                      ? `\u041f\u0440\u0435\u0432\u044b\u0448\u0435\u043d \u043b\u0438\u043c\u0438\u0442 \u043d\u0430 ${fmtMoney(d.overrun)}`
                      : `\u041b\u0438\u043c\u0438\u0442 ${shortMoneyKopecks(d.limit)} \u00b7 \u043e\u0441\u0442\u0430\u043b\u043e\u0441\u044c ${fmtMoney(d.remaining)}`}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-muted">\u0411\u0435\u0437 \u043b\u0438\u043c\u0438\u0442\u0430</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-card bg-white p-4 shadow-soft dark:bg-zinc-800">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color ?? 'dark:text-white'}`}>{value}</p>
    </div>
  );
}

function PieChart({ segments }: { segments: { color: string; value: number }[] }) {
  let cumulativePercent = 0;
  const size = 140;
  const paths = segments.map((seg) => {
    const startAngle = cumulativePercent * 360;
    cumulativePercent += seg.value;
    const endAngle = cumulativePercent * 360;
    const x1 = 50 + 40 * Math.cos((Math.PI * (startAngle - 90)) / 180);
    const y1 = 50 + 40 * Math.sin((Math.PI * (startAngle - 90)) / 180);
    const x2 = 50 + 40 * Math.cos((Math.PI * (endAngle - 90)) / 180);
    const y2 = 50 + 40 * Math.sin((Math.PI * (endAngle - 90)) / 180);
    const largeArc = seg.value > 0.5 ? 1 : 0;
    return (
      <path
        key={`${seg.color}-${startAngle}`}
        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={seg.color}
      />
    );
  });
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-sm">
      {paths}
      <circle cx="50" cy="50" r="22" className="fill-white dark:fill-zinc-800" />
    </svg>
  );
}
