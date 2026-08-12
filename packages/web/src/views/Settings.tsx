import { useEffect, useState } from 'react';
import { useAppData } from '../lib/useAppData';
import { api } from '../lib/api';
import { haptic, notifySuccess } from '../lib/telegram';
import type { User } from '../types';

export default function Settings() {
  const { refresh } = useAppData();
  const [user, setUser] = useState<User | null>(null);
  const [currency, setCurrency] = useState('RUB');
  const [timezone, setTimezone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<User>('/users/me')
      .then((data) => {
        setUser(data);
        setCurrency(data.currency || 'RUB');
        setTimezone(data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || '');
      })
      .catch(() => {});
  }, []);

  async function saveProfile() {
    if (saving) return;
    setSaving(true);
    try {
      const updated = await api.patch<User>('/users/me', { currency, timezone });
      setUser(updated);
      notifySuccess();
      haptic();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <h1 className="text-2xl font-bold">Настройки</h1>

      <div className="mt-5 flex items-center gap-4 rounded-card bg-white p-5 shadow-soft">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rosytaupe text-2xl font-bold text-white">
          {(user?.firstName ?? 'Б').charAt(0)}
        </div>
        <div>
          <p className="font-semibold">
            {user?.firstName}
            {user?.lastName ? ` ${user.lastName}` : ''}
          </p>
          <p className="text-sm text-muted">
            {user?.username ? `@${user.username}` : 'Пользователь Telegram'}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-card bg-white p-5 shadow-soft">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Профиль</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-muted">Валюта</span>
          <span className="font-medium">{user?.currency ?? 'RUB'}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-muted">Имя из Telegram</span>
          <span className="font-medium">{user?.firstName ?? '—'}</span>
        </div>
      </div>

      <div className="mt-4 rounded-card bg-white p-5 shadow-soft">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Региональные настройки</p>
        <label className="mt-3 block text-sm text-muted">Валюта</label>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 w-full rounded-2xl bg-pagebg px-4 py-3 text-sm outline-none">
          <option value="RUB">Российский рубль (₽)</option>
        </select>
        <label className="mt-3 block text-sm text-muted">Часовой пояс</label>
        <input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Europe/Samara" className="mt-1 w-full rounded-2xl bg-pagebg px-4 py-3 text-sm outline-none" />
        <button onClick={saveProfile} disabled={saving} className="mt-3 w-full rounded-full bg-rosytaupe py-3 text-sm font-semibold text-white disabled:opacity-40">
          Сохранить настройки
        </button>
      </div>

      <div className="mt-4 rounded-card bg-white p-5 shadow-soft">
        <p className="font-semibold">Как это работает</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          В начале месяца укажите доход, распределите его по категориям и запланируйте отчисления в
          цели. Добавляйте расходы вручную. «Запланировано» — намерение, «накоплено» — деньги,
          которые вы реально отложили. Приложение не связано с реальными банковскими счетами.
        </p>
      </div>

      <button
        onClick={() => {
          haptic();
          void refresh();
          notifySuccess();
        }}
        className="mt-4 w-full rounded-card bg-rosytaupe py-3.5 font-semibold text-white"
      >
        Обновить данные
      </button>

      <p className="mt-6 text-center text-xs text-muted">Мани.точка · v0.2 — MVP</p>
    </div>
  );
}
