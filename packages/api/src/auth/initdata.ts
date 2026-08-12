import { createHmac, timingSafeEqual } from 'crypto';

const AUTH_DATE_TTL_SECONDS = 86400;

export interface TelegramUser {
  id: number;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface ParsedInitData {
  user?: TelegramUser;
  authDate?: number;
  hash?: string;
  raw: string;
}

export function parseInitData(initData: string): ParsedInitData {
  const params = new URLSearchParams(initData);

  let user: TelegramUser | undefined;
  try {
    const parsed = params.get('user') ? JSON.parse(params.get('user') as string) : undefined;
    if (parsed && parsed.id) {
      user = {
        id: Number(parsed.id),
        firstName: parsed.first_name,
        lastName: parsed.last_name,
        username: parsed.username,
      };
    }
  } catch {
    user = undefined;
  }

  const authDate = params.get('auth_date');
  return {
    user,
    authDate: authDate ? Number(authDate) : undefined,
    hash: params.get('hash') ?? undefined,
    raw: initData,
  };
}

/**
 * Строит data_check_string по правилам Telegram:
 * пары key=URL-decode(value), отсортированные по ключу, разделённые \n, без hash.
 */
export function buildDataCheckString(initData: string): string {
  const params = new URLSearchParams(initData);
  const pairs: Array<[string, string]> = [];
  params.forEach((value, key) => {
    if (key === 'hash') return;
    pairs.push([key, value]);
  });
  pairs.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return pairs.map(([k, v]) => `${k}=${v}`).join('\n');
}

export function validateInitData(initData: string, botToken: string): boolean {
  const parsed = parseInitData(initData);
  if (!parsed.hash || !parsed.authDate) return false;

  const nowSec = Math.floor(Date.now() / 1000);
  if (parsed.authDate > nowSec + 300) return false;
  if (nowSec - parsed.authDate > AUTH_DATE_TTL_SECONDS) return false;

  const dataCheckString = buildDataCheckString(initData);
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = createHmac('sha256', secretKey).update(dataCheckString).digest();
  const provided = Buffer.from(parsed.hash, 'hex');

  if (provided.length !== expected.length) return false;
  return timingSafeEqual(expected, provided);
}