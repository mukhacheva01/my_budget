import { useEffect, useState } from 'react';
import { useAppData } from '../lib/useAppData';
import { api } from '../lib/api';
import ProgressBar from '../components/ProgressBar';
import Sheet from '../components/Sheet';
import ConfirmSheet from '../components/ConfirmSheet';
import AmountInput from '../components/AmountInput';
import { fmtDate, fmtMoney, toKopecks } from '../lib/format';
import { haptic, notifyError, notifySuccess } from '../lib/telegram';
import type { Goal } from '../types';

const EMOJIS = ['🎯', '✈️', '🏠', '🚗', '💻', '📱', '🎓', '💍', '🎁', '🏖️'];
const COLORS = ['#9B6A6C', '#B09398', '#CEDFD9', '#5F5449', '#4DBA83'];

export default function Goals() {
  const { goals, refresh } = useAppData();
  const [createOpen, setCreateOpen] = useState(false);
  const [contribGoal, setContribGoal] = useState<Goal | null>(null);
  const [amount, setAmount] = useState('');
  const [contributeDate, setContributeDate] = useState('');
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [archiveGoal, setArchiveGoal] = useState<Goal | null>(null);
  const [busy, setBusy] = useState(false);

  const active = goals.filter((g) => g.status === 'active');
  const completed = goals.filter((g) => g.status === 'completed');

  async function contribute(goalId: string) {
    const kopecks = toKopecks(amount);
    if (!kopecks || busy) return;
    setBusy(true);
    try {
      await api.post(`/goals/${goalId}/contribute`, {
        amount: kopecks,
        ...(contributeDate ? { date: new Date(contributeDate).toISOString() } : {}),
      });
      notifySuccess();
      haptic();
      setContribGoal(null);
      setAmount('');
      setContributeDate('');
      await refresh();
    } catch (e) {
      notifyError();
    } finally {
      setBusy(false);
    }
  }

  async function archive(id: string) {
    if (busy) return;
    setBusy(true);
    await api.del(`/goals/${id}`);
    haptic();
    setArchiveGoal(null);
    await refresh();
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Цели</h1>
        <button
          onClick={() => {
            haptic();
            setCreateOpen(true);
          }}
          className="rounded-full bg-rosytaupe px-4 py-2 text-sm font-semibold text-white"
        >
          + цель
        </button>
      </div>

      {active.length === 0 && (
        <div className="mt-6 rounded-card bg-white p-8 text-center shadow-soft">
          <p className="text-4xl">🌱</p>
          <p className="mt-2 font-medium">Пока нет активных целей</p>
          <p className="mt-1 text-sm text-muted">
            Например, «Поездка в Сочи ✈️» — копите по чуть-чуть каждый месяц
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {active.map((g) => {
          const ratio = g.savedAmount / Math.max(g.targetAmount, 1);
          const remainingToSave = Math.max(0, g.targetAmount - g.savedAmount);
          return (
            <div
              key={g.id}
              className="rounded-card p-5 text-white shadow-card"
              style={{ background: g.color }}
            >
              <div className="mb-3 flex items-center gap-3">
                {g.imageUrl ? (
                  <img src={g.imageUrl} alt="" className="h-12 w-12 rounded-2xl object-cover" />
                ) : (
                  <span className="text-4xl">{g.emoji}</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold">{g.name}</p>
                  <p className="text-xs text-white/80">
                    {g.deadline
                      ? `Дедлайн: ${new Date(g.deadline).toLocaleDateString('ru-RU')}`
                      : 'Без дедлайна'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    haptic();
                    setEditGoal(g);
                  }}
                  className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold"
                >
                  ✎
                </button>
              </div>
              <ProgressBar value={ratio} color="#ffffff" className="bg-white/25" />
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className="text-sm text-white/90">
                    {fmtMoney(g.savedAmount)} из {fmtMoney(g.targetAmount)}
                  </p>
                  <p className="text-xs text-white/70">осталось накопить {fmtMoney(remainingToSave)}</p>
                </div>
                <button
                  onClick={() => {
                    haptic();
                    setContribGoal(g);
                  }}
                  className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-ink"
                >
                  Пополнить
                </button>
              </div>
              {g.contributions && g.contributions.length > 0 && (
                <div className="mt-3 border-t border-white/20 pt-2">
                  {g.contributions.slice(0, 3).map((c) => (
                    <div key={c.id} className="flex justify-between text-xs text-white/80">
                      <span>{fmtDate(c.date)}</span>
                      <span>{fmtMoney(c.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  haptic();
                  setArchiveGoal(g);
                }}
                className="mt-3 text-xs text-white/60 underline"
              >
                Архив
              </button>
            </div>
          );
        })}
      </div>

      {completed.length > 0 && (
        <section className="mt-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Достигнутые</p>
          <div className="flex flex-col gap-2">
            {completed.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft"
              >
                <span className="text-2xl opacity-60">{g.emoji}</span>
                <div className="flex-1">
                  <p className="font-medium opacity-70">{g.name}</p>
                  <p className="text-xs text-muted">{fmtMoney(g.targetAmount)}</p>
                </div>
                <span className="text-lg">🏆</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <ContributeSheet
        goal={contribGoal}
        amount={amount}
        setAmount={setAmount}
        date={contributeDate}
        setDate={setContributeDate}
        busy={busy}
        onClose={() => setContribGoal(null)}
        onSave={() => contribGoal && contribute(contribGoal.id)}
      />

      <EditGoalSheet goal={editGoal} onClose={() => setEditGoal(null)} onSaved={() => refresh()} />

      <ConfirmSheet
        open={!!archiveGoal}
        title="Архивировать цель?"
        text="История пополнений сохранится, прогресс не исчезнет."
        confirmLabel="Архивировать"
        busy={busy}
        onConfirm={() => archiveGoal && archive(archiveGoal.id)}
        onClose={() => setArchiveGoal(null)}
      />

      <CreateGoalSheet open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => refresh()} />
    </div>
  );
}

function ContributeSheet({
  goal,
  amount,
  setAmount,
  date,
  setDate,
  busy,
  onClose,
  onSave,
}: {
  goal: Goal | null;
  amount: string;
  setAmount: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  busy: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Sheet open={!!goal} onClose={onClose} title={goal ? `Пополнить: ${goal.name}` : ''}>
      <AmountInput big autoFocus value={amount} onChange={setAmount} />
      <p className="mt-4 mb-2 text-xs font-medium uppercase tracking-wide text-muted">Дата</p>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mb-4 w-full rounded-card bg-pagebg px-5 py-3.5 text-sm outline-none"
      />
      <p className="mb-4 text-sm text-muted">
        Пополнение уменьшит «доступно до конца месяца» — считается фактическим накоплением.
      </p>
      <button
        onClick={onSave}
        disabled={toKopecks(amount) <= 0 || busy}
        className="w-full rounded-card bg-rosytaupe py-3.5 font-semibold text-white disabled:opacity-40"
      >
        Пополнить
      </button>
    </Sheet>
  );
}

function CreateGoalSheet({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  return <GoalFormSheet open={open} mode="create" onClose={onClose} onDone={onCreated} />;
}

function EditGoalSheet({
  goal,
  onClose,
  onSaved,
}: {
  goal: Goal | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <GoalFormSheet
      open={!!goal}
      mode="edit"
      goal={goal ?? undefined}
      onClose={onClose}
      onDone={onSaved}
    />
  );
}

function GoalFormSheet({
  open,
  mode,
  goal,
  onClose,
  onDone,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  goal?: Goal;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(goal?.name ?? '');
    setEmoji(goal?.emoji ?? EMOJIS[0]);
    setColor(goal?.color ?? COLORS[0]);
    setTarget(goal ? String(goal.targetAmount / 100) : '');
    setDeadline(goal?.deadline ? goal.deadline.slice(0, 10) : '');
    setError(null);
  }, [open, goal]);

  const validTarget = toKopecks(target) > 0;

  async function handleSave() {
    if (!name.trim() || !validTarget || busy) return;
    setBusy(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        emoji,
        color,
        targetAmount: toKopecks(target),
        ...(deadline ? { deadline: new Date(deadline).toISOString() } : {}),
      };
      if (mode === 'create') {
        await api.post('/goals', payload);
      } else if (goal) {
        await api.patch(`/goals/${goal.id}`, payload);
      }
      notifySuccess();
      haptic();
      onDone();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={mode === 'create' ? 'Новая цель' : 'Редактировать цель'}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Например, Поездка в Сочи"
        className="mb-3 w-full rounded-card bg-pagebg px-5 py-3.5 text-sm outline-none placeholder:text-muted/50"
      />
      <div className="mb-3 rounded-card bg-pagebg px-3">
        <AmountInput value={target} onChange={setTarget} placeholder="Целевая сумма" />
      </div>
      <input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        className="mb-3 w-full rounded-card bg-pagebg px-5 py-3.5 text-sm text-ink outline-none"
      />
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Эмодзи</p>
      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
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
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Цвет обложки</p>
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
        onClick={handleSave}
        disabled={!name.trim() || !validTarget || busy}
        className="w-full rounded-card bg-rosytaupe py-3.5 font-semibold text-white disabled:opacity-40"
      >
        {mode === 'create' ? 'Создать цель' : 'Сохранить'}
      </button>
    </Sheet>
  );
}