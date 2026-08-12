import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from './api';
import type { Category, Goal, MonthView } from '../types';

interface AppData {
  view: MonthView | null;
  categories: Category[];
  goals: Goal[];
  loading: boolean;
  error: string | null;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  setMonth: (month: number, year: number) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AppData>({
  view: null,
  categories: [],
  goals: [],
  loading: true,
  error: null,
  month: 1,
  year: 2026,
  isCurrentMonth: true,
  setMonth: () => {},
  prevMonth: () => {},
  nextMonth: () => {},
  refresh: async () => {},
});

function currentMonth() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

function shiftMonth(month: number, year: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<MonthView | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(() => currentMonth());
  const now = currentMonth();
  const isCurrentMonth = period.month === now.month && period.year === now.year;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [v, c, g] = await Promise.all([
        api.get<MonthView>('/budgets/current', { month: period.month, year: period.year }),
        api.get<Category[]>('/categories'),
        api.get<Goal[]>('/goals'),
      ]);
      setView(v);
      setCategories(c);
      setGoals(g);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [period.month, period.year]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setMonth = useCallback((month: number, year: number) => {
    setPeriod({ month, year });
  }, []);

  const prevMonth = useCallback(() => {
    setPeriod((p) => shiftMonth(p.month, p.year, -1));
  }, []);

  const nextMonth = useCallback(() => {
    setPeriod((p) => shiftMonth(p.month, p.year, 1));
  }, []);

  const value = useMemo(
    () => ({
      view,
      categories,
      goals,
      loading,
      error,
      month: period.month,
      year: period.year,
      isCurrentMonth,
      setMonth,
      prevMonth,
      nextMonth,
      refresh,
    }),
    [view, categories, goals, loading, error, period, isCurrentMonth, setMonth, prevMonth, nextMonth, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData() {
  return useContext(Ctx);
}