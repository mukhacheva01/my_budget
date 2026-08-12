export const MONTHS_GEN = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

export const MONTHS_SHORT = [
  'янв',
  'фев',
  'мар',
  'апр',
  'май',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
];

export function monthName(m: number): string {
  return MONTHS_GEN[m - 1] ?? '';
}

export function monthShort(m: number): string {
  return MONTHS_SHORT[m - 1] ?? '';
}

/** Рубли из строки ввода → целые копейки. */
export function toKopecks(str: string): number {
  const num = parseFloat(String(str).replace(',', '.').replace(/\s/g, ''));
  if (isNaN(num) || num <= 0) return 0;
  return Math.round(num * 100);
}

/** Копейки → строка рублей для поля ввода (без символа валюты): 40000 → "400". */
export function kopecksToInput(kopecks: number): string {
  const rubles = kopecks / 100;
  return rubles % 1 === 0 ? String(rubles) : String(Math.round(rubles * 100) / 100);
}

/** Копейки → «40 000 ₽». Безопасно для целых копеек. */
export function fmtMoney(kopecks: number): string {
  const neg = kopecks < 0;
  const abs = Math.abs(Math.round(kopecks));
  const rubles = Math.floor(abs / 100);
  const kop = String(abs % 100).padStart(2, '0');
  const rubStr = rubles.toLocaleString('ru-RU');
  const body = abs % 100 === 0 ? `${rubStr} ₽` : `${rubStr},${kop} ₽`;
  return neg ? `−${body}` : body;
}

export function fmtSigned(kopecks: number): string {
  const neg = kopecks < 0;
  return `${neg ? '−' : '+'} ${fmtMoney(Math.abs(kopecks))}`;
}

export function fmtNumberKopecks(kopecks: number): string {
  const rubles = kopecks / 100;
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(rubles);
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtDay(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startToday.getTime() - startDay.getTime()) / 86400000);
  if (diffDays === 0) return 'Сегодня';
  if (diffDays === 1) return 'Вчера';
  return `${d.getDate()} ${monthShort(d.getMonth() + 1)}`;
}

export function shortMoneyKopecks(kopecks: number): string {
  const rubles = kopecks / 100;
  if (rubles >= 1_000_000) return `${(rubles / 1_000_000).toFixed(1).replace('.0', '')} млн ₽`;
  if (rubles >= 1_000) return `${(rubles / 1_000).toFixed(1).replace('.0', '')} тыс ₽`;
  return fmtMoney(kopecks);
}