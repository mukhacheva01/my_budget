import { createHmac } from 'crypto';
import { buildDataCheckString, parseInitData, validateInitData } from './initdata';

const BOT_TOKEN = '123456:TEST-BOT-TOKEN';
const now = Math.floor(Date.now() / 1000);

function sign(initData: string, token: string): string {
  const secretKey = createHmac('sha256', 'WebAppData').update(token).digest();
  const checkString = buildDataCheckString(initData);
  return createHmac('sha256', secretKey).update(checkString).digest('hex');
}

function makeInitData(overrides: Record<string, string> = {}): string {
  const pairs = {
    query_id: 'AAHdF6IQAAAAAN0XohDhrOrc',
    user: JSON.stringify({ id: 123456789, first_name: 'Иван', last_name: 'Иванов', username: 'ivan' }),
    auth_date: String(now),
    ...overrides,
  };
  const sorted = Object.entries(pairs).map(([k, v]) => `${k}=${v}`).join('&');
  const hash = sign(sorted, BOT_TOKEN);
  return `${sorted}&hash=${hash}`;
}

describe('initdata (подпись Telegram)', () => {
  it('строит data_check_string без hash, в алфавитном порядке ключей', () => {
    const s = buildDataCheckString('b=2&a=1&hash=zzz');
    expect(s).toBe('a=1\nb=2');
  });

  it('валидирует корректный initData', () => {
    expect(validateInitData(makeInitData(), BOT_TOKEN)).toBe(true);
  });

  it('отклоняет подделанные данные', () => {
    const valid = makeInitData();
    const params = new URLSearchParams(valid);
    params.set('user', JSON.stringify({ id: 999999, first_name: 'Хакер' }));
    const forged = params.toString().replace(/&hash=[^&]*$/, `&hash=${params.get('hash')}`);
    expect(validateInitData(forged, BOT_TOKEN)).toBe(false);
  });

  it('отклоняет просроченный auth_date', () => {
    const old = makeInitData({ auth_date: String(now - 100000) });
    expect(validateInitData(old, BOT_TOKEN)).toBe(false);
  });

  it('отклоняет initData без hash', () => {
    const noHash = makeInitData().replace(/&hash=.*$/, '');
    expect(validateInitData(noHash, BOT_TOKEN)).toBe(false);
  });

  it('разбирает пользователя', () => {
    const parsed = parseInitData(makeInitData());
    expect(parsed.user?.id).toBe(123456789);
    expect(parsed.user?.firstName).toBe('Иван');
  });
});