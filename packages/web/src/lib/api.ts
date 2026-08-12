import { getInitData } from './telegram';

const TOKEN_KEY = 'money_tocka_token';
let token: string | null = sessionStorage.getItem(TOKEN_KEY);

function devInitData(): string {
  const user = JSON.stringify({ id: 777000001, first_name: 'Dev', username: 'dev' });
  return `user=${encodeURIComponent(user)}&auth_date=${Math.floor(Date.now() / 1000)}&query_id=dev&hash=dev`;
}

async function login(): Promise<void> {
  const initData = getInitData() || (import.meta.env.DEV ? devInitData() : '');
  if (!initData) throw new Error('Данные входа Telegram недоступны');

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ initData }),
  });
  if (!res.ok) throw new Error('Не удалось войти через Telegram');
  const data = (await res.json()) as { token: string };
  token = data.token;
  sessionStorage.setItem(TOKEN_KEY, data.token);
}

export async function initSession(): Promise<void> {
  if (!token || token.split('.').length !== 2) {
    await login();
  }
}

type Options = { body?: unknown; query?: Record<string, string | number | undefined> };

async function request<T>(path: string, opts: Options = {}, method = 'GET'): Promise<T> {
  const qs = opts.query
    ? '?' +
      Object.entries(opts.query)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';

  const doFetch = async (): Promise<Response> => {
    const headers = new Headers();
    if (token) headers.set('authorization', `Bearer ${token}`);
    if (opts.body) headers.set('content-type', 'application/json');
    return fetch(`/api${path}${qs}`, {
      method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  };

  let res = await doFetch();
  if (res.status === 401) {
    await login();
    res = await doFetch();
  }
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? `Ошибка ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, query?: Options['query']) => request<T>(path, { query }),
  post: <T>(path: string, body: unknown) => request<T>(path, { body }, 'POST'),
  patch: <T>(path: string, body: unknown) => request<T>(path, { body }, 'PATCH'),
  del: <T>(path: string) => request<T>(path, {}, 'DELETE'),
};

export async function downloadCsv(path: string): Promise<void> {
  let res = await fetch(`/api${path}`, { headers: token ? { authorization: `Bearer ${token}` } : {} });
  if (res.status === 401) {
    await login();
    res = await fetch(`/api${path}`, { headers: token ? { authorization: `Bearer ${token}` } : {} });
  }
  if (!res.ok) throw new Error('Не удалось сформировать CSV');
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = 'money-tocka-expenses.csv';
  link.click();
  URL.revokeObjectURL(url);
}
