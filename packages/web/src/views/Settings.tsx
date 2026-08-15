import { useEffect, useState } from 'react';
import { useAppData } from '../lib/useAppData';
import { api } from '../lib/api';
import { haptic, notifySuccess, notifyError } from '../lib/telegram';
import { useToast } from '../components/Toast';
import ConfirmSheet from '../components/ConfirmSheet';
import type { User } from '../types';

interface FullUser extends User {
  weekStartsOn?: number;
  notifyDailyReminder?: boolean;
  notifyReminderHour?: number;
  notifyLimitWarning?: boolean;
  notifyMonthStart?: boolean;
}

export default function Settings() {
  const { refresh } = useAppData();
  const { toast } = useToast();
  const [user, setUser] = useState<FullUser | null>(null);
  const [currency, setCurrency] = useState('RUB');
  const [timezone, setTimezone] = useState('');
  const [notifyDaily, setNotifyDaily] = useState(false);
  const [notifyHour, setNotifyHour] = useState(20);
  const [notifyLimit, setNotifyLimit] = useState(false);
  const [notifyMonth, setNotifyMonth] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    api
      .get<FullUser>('/users/me')
      .then((data) => {
        setUser(data);
        setCurrency(data.currency || 'RUB');
        setTimezone(data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || '');
        setNotifyDaily(data.notifyDailyReminder ?? false);
        setNotifyHour(data.notifyReminderHour ?? 20);
        setNotifyLimit(data.notifyLimitWarning ?? false);
        setNotifyMonth(data.notifyMonthStart ?? false);
      })
      .catch(() => {});
  }, []);

  async function saveProfile() {
    if (saving) return;
    setSaving(true);
    try {
      const updated = await api.patch<FullUser>('/users/me', {
        currency,
        timezone,
        notifyDailyReminder: notifyDaily,
        notifyReminderHour: notifyHour,
        notifyLimitWarning: notifyLimit,
        notifyMonthStart: notifyMonth,
      });
      setUser(updated);
      notifySuccess();
      toast('Сохранено', 'success');
    } catch {
      notifyError();
      toast('Ошибка сохранения', 'error');
    } finally {
      setSaving(false);
    }
  }

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    haptic();
  }

  async function deleteAccount() {
    try {
      await api.del('/users/me');
      toast('Аккаунт удалён', 'success');
      sessionStorage.clear();
      window.location.reload();
    } catch {
      toast('Не удалось удалить', 'error');
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-6 pb-8">
      <h1 className="text-2xl font-bold">\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438</h1>

      <div className="mt-5 flex items-center gap-4 rounded-card bg-white p-5 shadow-soft dark:bg-zinc-800">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rosytaupe text-2xl font-bold text-white">
          {(user?.firstName ?? '\u0411').charAt(0)}
        </div>
        <div>
          <p className="font-semibold dark:text-white">
            {user?.firstName}
            {user?.lastName ? ` ${user.lastName}` : ''}
          </p>
          <p className="text-sm text-muted">
            {user?.username ? `@${user.username}` : '\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c Telegram'}
          </p>
        </div>
      </div>

      {/* \u0420\u0435\u0433\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u044b\u0435 */}
      <div className="mt-4 rounded-card bg-white p-5 shadow-soft dark:bg-zinc-800">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">\u0420\u0435\u0433\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u044b\u0435</p>
        <label className="mt-3 block text-sm text-muted">\u0412\u0430\u043b\u044e\u0442\u0430</label>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 w-full rounded-2xl bg-pagebg px-4 py-3 text-sm outline-none dark:bg-zinc-700 dark:text-white">
          <option value="RUB">\u0420\u043e\u0441\u0441\u0438\u0439\u0441\u043a\u0438\u0439 \u0440\u0443\u0431\u043b\u044c (\u20bd)</option>
          <option value="USD">US Dollar ($)</option>
          <option value="EUR">Euro (\u20ac)</option>
          <option value="KZT">\u0422\u0435\u043d\u0433\u0435 (\u20b8)</option>
        </select>
        <label className="mt-3 block text-sm text-muted">\u0427\u0430\u0441\u043e\u0432\u043e\u0439 \u043f\u043e\u044f\u0441</label>
        <input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Europe/Moscow" className="mt-1 w-full rounded-2xl bg-pagebg px-4 py-3 text-sm outline-none dark:bg-zinc-700 dark:text-white" />
      </div>

      {/* \u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f */}
      <div className="mt-4 rounded-card bg-white p-5 shadow-soft dark:bg-zinc-800">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f</p>
        <Toggle label="\u0415\u0436\u0435\u0434\u043d\u0435\u0432\u043d\u043e\u0435 \u043d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u0435" checked={notifyDaily} onChange={setNotifyDaily} />
        {notifyDaily && (
          <div className="ml-1 mt-2 flex items-center gap-2">
            <span className="text-sm text-muted">\u0412\u0440\u0435\u043c\u044f:</span>
            <select value={notifyHour} onChange={(e) => setNotifyHour(Number(e.target.value))} className="rounded-xl bg-pagebg px-3 py-2 text-sm outline-none dark:bg-zinc-700 dark:text-white">
              {Array.from({ length: 24 }).map((_, h) => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
        )}
        <Toggle label="\u041f\u0440\u0435\u0434\u0443\u043f\u0440\u0435\u0436\u0434\u0435\u043d\u0438\u0435 \u043e \u043b\u0438\u043c\u0438\u0442\u0435" checked={notifyLimit} onChange={setNotifyLimit} />
        <Toggle label="\u041d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u0435 \u0432 \u043d\u0430\u0447\u0430\u043b\u0435 \u043c\u0435\u0441\u044f\u0446\u0430" checked={notifyMonth} onChange={setNotifyMonth} />
      </div>

      {/* \u0412\u043d\u0435\u0448\u043d\u0438\u0439 \u0432\u0438\u0434 */}
      <div className="mt-4 rounded-card bg-white p-5 shadow-soft dark:bg-zinc-800">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">\u0412\u043d\u0435\u0448\u043d\u0438\u0439 \u0432\u0438\u0434</p>
        <Toggle label="\u0422\u0451\u043c\u043d\u0430\u044f \u0442\u0435\u043c\u0430" checked={darkMode} onChange={toggleDarkMode} />
      </div>

      <button onClick={saveProfile} disabled={saving} className="mt-4 w-full rounded-full bg-rosytaupe py-3.5 font-semibold text-white disabled:opacity-40">
        {saving ? '\u0421\u043e\u0445\u0440\u0430\u043d\u044f\u044e...' : '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c'}
      </button>

      <button
        onClick={() => { haptic(); void refresh(); toast('\u0414\u0430\u043d\u043d\u044b\u0435 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u044b', 'success'); }}
        className="mt-3 w-full rounded-full border border-rosytaupe/20 py-3 text-sm font-semibold text-rosytaupe"
      >
        \u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u0434\u0430\u043d\u043d\u044b\u0435
      </button>

      {/* \u0423\u0434\u0430\u043b\u0435\u043d\u0438\u0435 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430 */}
      <div className="mt-8 rounded-card bg-red-50 p-5 dark:bg-red-900/20">
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">\u041e\u043f\u0430\u0441\u043d\u0430\u044f \u0437\u043e\u043d\u0430</p>
        <p className="mt-1 text-xs text-red-500/80">\u0423\u0434\u0430\u043b\u0435\u043d\u0438\u0435 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430 \u0443\u0434\u0430\u043b\u0438\u0442 \u0432\u0441\u0435 \u0432\u0430\u0448\u0438 \u0434\u0430\u043d\u043d\u044b\u0435 \u0431\u0435\u0437\u0432\u043e\u0437\u0432\u0440\u0430\u0442\u043d\u043e.</p>
        <button
          onClick={() => setConfirmDelete(true)}
          className="mt-3 rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white"
        >
          \u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442
        </button>
      </div>

      <ConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442?"
        description="\u0412\u0441\u0435 \u0431\u044e\u0434\u0436\u0435\u0442\u044b, \u0440\u0430\u0441\u0445\u043e\u0434\u044b \u0438 \u0446\u0435\u043b\u0438 \u0431\u0443\u0434\u0443\u0442 \u0443\u0434\u0430\u043b\u0435\u043d\u044b \u043d\u0430\u0432\u0441\u0435\u0433\u0434\u0430."
        confirmLabel="\u0423\u0434\u0430\u043b\u0438\u0442\u044c"
        destructive
        onConfirm={deleteAccount}
      />

      <p className="mt-6 text-center text-xs text-muted">Budget App v0.3</p>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => { onChange(!checked); haptic(); }}
      className="mt-3 flex w-full items-center justify-between"
    >
      <span className="text-sm dark:text-white">{label}</span>
      <div className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-success' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
        <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
    </button>
  );
}
