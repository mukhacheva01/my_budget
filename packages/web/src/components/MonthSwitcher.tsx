import { useAppData } from '../lib/useAppData';
import { monthName } from '../lib/format';
import { haptic } from '../lib/telegram';

export default function MonthSwitcher({ compact = false }: { compact?: boolean }) {
  const { month, year, prevMonth, nextMonth, isCurrentMonth } = useAppData();

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => {
          haptic();
          prevMonth();
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink shadow-soft active:scale-95"
        aria-label="Предыдущий месяц"
      >
        ‹
      </button>
      <div className="text-center">
        <p className={`font-bold ${compact ? 'text-base' : 'text-2xl'}`}>
          {monthName(month)} {year}
        </p>
        {!isCurrentMonth && (
          <p className="mt-0.5 text-[11px] font-medium text-smokyrose">
            {month > new Date().getMonth() + 1 || year > new Date().getFullYear()
              ? 'будущий месяц'
              : 'прошлый месяц'}
          </p>
        )}
      </div>
      <button
        onClick={() => {
          haptic();
          nextMonth();
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink shadow-soft active:scale-95"
        aria-label="Следующий месяц"
      >
        ›
      </button>
    </div>
  );
}