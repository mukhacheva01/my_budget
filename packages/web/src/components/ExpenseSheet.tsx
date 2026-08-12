import { useEffect, useState } from 'react';
import Sheet from './Sheet';
import AmountInput from './AmountInput';
import { api } from '../lib/api';
import { toKopecks } from '../lib/format';
import { haptic, mainButtonApi, notifyError, notifySuccess } from '../lib/telegram';
import type { Category } from '../types';
import type { Expense } from '../types';

function todayInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ExpenseSheet({
  open,
  onClose,
  categories,
  onSaved,
  expense,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onSaved: () => void;
  expense?: Expense;
}) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [spentAt, setSpentAt] = useState(todayInput());
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmount(expense ? String(expense.amount / 100) : '');
    setSpentAt(expense ? expense.spentAt.slice(0, 10) : todayInput());
    setComment(expense?.comment ?? '');
    setError(null);
    setCategoryId(expense?.categoryId ?? categories[0]?.id ?? '');
  }, [open, categories, expense]);

  const kopecks = toKopecks(amount);
  const valid = kopecks > 0 && !!categoryId;

  async function handleSave() {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        amount: kopecks,
        categoryId,
        spentAt: spentAt ? new Date(spentAt).toISOString() : undefined,
        comment: comment.trim() || undefined,
      };
      if (expense) {
        await api.patch(`/expenses/${expense.id}`, payload);
      } else {
        await api.post('/expenses', payload);
      }
      notifySuccess();
      haptic();
      onSaved();
      onClose();
    } catch (e) {
      notifyError();
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    if (valid && !saving) {
      mainButtonApi.show('Сохранить расход', handleSave);
    } else {
      mainButtonApi.hide();
    }
    return () => mainButtonApi.hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, valid, saving, amount, categoryId, spentAt, comment]);

  return (
    <Sheet open={open} onClose={onClose} title={expense ? 'Редактировать расход' : 'Добавить расход'}>
      <AmountInput big autoFocus value={amount} onChange={setAmount} />

      <p className="mt-4 mb-2 text-xs font-medium uppercase tracking-wide text-muted">Категория</p>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setCategoryId(c.id);
              haptic();
            }}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              categoryId === c.id ? 'bg-rosytaupe text-white' : 'bg-pagebg text-ink/70'
            }`}
          >
            <span>{c.emoji}</span>
            {c.name}
          </button>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-muted">Сначала добавьте категорию</p>
        )}
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Дата</p>
      <input
        type="date"
        value={spentAt}
        max={todayInput()}
        onChange={(e) => setSpentAt(e.target.value)}
        className="mb-4 w-full rounded-card bg-pagebg px-5 py-3.5 text-sm outline-none"
      />

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Комментарий</p>
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Необязательно"
        className="mb-2 w-full rounded-card bg-pagebg px-5 py-3.5 text-sm outline-none placeholder:text-muted/50"
      />

      {error && (
        <div className="mt-2 rounded-2xl bg-smokyrose/10 px-4 py-3 text-sm font-medium text-smokyrose">
          {error}
        </div>
      )}
    </Sheet>
  );
}
